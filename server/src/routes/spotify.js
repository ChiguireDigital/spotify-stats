import { Router } from 'express';
import { getValidAccessToken } from '../auth/spotifyAuth.js';
import { syncAll, syncRecentlyPlayed, syncTopArtists, syncTopTracks } from '../services/syncService.js';
import { fetchWithTimeout } from '../utils/fetch.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();
const RANGES = new Set(['short_term', 'medium_term', 'long_term']);
const safeRange = (v) => (RANGES.has(v) ? v : 'medium_term');

function getUserId(request) {
  return request.session?.spotify?.userId || null;
}

async function spotifyRequest(request, response, path) {
  const accessToken = await getValidAccessToken(request);
  if (!accessToken) {
    response.status(401).json({ error: 'La sesión de Spotify expiró.' });
    return { payload: null, accessToken: null };
  }
  let spotifyResponse;
  try {
    spotifyResponse = await fetchWithTimeout(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${accessToken}` } }, 15000);
  } catch (error) {
    console.error(`Spotify ${path}:`, error.message);
    response.status(504).json({ error: 'No se pudo conectar con Spotify. Verifica tu conexión e inténtalo de nuevo.' });
    return { payload: null, accessToken };
  }
  if (spotifyResponse.status === 204) return { payload: null, accessToken };
  const payload = await spotifyResponse.json().catch(() => ({}));
  if (!spotifyResponse.ok) {
    response.status(spotifyResponse.status).json({ error: payload.error?.message || 'Spotify no pudo responder.' });
    return { payload: null, accessToken };
  }
  return { payload, accessToken };
}

router.get('/profile', async (request, response, next) => {
  try {
    const { payload } = await spotifyRequest(request, response, '/me');
    if (payload) response.json(payload);
  } catch (error) { next(error); }
});

router.get('/currently-playing', async (request, response, next) => {
  try {
    const { payload } = await spotifyRequest(request, response, '/me/player/currently-playing');
    if (!response.headersSent) response.json(payload);
  } catch (error) { next(error); }
});

router.get('/top/artists', async (request, response, next) => {
  try {
    const range = safeRange(request.query.time_range);
    const { payload, accessToken } = await spotifyRequest(request, response, `/me/top/artists?limit=5&time_range=${encodeURIComponent(range)}`);
    if (!payload) return;
    response.json(payload);
    const userId = getUserId(request);
    if (userId && accessToken) syncTopArtists(userId, accessToken, range).catch((e) => console.error('syncTopArtists:', e.message));
  } catch (error) { next(error); }
});

router.get('/top/tracks', async (request, response, next) => {
  try {
    const range = safeRange(request.query.time_range);
    const { payload, accessToken } = await spotifyRequest(request, response, `/me/top/tracks?limit=5&time_range=${encodeURIComponent(range)}`);
    if (!payload) return;
    response.json(payload);
    const userId = getUserId(request);
    if (userId && accessToken) syncTopTracks(userId, accessToken, range).catch((e) => console.error('syncTopTracks:', e.message));
  } catch (error) { next(error); }
});

router.get('/recently-played', async (request, response, next) => {
  try {
    const limit = Math.min(Number(request.query.limit) || 20, 50);
    const { payload, accessToken } = await spotifyRequest(request, response, `/me/player/recently-played?limit=${limit}`);
    if (!payload) return;
    response.json(payload);
    const userId = getUserId(request);
    if (userId && accessToken) syncRecentlyPlayed(userId, accessToken, limit).catch((e) => console.error('syncRecentlyPlayed:', e.message));
  } catch (error) { next(error); }
});

function allowedArtworkHost(url) {
  try {
    const h = new URL(url).hostname;
    return h === 'i.scdn.co' || h.endsWith('.scdn.co') || h.endsWith('.spotifycdn.com') || h.endsWith('.spotify.com');
  } catch { return false; }
}

router.get('/artwork', async (request, response) => {
  if (!request.session?.spotify?.userId) return response.status(401).json({ error: 'No autenticado.' });
  const url = String(request.query.url || '');
  if (!url || !allowedArtworkHost(url)) return response.status(400).json({ error: 'URL de imagen no permitida.' });
  try {
    const upstream = await fetchWithTimeout(url, {}, 12000);
    if (!upstream.ok) return response.status(502).json({ error: 'No se pudo obtener la imagen.' });
    response.setHeader('Content-Type', upstream.headers['content-type'] || 'image/jpeg');
    response.setHeader('Cache-Control', 'private, max-age=86400');
    response.send(upstream.buffer);
  } catch {
    response.status(504).json({ error: 'No se pudo obtener la imagen.' });
  }
});

router.post('/sync', rateLimit({ windowMs: 60_000, max: 6, keyPrefix: 'sync' }), async (request, response, next) => {
  try {
    const accessToken = await getValidAccessToken(request);
    const userId = getUserId(request);
    if (!accessToken || !userId) return response.status(401).json({ error: 'La sesión de Spotify expiró. Cierra sesión y vuelve a entrar.' });
    const result = await syncAll(userId, accessToken);
    response.json({ ok: true, syncedAt: new Date().toISOString(), result });
  } catch (error) {
    console.error('POST /sync:', error.message);
    response.status(error.code === 'FETCH_TIMEOUT' || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ? 504 : 500)
      .json({ error: error.message || 'No se pudo sincronizar con Spotify.' });
  }
});

export default router;

