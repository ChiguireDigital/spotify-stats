import { pool } from '../db/pool.js';

function fmtDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

async function topArtists(userId, timeRange, limit = 10) {
  const [rows] = await pool.execute(
    `SELECT a.name FROM ranking_snapshots rs JOIN artists a ON a.id = rs.artist_id
     WHERE rs.user_id = ? AND rs.item_type = 'artist' AND rs.time_range = ?
     ORDER BY rs.ranking_position ASC LIMIT ${Math.min(Number(limit) || 10, 20)}`,
    [userId, timeRange],
  );
  return rows.map((r, i) => `${i + 1}. ${r.name}`);
}

async function topTracks(userId, timeRange, limit = 10) {
  const [rows] = await pool.execute(
    `SELECT t.name, t.album_name FROM ranking_snapshots rs JOIN tracks t ON t.id = rs.track_id
     WHERE rs.user_id = ? AND rs.item_type = 'track' AND rs.time_range = ?
     ORDER BY rs.ranking_position ASC LIMIT ${Math.min(Number(limit) || 10, 20)}`,
    [userId, timeRange],
  );
  return rows.map((r, i) => `${i + 1}. ${r.name}${r.album_name ? ` — ${r.album_name}` : ''}`);
}

export async function buildChatContext(userId, { nowPlaying = null } = {}) {
  const [[user]] = await pool.execute('SELECT display_name FROM users WHERE id = ?', [userId]);
  const [shortA, shortT, medA, medT, longA, longT] = await Promise.all([
    topArtists(userId, 'short_term'),
    topTracks(userId, 'short_term'),
    topArtists(userId, 'medium_term'),
    topTracks(userId, 'medium_term'),
    topArtists(userId, 'long_term'),
    topTracks(userId, 'long_term'),
  ]);
  const [recent] = await pool.execute(
    `SELECT MAX(t.name) AS name, GROUP_CONCAT(DISTINCT a.name ORDER BY ta.artist_order SEPARATOR ', ') AS artists, MAX(ph.played_at) AS played_at
     FROM playback_history ph
     JOIN tracks t ON t.id = ph.track_id
     LEFT JOIN track_artists ta ON ta.track_id = t.id
     LEFT JOIN artists a ON a.id = ta.artist_id
     WHERE ph.user_id = ? GROUP BY ph.id ORDER BY MAX(ph.played_at) DESC LIMIT 12`,
    [userId],
  );
  const [[counts]] = await pool.execute(
    `SELECT (SELECT COUNT(*) FROM playback_history WHERE user_id = ?) AS historyCount,
            (SELECT MAX(captured_at) FROM ranking_snapshots WHERE user_id = ?) AS lastSync`,
    [userId, userId],
  );

  const parts = [];
  parts.push(`Nombre del usuario: ${user?.display_name || 'usuario'}.`);
  if (nowPlaying?.item?.item) {
    const t = nowPlaying.item.item;
    const artists = (t.artists || []).map((a) => a.name).filter(Boolean).join(', ');
    const playing = nowPlaying.item.is_playing ? 'está sonando ahora mismo' : 'está en pausa ahora mismo';
    parts.push(`Reproducción actual (en vivo): ${playing} "${t.name}"${artists ? ` de ${artists}` : ''}${t.album?.name ? `, del álbum ${t.album.name}` : ''}.`);
  } else if (nowPlaying && !nowPlaying.error) {
    parts.push('Reproducción actual (en vivo): no hay nada sonando en este momento.');
  } else {
    parts.push('Reproducción actual (en vivo): no disponible ahora.');
  }
  parts.push(`Reproducciones guardadas en el historial: ${counts?.historyCount ?? 0}. Última actualización de datos: ${fmtDate(counts?.lastSync) || 'sin sincronizar'}.`);

  const block = (label, items) => `${label}: ${items.length ? '\n' + items.join('\n') : 'sin datos suficientes.'}`;
  parts.push('\nArtistas más escuchados (últimas ~4 semanas):\n' + (shortA.length ? shortA.join('\n') : 'sin datos suficientes.'));
  parts.push('\nCanciones más escuchadas (últimas ~4 semanas):\n' + (shortT.length ? shortT.join('\n') : 'sin datos suficientes.'));
  parts.push('\nArtistas más escuchados (últimos ~6 meses):\n' + (medA.length ? medA.join('\n') : 'sin datos suficientes.'));
  parts.push('\nCanciones más escuchadas (últimos ~6 meses):\n' + (medT.length ? medT.join('\n') : 'sin datos suficientes.'));
  parts.push('\nArtistas más escuchados (de siempre/en general):\n' + (longA.length ? longA.join('\n') : 'sin datos suficientes.'));
  parts.push('\nCanciones más escuchadas (de siempre/en general):\n' + (longT.length ? longT.join('\n') : 'sin datos suficientes.'));
  parts.push('\nCanciones reproducidas recientemente:\n' + (recent.length ? recent.map((r) => `- ${r.name}${r.artists ? ` — ${r.artists}` : ''} (${fmtDate(r.played_at) || r.played_at})`).join('\n') : 'sin datos suficientes.'));

  return parts.join('\n');
}
