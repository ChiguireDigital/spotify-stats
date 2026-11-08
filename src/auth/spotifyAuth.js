import { logoutSession } from '../api/backend';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001';

export function beginSpotifyLogin() {
  window.location.assign(`${API_BASE}/api/auth/login`);
}

export async function logout() {
  await logoutSession();
}
