import { Server } from 'socket.io';
import { config } from '../config/env.js';
import { sessionMiddleware } from '../session.js';
import { handleChatMessage, getChatHistory } from '../services/chatService.js';
import { getValidAccessToken } from '../auth/spotifyAuth.js';
import { fetchWithTimeout } from '../utils/fetch.js';
import { checkSocketRate } from '../middleware/rateLimit.js';

function wrapSession(socket, next) {
  sessionMiddleware(socket.request, { getHeader() {}, setHeader() {}, end() {}, on() {}, writeHead() {} }, next);
}

async function fetchNowPlaying(requestLike) {
  const accessToken = await getValidAccessToken(requestLike);
  if (!accessToken) return { error: 'unauthorized' };
  const res = await fetchWithTimeout('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, 12000);
  if (res.status === 204) return { item: null };
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) return { error: payload.error?.message || 'spotify_error' };
  return { item: payload };
}

export function attachRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.clientOrigin, credentials: true },
  });

  io.use(wrapSession);

  io.use((socket, next) => {
    const userId = socket.request.session?.spotify?.userId;
    if (!userId) return next(new Error('unauthorized'));
    socket.data.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    const { userId } = socket.data;
    socket.join(`user:${userId}`);
    let nowPlayingTimer = null;

    socket.on('chat:history', async (_payload, ack) => {
      try {
        const messages = await getChatHistory(userId, 30);
        if (typeof ack === 'function') ack({ ok: true, messages });
        else socket.emit('chat:history', { messages });
      } catch (e) {
        if (typeof ack === 'function') ack({ ok: false, error: e.message });
      }
    });

    socket.on('chat:message', async ({ message } = {}, ack) => {
      try {
        const limit = checkSocketRate(userId, { windowMs: 60_000, max: 12, keyPrefix: 'chat' });
        if (!limit.ok) {
          const payload = { ok: false, error: 'Estás enviando mensajes muy rápido. Espera un momento e inténtalo de nuevo.' };
          if (typeof ack === 'function') ack(payload);
          socket.emit('chat:error', payload);
          return;
        }
        socket.emit('chat:typing', { typing: true });
        let nowPlaying = null;
        try { nowPlaying = await fetchNowPlaying({ session: socket.request.session }); } catch {}
        const reply = await handleChatMessage(userId, message, { nowPlaying });
        socket.emit('chat:typing', { typing: false });
        const payload = { ok: true, reply };
        if (typeof ack === 'function') ack(payload);
        socket.emit('chat:reply', payload);
      } catch (e) {
        socket.emit('chat:typing', { typing: false });
        const payload = { ok: false, error: e.message || 'No se pudo responder.' };
        if (typeof ack === 'function') ack(payload);
        socket.emit('chat:error', payload);
      }
    });

    const pushNowPlaying = async () => {
      try {
        const result = await fetchNowPlaying({ session: socket.request.session });
        socket.emit('now-playing:update', result);
      } catch (e) {
        socket.emit('now-playing:update', { error: e.message });
      }
    };

    socket.on('now-playing:start', () => {
      if (nowPlayingTimer) return;
      pushNowPlaying();
      nowPlayingTimer = setInterval(pushNowPlaying, 12000);
    });

    socket.on('now-playing:stop', () => {
      if (nowPlayingTimer) clearInterval(nowPlayingTimer);
      nowPlayingTimer = null;
    });

    socket.on('disconnect', () => {
      if (nowPlayingTimer) clearInterval(nowPlayingTimer);
    });
  });

  return io;
}
