const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, credentials: 'include' });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error || 'El backend no pudo responder.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const getSession = () => request('/api/auth/me');
export const logoutSession = () => request('/api/auth/logout', { method: 'POST' });
export const getProfile = () => request('/api/spotify/profile');
export const getCurrentlyPlaying = () => request('/api/spotify/currently-playing');
export const getTopArtists = (range = 'medium_term') => request(`/api/spotify/top/artists?time_range=${encodeURIComponent(range)}`);
export const getTopTracks = (range = 'medium_term') => request(`/api/spotify/top/tracks?time_range=${encodeURIComponent(range)}`);
export const getRecentlyPlayed = (limit = 20) => request(`/api/spotify/recently-played?limit=${limit}`);
export const syncSpotify = () => request('/api/spotify/sync', { method: 'POST' });
export const getSyncStatus = () => request('/api/stats/status');
export const getStoredTopArtists = (range = 'medium_term') => request(`/api/stats/top/artists?time_range=${encodeURIComponent(range)}`);
export const getStoredTopTracks = (range = 'medium_term') => request(`/api/stats/top/tracks?time_range=${encodeURIComponent(range)}`);
export const getStoredRecentlyPlayed = (limit = 20) => request(`/api/stats/recently-played?limit=${limit}`);
export const getListeningSummary = (period = '4w') => request(`/api/stats/listening-summary?period=${encodeURIComponent(period)}`);
export const getTopAlbums = (period = 'all', limit = 8) => request(`/api/stats/top/albums?period=${encodeURIComponent(period)}&limit=${limit}`);
