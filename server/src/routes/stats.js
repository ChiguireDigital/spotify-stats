import { Router } from 'express';
import { getValidAccessToken } from '../auth/spotifyAuth.js';
import { getListeningSummary, getStoredRecentlyPlayed, getTopAlbums, getStoredTopArtists, getStoredTopTracks, getSyncStatus } from '../db/repositories/stats.js';

const router = Router();
const RANGES = new Set(['short_term', 'medium_term', 'long_term']);
const PERIODS = new Set(['7d', '4w', '6m', 'all']);
const safeRange = (v) => (RANGES.has(v) ? v : 'medium_term');
const safePeriod = (v, fallback = '4w') => (PERIODS.has(v) ? v : fallback);

async function requireUser(request, response) {
  const accessToken = await getValidAccessToken(request);
  const userId = request.session?.spotify?.userId || null;
  if (!accessToken || !userId) {
    response.status(401).json({ error: 'La sesión de Spotify expiró.' });
    return null;
  }
  return userId;
}

router.get('/status', async (request, response, next) => {
  try {
    const userId = await requireUser(request, response);
    if (!userId) return;
    response.json(await getSyncStatus(userId));
  } catch (error) { next(error); }
});

router.get('/top/artists', async (request, response, next) => {
  try {
    const userId = await requireUser(request, response);
    if (!userId) return;
    response.json(await getStoredTopArtists(userId, safeRange(request.query.time_range)));
  } catch (error) { next(error); }
});

router.get('/top/tracks', async (request, response, next) => {
  try {
    const userId = await requireUser(request, response);
    if (!userId) return;
    response.json(await getStoredTopTracks(userId, safeRange(request.query.time_range)));
  } catch (error) { next(error); }
});

router.get('/recently-played', async (request, response, next) => {
  try {
    const userId = await requireUser(request, response);
    if (!userId) return;
    response.json(await getStoredRecentlyPlayed(userId, request.query.limit || 20));
  } catch (error) { next(error); }
});

router.get('/listening-summary', async (request, response, next) => {
  try {
    const userId = await requireUser(request, response);
    if (!userId) return;
    response.json(await getListeningSummary(userId, safePeriod(request.query.period, '4w')));
  } catch (error) { next(error); }
});

router.get('/top/albums', async (request, response, next) => {
  try {
    const userId = await requireUser(request, response);
    if (!userId) return;
    response.json(await getTopAlbums(userId, request.query.limit || 8, safePeriod(request.query.period, 'all')));
  } catch (error) { next(error); }
});

export default router;
