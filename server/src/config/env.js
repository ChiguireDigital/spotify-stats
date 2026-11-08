import dns from 'node:dns';
import 'dotenv/config';

try { dns.setDefaultResultOrder('ipv4first'); } catch {}

function required(name, fallback) {
  const value = process.env[name] || fallback;
  if (value === undefined || value === '') {
    throw new Error(`Falta configurar la variable de entorno ${name}.`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT || 3001),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173',
  spotify: {
    // Durante la migración se acepta también el Client ID que ya usaba el frontend.
    clientId: required('SPOTIFY_CLIENT_ID', process.env.VITE_SPOTIFY_CLIENT_ID),
    redirectUri: required('SPOTIFY_REDIRECT_URI', 'http://127.0.0.1:3001/api/auth/callback'),
  },
  sessionSecret: required('SESSION_SECRET', 'spotify-stats-local-session-secret'),
  mysql: {
    host: required('MYSQL_HOST', '127.0.0.1'),
    port: Number(process.env.MYSQL_PORT || 3306),
    database: required('MYSQL_DATABASE', 'spotify_stats'),
    user: required('MYSQL_USER', 'root'),
    password: process.env.MYSQL_PASSWORD || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  },
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || '',
};
