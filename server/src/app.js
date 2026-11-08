import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { checkDatabaseConnection } from './db/pool.js';
import authRouter from './routes/auth.js';
import publicRouter from './routes/public.js';
import spotifyRouter from './routes/spotify.js';
import statsRouter from './routes/stats.js';
import { sessionMiddleware } from './session.js';
import { rateLimit } from './middleware/rateLimit.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(sessionMiddleware);
app.use('/api', rateLimit({ windowMs: 60_000, max: 120, keyPrefix: 'api' }));

app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'auth' }), authRouter);
app.use('/api/public', publicRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/stats', statsRouter);

app.get('/api/health', async (_request, response) => {
  try {
    await checkDatabaseConnection();
    response.json({ ok: true, database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error.message);
    response.status(503).json({ ok: false, database: 'unavailable' });
  }
});

app.use((_request, response) => {
  response.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((error, _request, response, _next) => {
  const code = error?.cause?.code || error?.code;
  if (code === 'UND_ERR_CONNECT_TIMEOUT' || code === 'FETCH_TIMEOUT' || error?.message?.includes('fetch failed')) {
    console.error('Red/Spotify:', error.message);
    return response.status(504).json({ error: 'No se pudo conectar con Spotify. Revisa tu conexión, VPN o firewall.' });
  }
  console.error(error);
  response.status(500).json({ error: 'Error interno del servidor.' });
});
