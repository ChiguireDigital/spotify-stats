import { pool } from '../pool.js';

export async function saveChatMessage(userId, role, content) {
  await pool.execute(
    'INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)',
    [userId, role, String(content).slice(0, 8000)],
  );
}

export async function getRecentChatMessages(userId, limit = 8) {
  const safe = Math.min(Math.max(Number(limit) || 8, 1), 20);
  const [rows] = await pool.query(
    `SELECT role, content, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ${safe}`,
    [userId],
  );
  return rows.reverse();
}
