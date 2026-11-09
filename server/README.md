# Backend de Spotify Stats

API en Node.js + Express con MySQL, sesiones, Socket.IO y servicios de sincronización. El frontend React ya consume estas rutas; la documentación completa del proyecto está en el [README principal](../README.md).

## Requisitos

- Node.js 20+
- MySQL 8
- Variables de entorno configuradas en `.env` (ver `.env.example` en la raíz)

## Spotify Developer Dashboard

Registra esta Redirect URI:

```text
http://127.0.0.1:3001/api/auth/callback
```

`SPOTIFY_CLIENT_ID` debe ser el Client ID de tu aplicación de Spotify y `SPOTIFY_REDIRECT_URI` debe coincidir exactamente con la URI registrada.

## Puesta en marcha

Desde la raíz del repositorio:

```bash
npm install
npm run db:migrate
npm run dev:server
```

La API queda disponible en `http://127.0.0.1:3001`.

## Rutas principales

- `GET /api/health` — estado del servidor y la base de datos.
- `GET /api/auth/login` — inicia el flujo OAuth con Spotify.
- `GET /api/auth/callback` — callback de Spotify.
- `GET /api/auth/me` — sesión/perfil autenticado.
- `POST /api/auth/logout` — cierra sesión.
- `GET /api/spotify/*` — proxy de datos de Spotify.
- `POST /api/spotify/sync` — sincronización completa hacia MySQL.
- `GET /api/stats/*` — estadísticas persistidas y resúmenes.
- `GET /api/public/covers` — portadas públicas para el login (Deezer).
- Socket.IO — chat (`chat:*`) y contexto de reproducción (`now-playing:*`).

## Scripts

```bash
npm run dev:server   # desarrollo con recarga automática
npm run start:server # ejecución normal
npm run db:migrate   # aplica migraciones pendientes
npm test             # pruebas del backend
```
