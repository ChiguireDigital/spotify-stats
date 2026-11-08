import { pool } from '../pool.js';

export async function savePlaybackHistory(userId, items = [], trackMap) {
  let inserted = 0;
  for (const item of items) {
    const trackId = trackMap.get(item?.track?.id);
    if (!trackId || !item.played_at) continue;
    const playedAt = new Date(item.played_at);
    if (Number.isNaN(playedAt.getTime())) continue;
    const [result] = await pool.execute(
      `INSERT IGNORE INTO playback_history (user_id, track_id, played_at, context_uri)
       VALUES (?, ?, ?, ?)`,
      [userId, trackId, playedAt, item.context?.uri || null],
    );
    inserted += result.affectedRows || 0;
  }
  return inserted;
}
