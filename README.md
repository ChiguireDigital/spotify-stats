# Spotify Stats

Aplicación web **full stack** para consultar y entender los hábitos musicales de una cuenta de Spotify. El usuario inicia sesión con Spotify, la aplicación sincroniza su información en una base de datos MySQL y presenta un dashboard personal con rankings, reproducción actual, historial, resúmenes de escucha y un asistente conversacional.

El proyecto nació como una SPA académica (Avance 1) y actualmente incorpora backend propio, persistencia, comunicación en tiempo real y un rediseño de interfaz guiado por una guía de diseño propia.

## Estado actual

| Fase | Estado |
| --- | --- |
| Backend, MySQL, autenticación, sincronización y API propia | ✅ Implementado |
| Dashboard con datos persistidos y chat en tiempo real | ✅ Implementado |
| Rediseño UI/UX, ambiente por portada y mejoras de dashboard | ✅ Implementado |
| Despliegue en la nube | ⬜ Pendiente (planificado en Azure for Students) |
| Documentación y presentación final | 🟡 En curso |

## Funcionalidades

- **Inicio de sesión con Spotify** mediante OAuth 2.0 (Authorization Code con PKCE) gestionado desde el backend, con sesión persistente durante la navegación.
- **Sincronización automática** al entrar al dashboard y **sincronización manual** desde la interfaz. Los datos se guardan en MySQL para conservar historial y construir vistas consistentes.
- **Now Playing** con portada, canción, artista, álbum, estado y progreso local; se actualiza cada 5 segundos.
- **Ambiente visual adaptativo**: el fondo y los acentos se derivan de la portada en reproducción; si no hay reproducción, se usa un tema neutro.
- **Top artistas y Top canciones** en tres periodos (corto, medio y largo plazo) con un destacado `#1` de mayor protagonismo.
- **Reproducciones recientes** con fechas amigables y enlace a Spotify.
- **Resumen de escucha por periodos** (`7d`, `4w`, `6m`, `all`) calculado a partir del historial guardado por la aplicación. Se comunica como estimación, no como conteo exacto.
- **Álbumes más escuchados**, agregados desde el historial almacenado.
- **Chat en tiempo real** con Socket.IO y Gemini, usando contexto controlado del usuario (perfil, rankings, historial y reproducción actual cuando aplica).
- **Pantalla de inicio tipo Steam** con un mosaico animado de portadas reales obtenidas desde la API pública de Deezer (48 portadas curadas, con caché y respaldo visual).
- **Diseño responsive**, estados de carga/vacío/error y respeto a `prefers-reduced-motion`.

## Arquitectura

```text
┌─────────────────────┐        HTTP / WebSocket        ┌──────────────────────┐
│  React + Vite       │  ───────────────────────────>  │  Node.js + Express   │
│  (frontend)         │  <───────────────────────────  │  (API + Socket.IO)   │
└─────────────────────┘                                └──────────┬───────────┘
                                                                  │
                                         ┌────────────────────────┼────────────────────────┐
                                         │                        │                        │
                                   ┌─────▼─────┐          ┌───────▼───────┐        ┌───────▼───────┐
                                   │   MySQL   │          │  Spotify API  │        │  Gemini API   │
                                   │ (datos)   │          │  (OAuth/datos)│        │  (chat)       │
                                   └───────────┘          └───────────────┘        └───────────────┘
```

- El **frontend** solo consume la API propia (`/api/...`); no llama directamente a Spotify para datos del dashboard.
- El **backend** centraliza autenticación, sincronización, persistencia y acceso a servicios externos.
- **Socket.IO** comparte la sesión HTTP para el chat y el contexto de reproducción.
- En producción se planea servir el build de Vite desde el mismo Express para mantener un solo origen (cookies y WebSockets sin configuración cross-site).

## Tecnologías

| Capa | Herramientas |
| --- | --- |
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express, express-session, CORS |
| Base de datos | MySQL, mysql2, migraciones SQL |
| Tiempo real | Socket.IO (servidor y cliente) |
| Spotify | Spotify Web API, OAuth 2.0 con PKCE |
| IA | Gemini API (modelo configurable por entorno) |
| Portadas del login | Deezer API pública |
| Pruebas y control de versiones | `node --test`, Git, GitHub |

## Estructura del repositorio

```text
.
├── src/                        # Frontend React
│   ├── api/                    # Cliente HTTP y Socket.IO
│   ├── auth/                   # Inicio y cierre de sesión
│   ├── components/             # Dashboard, rankings, chat, hero, login, etc.
│   ├── hooks/                  # Estado del dashboard y paleta de portada
│   ├── lib/                    # Utilidades de color/paleta
│   ├── pages/                  # Login, Callback y Dashboard
│   └── styles/                 # Estilos globales y sistema visual
├── server/
│   ├── migrations/             # 001_initial.sql, 002_chat.sql
│   ├── src/
│   │   ├── auth/               # Flujo OAuth/PKCE y tokens
│   │   ├── config/             # Variables de entorno
│   │   ├── db/                 # Pool, repositorios y consultas
│   │   ├── middleware/         # Rate limiting
│   │   ├── realtime/           # Socket.IO
│   │   ├── routes/             # Auth, Spotify, stats y públicas
│   │   ├── scripts/            # Migraciones
│   │   ├── services/           # Sync, Gemini y chat
│   │   └── utils/              # Fetch con timeout y cifrado
│   └── test/                   # Pruebas automatizadas
├── docs/                       # Arquitectura y prototipos de diseño
├── .env.example                # Plantilla de configuración
└── package.json
```

## Requisitos

- Node.js 20 o superior (recomendado LTS).
- MySQL 8 (local o accesible por red).
- Una aplicación creada en [Spotify for Developers](https://developer.spotify.com/dashboard).
- Opcional: una API key de Gemini para habilitar el chat.

## Instalación y ejecución local

### 1. Clonar e instalar

```bash
git clone https://github.com/ChiguireDigital/spotify-stats.git
cd spotify-stats
npm install
```

### 2. Crear la base de datos

```sql
CREATE DATABASE IF NOT EXISTS spotify_stats
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar variables de entorno

Copia la plantilla y completa los valores:

```bash
copy .env.example .env
```

En el **Spotify Developer Dashboard**, registra exactamente esta Redirect URI:

```text
http://127.0.0.1:3001/api/auth/callback
```

> El `.env` real está ignorado por Git y no debe subirse al repositorio. Solo se versiona `.env.example` sin secretos.

### 4. Aplicar migraciones

```bash
npm run db:migrate
```

### 5. Levantar backend y frontend

En dos terminales:

```bash
# Terminal 1: API + Socket.IO
npm run dev:server

# Terminal 2: frontend Vite
npm run dev
```

Abre **http://127.0.0.1:5173/**, inicia sesión con Spotify y espera la sincronización inicial.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `VITE_API_BASE_URL` | URL base del backend para el frontend (`http://127.0.0.1:3001` en local). |
| `PORT` | Puerto del backend (por defecto `3001`). |
| `CLIENT_ORIGIN` | Origen permitido para CORS y redirecciones (`http://127.0.0.1:5173` en local). |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | Conexión a MySQL. |
| `SPOTIFY_CLIENT_ID` | Client ID de la aplicación de Spotify. |
| `SPOTIFY_REDIRECT_URI` | Redirect URI registrada en Spotify (`http://127.0.0.1:3001/api/auth/callback` en local). |
| `SESSION_SECRET` | Secreto para firmar la cookie de sesión. Usa un valor largo y aleatorio fuera de local. |
| `GEMINI_API_KEY` | API key de Gemini (opcional; sin ella el chat no responde). |
| `GEMINI_MODEL` | Modelo de Gemini (por defecto `gemini-3.5-flash-lite`). |
| `TOKEN_ENCRYPTION_KEY` | Clave opcional para cifrar tokens de Spotify en la base de datos. |

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Frontend Vite en `http://127.0.0.1:5173`. |
| `npm run dev:server` | Backend con recarga automática y DNS IPv4-first. |
| `npm run start:server` | Backend en modo normal (sin `--watch`). |
| `npm run db:migrate` | Aplica las migraciones pendientes. |
| `npm test` | Pruebas automatizadas del backend con `node --test`. |
| `npm run build` | Build de producción del frontend en `dist/`. |
| `npm run preview` | Sirve localmente el build de Vite. |

## API propia

### Autenticación

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/auth/login` | Inicia el flujo OAuth con Spotify. |
| `GET` | `/api/auth/callback` | Recibe la respuesta de Spotify y crea la sesión. |
| `GET` | `/api/auth/me` | Devuelve el perfil autenticado o `401`. |
| `POST` | `/api/auth/logout` | Cierra la sesión. |

### Spotify (proxy y sincronización)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/spotify/profile` | Perfil del usuario. |
| `GET` | `/api/spotify/currently-playing` | Reproducción actual. |
| `GET` | `/api/spotify/top/artists?time_range=...` | Top artistas en vivo. |
| `GET` | `/api/spotify/top/tracks?time_range=...` | Top canciones en vivo. |
| `GET` | `/api/spotify/recently-played?limit=20` | Actividad reciente en vivo. |
| `GET` | `/api/spotify/artwork?url=...` | Proxy autenticado de portadas (hosts de Spotify permitidos). |
| `POST` | `/api/spotify/sync` | Sincronización completa hacia MySQL (rate limit: 6/min). |

### Estadísticas persistidas

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/stats/status` | Estado de la última sincronización. |
| `GET` | `/api/stats/top/artists?time_range=...` | Rankings guardados de artistas. |
| `GET` | `/api/stats/top/tracks?time_range=...` | Rankings guardados de canciones. |
| `GET` | `/api/stats/recently-played?limit=20` | Historial guardado. |
| `GET` | `/api/stats/listening-summary?period=7d\|4w\|6m\|all` | Resumen estimado de escucha. |
| `GET` | `/api/stats/top/albums?period=...&limit=8` | Álbumes más escuchados. |

### Públicas y salud

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/public/covers?limit=48` | Portadas curadas para el login (Deezer, con caché). |
| `GET` | `/api/health` | Estado del servidor y la base de datos. |

### Socket.IO

| Evento | Dirección | Descripción |
| --- | --- | --- |
| `chat:history` | Cliente ↔ servidor | Solicita/recibe el historial de conversación. |
| `chat:message` | Cliente → servidor | Envía un mensaje al asistente. |
| `chat:reply` | Servidor → cliente | Respuesta generada por Gemini. |
| `chat:typing` | Servidor → cliente | Indicador de escritura. |
| `chat:error` | Servidor → cliente | Error de la conversación. |
| `now-playing:start` / `now-playing:stop` | Cliente → servidor | Activa/detiene el contexto de reproducción. |
| `now-playing:update` | Servidor → cliente | Actualización del estado de reproducción. |

## Base de datos

Las migraciones crean las siguientes tablas:

- `users` y `spotify_accounts`: usuario y tokens de acceso.
- `artists`, `tracks` y `track_artists`: catálogo musical.
- `playback_history`: historial usado para resúmenes y álbumes.
- `ranking_snapshots`: rankings por periodo.
- `chat_messages`: historial del asistente.

## Pruebas y verificación

```bash
npm test
npm run build
```

El proyecto debe compilar sin errores y las pruebas del backend deben pasar antes de probar el flujo completo con una cuenta de Spotify.

## Limitaciones conocidas

- **Spotify Development Mode** limita el acceso a los usuarios autorizados en el panel de desarrolladores (máximo 5 usuarios).
- Los rankings de Spotify representan **afinidad calculada**, no conteos exactos de reproducciones.
- `recently-played` no equivale al historial completo de la cuenta.
- El **tiempo escuchado** es una estimación basada en el historial que la aplicación alcanzó a sincronizar.
- El chat depende de la disponibilidad de Gemini y de la API key configurada.
- El despliegue en producción aún no está realizado; el plan es Azure App Service + Azure Database for MySQL, con WebSockets habilitados y el build de Vite servido desde Express.

## Próximos pasos

1. Desplegar en Azure for Students (App Service + Azure Database for MySQL).
2. Ajustar configuración de producción: `0.0.0.0`/`PORT`, `trust proxy`, cookies seguras y session store persistente en MySQL.
3. Registrar la Redirect URI de producción en Spotify.
4. Ampliar pruebas y completar la documentación/presentación final.

## Licencia

Proyecto académico del curso **Desarrollo Full Stack**. Uso educativo.
