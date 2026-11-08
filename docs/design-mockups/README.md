# Mockups — Rediseño dinámico (Fase 8 propuesta)

Concepto pedido: el fondo toma el **color principal del cover** de la canción en *Now Playing*; si no hay nada sonando, pasa a **negro**. El color de texto/iconos se ajusta automáticamente según contraste.

## Referencias (dirección visual)
> Nota: intenté consultar `https://designmd.ai/` (catálogo de `DESIGN.md`, no una galería específica de UI “color desde cover”). Como `websearch` no estaba disponible en este entorno, estas referencias son patrones establecidos que encajan con tu idea:

1. **Apple Music / reproductores “immersive”**: fondo teñido por el arte del álbum, tipografía grande, jerarquía clara y contraste alto.
2. **Spotify (contexto de ambientación/lyrics/full-screen)**: uso de color derivado del artwork + superficies oscuras translúcidas para legibilidad.
3. **Patrón “dynamic theming from image”** (Vibrant.js / ColorThief / extracción de color dominante): se muestrea el cover → se obtiene un color/acento → se genera fondo/gradiente.
4. **Contraste automático**: calcular luminancia relativa (o YIQ) del color de fondo y elegir texto claro (`#f5f5f5`) u oscuro (`#111`) + superficies con alpha para garantizar legibilidad (objetivo WCAG AA para texto).

## Cómo abrir
Abre cualquiera de estos archivos en el navegador (doble clic):
- `01-adaptive-glow.html` — base oscura + halo/gradiente del color del cover (equilibrado).
- `02-immersive-cover.html` — fondo más inmersivo teñido por el cover, estilo “player”.
- `03-minimal-adaptive.html` — versión más limpia/minimal, acento sutil.

Cada mockup incluye botones para simular canciones (cambian el cover/color) y **“Nada sonando”** (fondo negro). El texto se adapta al contraste.

## Implementación real (cuando pasemos a Fase 8)
- Obtener color desde `album.images[0].url` (Now Playing). En navegador, `canvas` puede requerir CORS; si la imagen no permite `getImageData`, fallback: **extraer color en el backend** (proxy/descarga de imagen) o usar un acento derivado.
- Variables CSS: `--bg`, `--bg-accent`, `--fg`, `--muted`, `--surface` calculadas en runtime.
- Transición suave (`transition: background-color .6s`) y fallback negro cuando `currentlyPlaying` sea `null`.
