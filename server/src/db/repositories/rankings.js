import { pool } from '../pool.js';

export async function saveRankingSnapshot(userId, itemType, timeRange, items = [], idMap) {
  const capturedAt = new Date();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      'DELETE FROM ranking_snapshots WHERE user_id = ? AND item_type = ? AND time_range = ?',
      [userId, itemType, timeRange],
    );
    for (let i = 0; i < items.length; i++) {
      const dbId = idMap.get(items[i]?.id);
      if (!dbId) continue;
      await conn.execute(
        `INSERT INTO ranking_snapshots (user_id, item_type, artist_id, track_id, time_range, ranking_position, captured_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, itemType, itemType === 'artist' ? dbId : null, itemType === 'track' ? dbId : null, timeRange, i + 1, capturedAt],
      );
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
