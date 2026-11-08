import http from 'node:http';
import { app } from './app.js';
import { config } from './config/env.js';
import { checkDatabaseConnection } from './db/pool.js';
import { attachRealtime } from './realtime/socket.js';

try {
  await checkDatabaseConnection();
  const server = http.createServer(app);
  attachRealtime(server);
  server.listen(config.port, '127.0.0.1', () => {
    console.log(`Spotify Stats API escuchando en http://127.0.0.1:${config.port}`);
  });
} catch (error) {
  console.error('No se pudo conectar a MySQL. Verifica tu configuración local.');
  console.error(error.message);
  process.exitCode = 1;
}
