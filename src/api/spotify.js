import { getValidAccessToken, logout } from '../auth/spotifyAuth';

const API_BASE = 'https://api.spotify.com/v1';
let rateLimitUntil = 0;

export class SpotifyApiError extends Error {
  constructor(status, message, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export async function spotifyRequest(path, options = {}) {
  if (Date.now() < rateLimitUntil) {
    throw new SpotifyApiError(429, 'Spotify solicitó esperar antes de continuar.', Math.ceil((rateLimitUntil - Date.now()) / 1000));
  }
  const accessToken = await getValidAccessToken();
  if (!accessToken) throw new SpotifyApiError(401, 'La sesión de Spotify expiró.');
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { Authorization: `Bearer ${accessToken}`, ...options.headers } });
  if (response.status === 401) { logout(); throw new SpotifyApiError(401, 'La sesión de Spotify expiró.'); }
  if (!response.ok) {
    const retryAfter = response.headers.get('Retry-After');
    if (response.status === 429) {
      const retrySeconds = Number.parseInt(retryAfter || '30', 10);
      rateLimitUntil = Date.now() + Math.max(Number.isFinite(retrySeconds) ? retrySeconds * 1000 : 30000, 30000);
    }
    throw new SpotifyApiError(response.status, 'Spotify no pudo responder a la solicitud.', retryAfter);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const getProfile = () => spotifyRequest('/me');

export const getCurrentlyPlaying = () => spotifyRequest('/me/player/currently-playing');

export const getTopArtists = (timeRange = 'medium_term') =>
  spotifyRequest(`/me/top/artists?${new URLSearchParams({ limit: '5', time_range: timeRange })}`);

export const getTopTracks = (timeRange = 'medium_term') =>
  spotifyRequest(`/me/top/tracks?${new URLSearchParams({ limit: '5', time_range: timeRange })}`);

export const getRecentlyPlayed = (limit = 20) =>
  spotifyRequest(`/me/player/recently-played?${new URLSearchParams({ limit: String(limit) })}`);
