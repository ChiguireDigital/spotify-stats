import { pool } from '../pool.js';
import { encryptText } from '../../utils/crypto.js';

export async function saveSpotifyUser(profile) {
  const [userResult] = await pool.execute(
    `INSERT INTO users (spotify_user_id, display_name, email, image_url, spotify_url)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       display_name = VALUES(display_name),
       email = VALUES(email),
       image_url = VALUES(image_url),
       spotify_url = VALUES(spotify_url)`,
    [
      profile.id,
      profile.display_name || null,
      profile.email || null,
      profile.images?.[0]?.url || null,
      profile.external_urls?.spotify || null,
    ],
  );

  if (userResult.insertId) return userResult.insertId;
  const [rows] = await pool.execute('SELECT id FROM users WHERE spotify_user_id = ?', [profile.id]);
  return rows[0]?.id;
}

export async function saveSpotifyAccount(userId, token) {
  const accessToken = encryptText(token.access_token);
  const refreshToken = token.refresh_token ? encryptText(token.refresh_token) : null;
  await pool.execute(
    `INSERT INTO spotify_accounts (user_id, access_token, refresh_token, expires_at, scope)
     VALUES (?, ?, ?, FROM_UNIXTIME(? / 1000), ?)
     ON DUPLICATE KEY UPDATE
       access_token = VALUES(access_token),
       refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
       expires_at = VALUES(expires_at),
       scope = VALUES(scope)`,
    [userId, accessToken, refreshToken, token.expires_at, token.scope || null],
  );
}
