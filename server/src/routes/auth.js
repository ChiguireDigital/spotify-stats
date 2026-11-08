import { Router } from 'express';
import { config } from '../config/env.js';
import { beginLogin, clearLogin, completeLogin, getValidAccessToken } from '../auth/spotifyAuth.js';
import { fetchWithTimeout } from '../utils/fetch.js';

const router = Router();

router.get('/login', (request, response) => beginLogin(request, response));

router.get('/callback', async (request, response) => {
  const { code, state, error } = request.query;
  if (error) {
    response.redirect(`${config.clientOrigin}/?auth_error=access_denied`);
    return;
  }
  if (!code || !state) {
    response.status(400).send('La respuesta de Spotify está incompleta.');
    return;
  }
  try {
    await completeLogin(request, code, state);
    response.redirect(`${config.clientOrigin}/`);
  } catch (authError) {
    console.error('Auth callback:', authError?.cause?.code || authError?.code || authError.message);
    const reason = (authError?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' || authError?.code === 'FETCH_TIMEOUT') ? 'spotify_unreachable' : 'login_failed';
    response.redirect(`${config.clientOrigin}/?auth_error=${reason}`);
  }
});

router.get('/me', async (request, response, next) => {
  try {
    const accessToken = await getValidAccessToken(request);
    if (!accessToken) return response.status(401).json({ authenticated: false });
    const spotifyResponse = await fetchWithTimeout('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } }, 15000);
    if (!spotifyResponse.ok) return response.status(spotifyResponse.status).json({ error: 'Spotify no pudo devolver el perfil.' });
    return response.json({ authenticated: true, profile: await spotifyResponse.json() });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (request, response) => clearLogin(request, response));

export default router;
