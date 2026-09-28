# Spotify Stats

Spotify Stats es una SPA académica que consulta estadísticas y actividad musical reales del usuario autenticado en Spotify. No tiene backend propio, base de datos ni reproducción de audio.

## Tecnologías y arquitectura

- React + Vite + JavaScript.
- OAuth 2.0 Authorization Code with PKCE en el navegador.
- Spotify Web API con una capa centralizada en `src/api/spotify.js`.
- `src/auth/spotifyAuth.js`: `code_verifier`, `code_challenge`, `state`, intercambio de código, refresh token y logout.
- `src/hooks/useSpotify.js`: sesión, carga paralela del dashboard y estado independiente por sección.
- `src/components/`: navegación, perfil, Now Playing, rankings, actividad reciente y estados de carga/error/vacío.

## Instalación

```bash
npm install
copy .env.example .env
npm run dev
```

Si PowerShell bloquea `npm.ps1`, utiliza `npm.cmd run dev`.

La aplicación se sirve en `http://127.0.0.1:5173/`. Es importante iniciar sesión desde ese origen, no desde `localhost`, porque el flujo PKCE conserva temporalmente su estado en `sessionStorage`.

## Variables de entorno

Configura `.env` con el Client ID público de Spotify:

```env
VITE_SPOTIFY_CLIENT_ID=tu_client_id
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
```

El Client Secret no se utiliza ni debe añadirse al frontend.

## Spotify Developer Dashboard

1. Crea una aplicación en [Spotify for Developers](https://developer.spotify.com/dashboard).
2. Registra exactamente `http://127.0.0.1:5173/callback` como Redirect URI.
3. Copia el Client ID en `.env`.
4. Inicia el proyecto y entra desde `http://127.0.0.1:5173/`.

## Scopes

La aplicación solicita únicamente:

- `user-read-private`
- `user-top-read`
- `user-read-recently-played`
- `user-read-currently-playing`

## Endpoints utilizados

- `GET /v1/me`: perfil, nombre, avatar y enlace.
- `GET /v1/me/player/currently-playing`: canción y estado actual.
- `GET /v1/me/top/artists?limit=5&time_range=...`: Top Artists.
- `GET /v1/me/top/tracks?limit=5&time_range=...`: Top Tracks.
- `GET /v1/me/player/recently-played?limit=20`: actividad reciente.

Los rankings son afinidades calculadas por Spotify, no contadores exactos de reproducciones. Recently Played tampoco representa el historial completo de la cuenta.

## Funcionalidades actuales

- Dashboard responsive con sidebar y navegación por secciones.
- Perfil de Spotify integrado en la cabecera.
- Now Playing con portada, canción, artista, álbum, estado y progreso local.
- Polling de Now Playing cada 5 segundos; la barra avanza localmente cada segundo sin consultar la API.
- Recently Played se refresca cada 15 segundos y también cuando se detecta un cambio de canción.
- Top Artists y Top Tracks con Short Term, Medium Term y Long Term independientes.
- Recently Played con fechas amigables y enlaces hacia Spotify.
- Estados de carga, error y contenido vacío por sección.
- Manejo de 401 y rate limit 429 respetando `Retry-After` y evitando reintentos agresivos.

## Limitaciones

La aplicación depende de la disponibilidad y permisos de la cuenta del usuario en Spotify. El Development Mode de Spotify puede imponer restricciones de usuarios, acceso y solicitudes. Algunas cuentas pueden no tener reproducción actual o suficientes datos para rankings y actividad reciente.

Para validar Now Playing, el usuario debe reproducir contenido en Spotify con la misma cuenta autenticada. La aplicación no controla la reproducción ni descarga contenido.

## Verificación

```bash
npm run build
```

El proyecto debe compilar sin errores antes de probarlo manualmente con una cuenta Spotify.
