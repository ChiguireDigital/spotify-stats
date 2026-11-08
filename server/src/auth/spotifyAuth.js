import crypto from 'node:crypto';
import { config } from '../config/env.js';
import { saveSpotifyAccount, saveSpotifyUser } from '../db/repositories/users.js';
import { fetchWithTimeout } from '../utils/fetch.js';

const AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SCOPES = ['user-read-private', 'user-top-read', 'user-read-recently-played', 'user-read-currently-playing'];

function randomString(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function createCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

async function requestToken(params) {
  const response = await fetchWithTimeout(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, client_id: config.spotify.clientId }),
  }, 20000);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error_description || 'Spotify no pudo completar la autenticación.');
  return payload;
}

export function beginLogin(request, response) {
  const state = randomString(24);
  const verifier = randomString(48);
  request.session.oauth = { state, verifier };
  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: 'code',
    redirect_uri: config.spotify.redirectUri,
    code_challenge_method: 'S256',
    code_challenge: createCodeChallenge(verifier),
    state,
    scope: SCOPES.join(' '),
  });
  response.redirect(`${AUTHORIZE_ENDPOINT}?${params.toString()}`);
}

export async function completeLogin(request, code, returnedState) {
  const oauth = request.session.oauth;
  if (!oauth || returnedState !== oauth.state) throw new Error('La sesión de autenticación no coincide. Inicia sesión nuevamente.');
  const token = await requestToken({ grant_type: 'authorization_code', code, redirect_uri: config.spotify.redirectUri, code_verifier: oauth.verifier });
  const profileResponse = await fetchWithTimeout('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token.access_token}` } }, 20000);
  if (!profileResponse.ok) throw new Error('Spotify no pudo devolver el perfil del usuario.');
  const profile = await profileResponse.json();
  const userId = await saveSpotifyUser(profile);
  const tokenToStore = { ...token, expires_at: Date.now() + token.expires_in * 1000 };
  await saveSpotifyAccount(userId, tokenToStore);
  request.session.oauth = null;
  request.session.spotify = {
    userId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: tokenToStore.expires_at,
  };
}

export async function getValidAccessToken(request) {
  const session = request.session.spotify;
  if (!session) return null;
  if (session.expiresAt > Date.now() + 60_000) return session.accessToken;
  if (!session.refreshToken) return null;
  const refreshed = await requestToken({ grant_type: 'refresh_token', refresh_token: session.refreshToken });
  request.session.spotify = {
    userId: session.userId,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token || session.refreshToken,
    expiresAt: Date.now() + refreshed.expires_in * 1000,
  };
  await saveSpotifyAccount(session.userId, { ...refreshed, refresh_token: refreshed.refresh_token || session.refreshToken, expires_at: request.session.spotify.expiresAt });
  return refreshed.access_token;
}

export function clearLogin(request, response) {
  request.session.destroy((error) => {
    if (error) {
      response.status(500).json({ error: 'No se pudo cerrar la sesión.' });
      return;
    }
    response.clearCookie('spotify.sid');
    response.status(204).end();
  });
}
