import { upsertArtists, upsertTracks } from '../db/repositories/catalog.js';
import { savePlaybackHistory } from '../db/repositories/playback.js';
import { saveRankingSnapshot } from '../db/repositories/rankings.js';
import { fetchWithTimeout } from '../utils/fetch.js';

const RANGES = new Set(['short_term', 'medium_term', 'long_term']);
const safeRange = (v) => (RANGES.has(v) ? v : 'medium_term');

async function spotifyGet(accessToken, path) {
  const response = await fetchWithTimeout(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, 20000);
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'Spotify no pudo responder.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function syncRecentlyPlayed(userId, accessToken, limit = 50) {
  const payload = await spotifyGet(accessToken, `/me/player/recently-played?limit=${Math.min(limit, 50)}`);
  const items = payload?.items || [];
  const tracks = items.map((item) => item.track).filter(Boolean);
  const trackMap = await upsertTracks(tracks);
  const inserted = await savePlaybackHistory(userId, items, trackMap);
  return { items: items.length, inserted };
}

export async function syncTopArtists(userId, accessToken, timeRange = 'medium_term') {
  const range = safeRange(timeRange);
  const payload = await spotifyGet(accessToken, `/me/top/artists?limit=20&time_range=${encodeURIComponent(range)}`);
  const items = payload?.items || [];
  const idMap = await upsertArtists(items);
  await saveRankingSnapshot(userId, 'artist', range, items, idMap);
  return { items: items.length, timeRange: range };
}

export async function syncTopTracks(userId, accessToken, timeRange = 'medium_term') {
  const range = safeRange(timeRange);
  const payload = await spotifyGet(accessToken, `/me/top/tracks?limit=20&time_range=${encodeURIComponent(range)}`);
  const items = payload?.items || [];
  const idMap = await upsertTracks(items);
  await saveRankingSnapshot(userId, 'track', range, items, idMap);
  return { items: items.length, timeRange: range };
}

export async function syncAll(userId, accessToken) {
  const ranges = ['short_term', 'medium_term', 'long_term'];
  const results = { recentlyPlayed: null, topArtists: {}, topTracks: {}, errors: [] };
  try { results.recentlyPlayed = await syncRecentlyPlayed(userId, accessToken); }
  catch (e) { results.errors.push({ area: 'recentlyPlayed', message: e.message }); }
  for (const range of ranges) {
    try { results.topArtists[range] = await syncTopArtists(userId, accessToken, range); }
    catch (e) { results.errors.push({ area: `topArtists:${range}`, message: e.message }); }
    try { results.topTracks[range] = await syncTopTracks(userId, accessToken, range); }
    catch (e) { results.errors.push({ area: `topTracks:${range}`, message: e.message }); }
  }
  return results;
}
