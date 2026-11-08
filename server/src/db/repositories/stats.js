import { pool } from '../pool.js';

function artistShape(row) {
  return {
    id: row.spotify_artist_id,
    name: row.name,
    external_urls: row.spotify_url ? { spotify: row.spotify_url } : {},
    images: row.image_url ? [{ url: row.image_url }] : [],
  };
}

function trackShape(row, artists = []) {
  return {
    id: row.spotify_track_id,
    name: row.name,
    external_urls: row.spotify_url ? { spotify: row.spotify_url } : {},
    album: { name: row.album_name || null, images: row.album_image_url ? [{ url: row.album_image_url }] : [] },
    artists: artists.map((a) => ({ id: a.spotify_artist_id, name: a.name })),
  };
}

async function getTrackArtists(trackIds) {
  if (!trackIds.length) return new Map();
  const placeholders = trackIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT ta.track_id, ta.artist_order, a.spotify_artist_id, a.name
     FROM track_artists ta JOIN artists a ON a.id = ta.artist_id
     WHERE ta.track_id IN (${placeholders}) ORDER BY ta.track_id, ta.artist_order`,
    trackIds,
  );
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.track_id)) map.set(r.track_id, []);
    map.get(r.track_id).push(r);
  }
  return map;
}

export async function getStoredTopArtists(userId, timeRange = 'medium_term') {
  const [rows] = await pool.execute(
    `SELECT a.spotify_artist_id, a.name, a.spotify_url, a.image_url, rs.ranking_position, rs.captured_at
     FROM ranking_snapshots rs JOIN artists a ON a.id = rs.artist_id
     WHERE rs.user_id = ? AND rs.item_type = 'artist' AND rs.time_range = ?
     ORDER BY rs.ranking_position ASC`,
    [userId, timeRange],
  );
  return { items: rows.map(artistShape), capturedAt: rows[0]?.captured_at || null };
}

export async function getStoredTopTracks(userId, timeRange = 'medium_term') {
  const [rows] = await pool.execute(
    `SELECT t.id AS db_id, t.spotify_track_id, t.name, t.album_name, t.album_image_url, t.spotify_url, rs.ranking_position, rs.captured_at
     FROM ranking_snapshots rs JOIN tracks t ON t.id = rs.track_id
     WHERE rs.user_id = ? AND rs.item_type = 'track' AND rs.time_range = ?
     ORDER BY rs.ranking_position ASC`,
    [userId, timeRange],
  );
  const artistsMap = await getTrackArtists(rows.map((r) => r.db_id));
  return { items: rows.map((r) => trackShape(r, artistsMap.get(r.db_id) || [])), capturedAt: rows[0]?.captured_at || null };
}

export async function getStoredRecentlyPlayed(userId, limit = 20) {
  const safe = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const [rows] = await pool.query(
    `SELECT ph.played_at, t.id AS db_id, t.spotify_track_id, t.name, t.album_name, t.album_image_url, t.spotify_url
     FROM playback_history ph JOIN tracks t ON t.id = ph.track_id
     WHERE ph.user_id = ? ORDER BY ph.played_at DESC LIMIT ${safe}`,
    [userId],
  );
  const artistsMap = await getTrackArtists(rows.map((r) => r.db_id));
  return {
    items: rows.map((r) => ({
      played_at: r.played_at instanceof Date ? r.played_at.toISOString() : r.played_at,
      track: trackShape(r, artistsMap.get(r.db_id) || []),
    })),
  };
}

export async function getSyncStatus(userId) {
  const [[rank]] = await pool.execute(
    'SELECT MAX(captured_at) AS lastCapturedAt FROM ranking_snapshots WHERE user_id = ?',
    [userId],
  );
  const [[play]] = await pool.execute(
    'SELECT MAX(played_at) AS lastPlayedAt, COUNT(*) AS historyCount FROM playback_history WHERE user_id = ?',
    [userId],
  );
  return {
    lastCapturedAt: rank?.lastCapturedAt || null,
    lastPlayedAt: play?.lastPlayedAt || null,
    historyCount: Number(play?.historyCount || 0),
  };
}

const PERIODS = {
  '7d': { sql: 'AND ph.played_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)', label: '7 días' },
  '4w': { sql: 'AND ph.played_at >= DATE_SUB(NOW(), INTERVAL 28 DAY)', label: '4 semanas' },
  '6m': { sql: 'AND ph.played_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)', label: '6 meses' },
  all: { sql: '', label: 'Todo lo guardado' },
};

export async function getListeningSummary(userId, period = '4w') {
  const p = PERIODS[period] ? period : '4w';
  const where = `WHERE ph.user_id = ? ${PERIODS[p].sql}`;
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS plays,
            COUNT(DISTINCT ph.track_id) AS tracks,
            COALESCE(SUM(CASE WHEN t.duration_ms IS NOT NULL THEN t.duration_ms ELSE 0 END), 0) AS ms
     FROM playback_history ph
     JOIN tracks t ON t.id = ph.track_id
     ${where}`,
    [userId],
  );
  const [[artists]] = await pool.query(
    `SELECT COUNT(DISTINCT ta.artist_id) AS artists
     FROM playback_history ph
     JOIN track_artists ta ON ta.track_id = ph.track_id
     ${where}`,
    [userId],
  );
  return {
    period: p,
    plays: Number(row?.plays || 0),
    tracks: Number(row?.tracks || 0),
    artists: Number(artists?.artists || 0),
    ms: Number(row?.ms || 0),
    estimated: true,
  };
}

export async function getTopAlbums(userId, limit = 8, period = 'all') {
  const safe = Math.min(Math.max(Number(limit) || 8, 1), 20);
  const p = PERIODS[period] ? period : 'all';
  const where = `WHERE ph.user_id = ? AND t.album_name IS NOT NULL AND t.album_name <> '' ${PERIODS[p].sql}`;
  const [rows] = await pool.query(
    `SELECT t.album_name AS name,
            MAX(t.album_image_url) AS image_url,
            MAX(a.name) AS artist_name,
            MAX(t.spotify_url) AS spotify_url,
            COUNT(*) AS plays,
            COALESCE(SUM(CASE WHEN t.duration_ms IS NOT NULL THEN t.duration_ms ELSE 0 END), 0) AS ms
     FROM playback_history ph
     JOIN tracks t ON t.id = ph.track_id
     LEFT JOIN track_artists ta ON ta.track_id = t.id AND ta.artist_order = 0
     LEFT JOIN artists a ON a.id = ta.artist_id
     ${where}
     GROUP BY t.album_name
     ORDER BY plays DESC, ms DESC
     LIMIT ${safe}`,
    [userId],
  );
  return {
    items: rows.map((r) => ({
      name: r.name,
      artistName: r.artist_name || null,
      image: r.image_url || null,
      spotifyUrl: r.spotify_url || null,
      plays: Number(r.plays || 0),
      ms: Number(r.ms || 0),
    })),
    period: p,
  };
}
