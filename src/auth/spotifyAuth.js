const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback';
const SCOPES = ['user-read-private', 'user-top-read', 'user-read-recently-played', 'user-read-currently-playing'];

const STORAGE_KEYS = {
  verifier: 'spotify_pkce_verifier',
  state: 'spotify_oauth_state',
  token: 'spotify_token',
};

function randomString(length = 64) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function createCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function assertConfiguration() {
  if (!CLIENT_ID) throw new Error('Falta configurar VITE_SPOTIFY_CLIENT_ID.');
}

export async function beginSpotifyLogin() {
  assertConfiguration();
  if (window.location.origin !== new URL(REDIRECT_URI).origin) {
    throw new Error(`Abre la aplicación en ${new URL(REDIRECT_URI).origin} para iniciar sesión.`);
  }
  const verifier = randomString(64);
  const state = randomString(24);
  const challenge = await createCodeChallenge(verifier);
  sessionStorage.setItem(STORAGE_KEYS.verifier, verifier);
  sessionStorage.setItem(STORAGE_KEYS.state, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SCOPES.join(' '),
  });
  window.location.assign(`${AUTH_ENDPOINT}?${params.toString()}`);
}

async function requestToken(params) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, client_id: CLIENT_ID }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error_description || 'Spotify no pudo completar la autenticación.');
  return payload;
}

export async function completeSpotifyLogin(code, returnedState) {
  assertConfiguration();
  const expectedState = sessionStorage.getItem(STORAGE_KEYS.state);
  const verifier = sessionStorage.getItem(STORAGE_KEYS.verifier);
  if (!expectedState || returnedState !== expectedState) throw new Error('La sesión no coincide. Abre la aplicación en http://127.0.0.1:5173/ e inicia sesión nuevamente.');
  if (!verifier) throw new Error('La sesión de autenticación expiró. Inténtalo de nuevo.');

  const token = await requestToken({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, code_verifier: verifier });
  saveToken(token);
  sessionStorage.removeItem(STORAGE_KEYS.state);
  sessionStorage.removeItem(STORAGE_KEYS.verifier);
  return token;
}

export function saveToken(token) {
  sessionStorage.setItem(STORAGE_KEYS.token, JSON.stringify({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: Date.now() + (token.expires_in * 1000),
  }));
}

export function getStoredToken() {
  const raw = sessionStorage.getItem(STORAGE_KEYS.token);
  return raw ? JSON.parse(raw) : null;
}

export async function getValidAccessToken() {
  const token = getStoredToken();
  if (!token) return null;
  if (token.expires_at > Date.now() + 60000) return token.access_token;
  if (!token.refresh_token) return null;
  const refreshed = await requestToken({ grant_type: 'refresh_token', refresh_token: token.refresh_token });
  saveToken({ ...refreshed, refresh_token: refreshed.refresh_token || token.refresh_token });
  return refreshed.access_token;
}

export function logout() {
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.state);
  sessionStorage.removeItem(STORAGE_KEYS.verifier);
}

export function getRedirectUri() { return REDIRECT_URI; }
