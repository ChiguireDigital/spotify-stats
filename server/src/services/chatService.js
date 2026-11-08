import { saveChatMessage, getRecentChatMessages } from '../db/repositories/chat.js';
import { buildChatContext } from './chatContext.js';
import { generateChatReply } from './geminiService.js';

const SYSTEM_INSTRUCTION = `Eres el asistente musical de Spotify Stats. Hablas con el usuario de forma natural, cercana y clara, como un amigo que conoce sus gustos.
Para datos personales del usuario (qué escucha, sus tops, su historial, qué suena ahora), usa SOLO la información que se te proporciona. No inventes sus estadísticas, fechas ni cifras.
Para preguntas generales sobre música, artistas, canciones, álbumes, géneros u origen (por ejemplo, "¿de dónde es esta canción/tema?"), puedes responder con tu conocimiento general; si no estás seguro, dilo con honestidad.
Si te preguntan qué está sonando ahora, usa la "Reproducción actual (en vivo)" de la información proporcionada.
Interpreta preguntas cotidianas con sentido común: "último mes" o "este mes" ≈ últimas ~4 semanas; "últimos meses" ≈ últimos ~6 meses; "de siempre"/"en general" ≈ de siempre.
No menciones términos técnicos internos como "medium_term", "ranking_snapshots", "contexto", "base de datos" o IDs. Habla como persona.
Al mencionar canciones, artistas o álbumes, usa comillas (por ejemplo: "Laura Palmer's Theme"), nunca negritas ni markdown como **texto**.
Si falta información personal, dilo de forma amable y simple, sin sonar robótico. Sé breve cuando la pregunta es simple.`;

function isNowPlayingQuestion(text) {
  const t = String(text || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const asksNow = /\bahora\b|\ben este momento\b|\bjusto ahora\b|\bnow\b/.test(t);
  const asksPlaying = /\b(que|q)\b.*\b(escucho|escuchando|oyendo|suena|sonando|reproduciendo|escuchas)\b|\bestoy escuchando\b|\bque suena\b|\bnow playing\b/.test(t);
  return asksNow && asksPlaying;
}

function localNowPlayingReply(nowPlaying) {
  const item = nowPlaying?.item?.item;
  if (nowPlaying?.error) return null;
  if (!item) return 'Ahora mismo no tienes nada sonando en Spotify.';
  const artists = (item.artists || []).map((a) => a.name).filter(Boolean).join(', ');
  const state = nowPlaying.item.is_playing ? 'está sonando' : 'está en pausa';
  return `Ahora mismo ${state} "${item.name}"${artists ? ` de ${artists}` : ''}${item.album?.name ? ` (álbum: "${item.album.name}")` : ''}.`;
}

export async function handleChatMessage(userId, userMessage, { nowPlaying = null } = {}) {
  const text = String(userMessage || '').trim();
  if (!text) throw new Error('Escribe una pregunta.');
  if (text.length > 1000) throw new Error('La pregunta es demasiado larga.');
  await saveChatMessage(userId, 'user', text);

  if (isNowPlayingQuestion(text)) {
    const local = localNowPlayingReply(nowPlaying);
    if (local) {
      await saveChatMessage(userId, 'assistant', local);
      return local;
    }
  }

  const [context, history] = await Promise.all([
    buildChatContext(userId, { nowPlaying }),
    getRecentChatMessages(userId, 8),
  ]);
  let reply = await generateChatReply({ systemInstruction: SYSTEM_INSTRUCTION, userMessage: text, history, context });
  reply = reply.replace(/\*\*(.+?)\*\*/g, '"$1"').replace(/__(.+?)__/g, '"$1"');
  await saveChatMessage(userId, 'assistant', reply);
  return reply;
}

export async function getChatHistory(userId, limit = 30) {
  return getRecentChatMessages(userId, limit);
}
