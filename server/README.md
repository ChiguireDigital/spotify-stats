# Backend local

El backend utiliza Node.js, Express y MySQL local.

En el Spotify Developer Dashboard registra esta Redirect URI:

```text
http://127.0.0.1:3001/api/auth/callback
```

El valor de `SPOTIFY_CLIENT_ID` debe ser el mismo Client ID de tu aplicación Spotify.

Para iniciar el backend:

```bash
npm run dev:server
```

La API queda disponible en `http://127.0.0.1:3001`.

Para probar el login del backend visita `http://127.0.0.1:3001/api/auth/login`.

El frontend todavía no utiliza estas rutas; esa migración corresponde a la siguiente fase.
