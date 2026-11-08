# Spotify Stats — arquitectura base

Este documento fija las decisiones de la Fase 0. La implementación se hará de forma incremental para conservar el dashboard actual mientras se incorpora el backend.

## Decisiones técnicas

- **Frontend:** React + Vite, manteniendo la interfaz actual.
- **Backend:** Node.js + Express en una aplicación separada dentro del mismo repositorio.
- **Base de datos:** MySQL.
- **Acceso a MySQL:** `mysql2/promise` y SQL parametrizado. Se evitará introducir un ORM en esta primera versión.
- **Autenticación:** Spotify OAuth 2.0 Authorization Code with PKCE. El backend gestionará la sesión y los tokens; el frontend no guardará refresh tokens.
- **Sesiones:** cookie de sesión `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- **Tiempo real:** Socket.IO, incorporado después de estabilizar la API REST.
- **Chatbot:** servicio backend separado que consultará funciones controladas sobre datos propios del usuario.
- **Configuración:** variables de entorno separadas para frontend, backend, Spotify y MySQL. Los secretos no se versionarán.

## Estructura prevista

```text
spotify-stats/
├── src/                 # Frontend React actual
├── server/              # Backend Node.js (Fase 1)
│   ├── src/
│   └── migrations/
├── docs/                # Decisiones y documentación del proyecto
└── package.json
```

## Límites de responsabilidad

```text
React ── REST / WebSocket ──> Node.js ──> MySQL
                                  │
                                  └──> Spotify Web API
```

- React presenta datos y gestiona la interacción.
- Node.js controla autenticación, permisos, sincronización y reglas de negocio.
- MySQL almacena únicamente la información necesaria para estadísticas y chatbot.
- Spotify sigue siendo la fuente externa de datos de escucha.

## Criterios de seguridad

- Nunca almacenar contraseñas de Spotify.
- Nunca subir `.env` ni Client Secrets al repositorio.
- Usar consultas parametrizadas contra MySQL.
- Validar usuario y sesión en cada endpoint privado.
- Cifrar o proteger los refresh tokens almacenados.
- Solicitar únicamente los scopes de Spotify necesarios.

## Intervenciones necesarias del propietario

La única decisión pendiente para comenzar la implementación es el entorno de MySQL:

- MySQL instalado directamente en la computadora.
- MySQL mediante Docker.
- MySQL/XAMPP.
- MySQL remoto.

El código se configurará con variables de entorno para que esta elección no afecte a la arquitectura.

## Orden de implementación

1. Backend mínimo y conexión MySQL.
2. Esquema y migraciones.
3. Autenticación Spotify en el backend.
4. API propia de estadísticas.
5. Sincronización y persistencia.
6. Migración del frontend.
7. WebSockets.
8. Chatbot.
9. Pruebas, seguridad y despliegue.
