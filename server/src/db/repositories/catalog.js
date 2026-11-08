import { pool } from '../pool.js';

export async function upsertArtists(artists = []) {
  if (!artists.length) return new Map();
  const map = new Map();
  for (const artist of artists) {
    if (!artist?.id) continue;
    await pool.execute(
      `INSERT INTO artists (spotify_artist_id, name, spotify_url, image_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = COALESCE(VALUES(name), name),
         spotify_url = COALESCE(VALUES(spotify_url), spotify_url),
         image_url = COALESCE(VALUES(image_url), image_url)`,
      [artist.id, artist.name || null, artist.external_urls?.spotify || null, artist.images?.[0]?.url || null],
    );
    const [rows] = await pool.execute('SELECT id FROM artists WHERE spotify_artist_id = ?', [artist.id]);
    if (rows[0]) map.set(artist.id, rows[0].id);
  }
  return map;
}

export async function upsertTracks(tracks = []) {
  if (!tracks.length) return new Map();
  const map = new Map();
  for (const track of tracks) {
    if (!track?.id) continue;
    await pool.execute(
      `INSERT INTO tracks (spotify_track_id, name, album_name, album_image_url, duration_ms, spotify_url)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = COALESCE(VALUES(name), name),
         album_name = COALESCE(VALUES(album_name), album_name),
         album_image_url = COALESCE(VALUES(album_image_url), album_image_url),
         duration_ms = COALESCE(VALUES(duration_ms), duration_ms),
         spotify_url = COALESCE(VALUES(spotify_url), spotify_url)`,
      [
        track.id,
        track.name || null,
        track.album?.name || null,
        track.album?.images?.[0]?.url || null,
        track.duration_ms ?? null,
        track.external_urls?.spotify || null,
      ],
    );
    const [rows] = await pool.execute('SELECT id FROM tracks WHERE spotify_track_id = ?', [track.id]);
    if (!rows[0]) continue;
    map.set(track.id, rows[0].id);
    const artistIds = await upsertArtists(track.artists || []);
    await pool.execute('DELETE FROM track_artists WHERE track_id = ?', [rows[0].id]);
    for (let i = 0; i < (track.artists || []).length; i++) {
      const dbArtistId = artistIds.get(track.artists[i]?.id);
      if (dbArtistId) {
        await pool.execute(
          'INSERT IGNORE INTO track_artists (track_id, artist_id, artist_order) VALUES (?, ?, ?)',
          [rows[0].id, dbArtistId, i],
        );
      }
    }
  }
  return map;
}
