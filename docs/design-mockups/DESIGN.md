# DESIGN.md — Spotify Stats

## 01. Product Identity

Spotify Stats is a personal listening experience built around music discovery, listening history and visual storytelling.

The interface should feel closer to a beautifully designed music player or artist profile than a traditional statistics dashboard.

**Core principle:** Let the music create the atmosphere.

The artwork determines the mood. Typography establishes hierarchy. Spacing creates rhythm. Data remains readable without dominating the visual experience.

## 02. Visual Foundation

### Colors

| Token | Value |
|---|---|
| Background | `#0B0B0D` |
| Elevated surface | `#17171B` |
| Primary text | `#F5F5F5` |
| Secondary text | `#A1A1AA` |
| Subtle divider | `rgba(255,255,255,0.08)` |
| Dynamic accent | Derived from artwork |

Never use arbitrary accent colors when suitable artwork is available.

Avoid pure black everywhere. Use subtle tonal variation to establish depth.

### Typography

Use a contemporary sans-serif such as Geist or Inter.

- Hero title: 56–88px desktop, responsive.
- Page heading: 32–40px.
- Section heading: 22–28px.
- Body: 14–16px.
- Metadata: 12–13px.

Use strong typographic hierarchy without excessive font weights.

## 03. Artwork-Driven Hero

The hero is the primary visual feature of the application.

### Composition

- Occupies approximately 420–600px vertically on desktop, adjusted to viewport and content.
- Uses album artwork or artist photography as the dominant image.
- Allows the image to extend into the surrounding background.
- Places track information in a clearly readable area.
- Transitions naturally into the sections below.

### Gradient System

Use multiple independent layers rather than a single gradient:

1. **Image fade:** a vertical gradient transitions the artwork into the base background.
2. **Text protection:** a directional dark overlay improves text contrast.
3. **Ambient illumination:** large, blurred radial gradients use colors sampled from the artwork.
4. **Surface transition:** the lower edge blends into the main page without a visible seam.

The artwork must not appear as a rectangular image pasted onto a colored background.

Avoid visible gradient banding and oversaturated color fields.

### Dynamic Palette

Extract a small palette from the current artwork.

Choose a suitable dominant or secondary color, then adjust its saturation and luminance for comfortable background use.

Do not assume the most frequent pixel color is visually appropriate.

Animate palette changes over approximately 600–900ms.

If no track is playing, transition to a neutral near-black theme while retaining the user's listening statistics.

## 04. Navigation

Use a compact navigation system with clear active states.

Navigation should feel integrated with the application rather than floating above it.

Use subtle translucent surfaces only where needed to preserve legibility over artwork.

Avoid excessive navigation pills and decorative outlines.

## 05. Statistics Presentation

### Top Artists

Display artist imagery prominently.

Use editorial rankings with oversized numbers, artist photographs and concise listening information.

### Top Tracks

Use horizontal rows with album artwork, title, artist and relevant metrics.

Hover states may introduce subtle background emphasis.

### Listening History

Present recent listening activity as a clean chronological list.

Avoid enclosing every entry in an individual card.

### Data Visualization

Use charts selectively where they communicate meaningful listening patterns.

Keep chart colors compatible with the current theme.

Do not sacrifice clarity for visual decoration.

## 06. Surfaces and Depth

Prefer open layouts over card-heavy compositions.

Use cards only when they establish meaningful grouping.

Recommended styling:

- Border radius: 8–16px for standard components.
- Dividers: low-opacity white.
- Shadows: restrained and primarily used for artwork.
- Blur: reserved for ambient backgrounds and selected overlays.

Avoid glassmorphism as the default component style.

## 07. Interaction and Motion

Interactions should feel smooth and understated.

- Hover: 150–220ms.
- Content transitions: 250–350ms.
- Artwork and ambient palette transitions: 600–900ms.
- Use opacity and transform where possible.
- Avoid unnecessary bouncing, scaling or continuous animation.

Support `prefers-reduced-motion`.

## 08. Responsive Behavior

### Desktop

Use a spacious layout with immersive artwork and multi-column statistics where appropriate.

### Tablet

Reduce hero height, adjust typography and preserve image visibility.

### Mobile

Use a vertically stacked composition.

Reposition the image focal point and gradient overlays so track information remains readable.

Never rely on desktop cropping behavior for mobile.

## 09. Accessibility

- Meet WCAG AA text contrast targets.
- Maintain readable text over dynamic imagery.
- Support keyboard navigation and visible focus indicators.
- Provide meaningful alternative text for artwork.
- Respect reduced-motion settings.
- Do not rely on color alone to communicate information.

## 10. Implementation Guidelines

Build reusable React components for:

- ImmersiveHero
- AmbientBackground
- ArtworkImage
- ArtistRanking
- TrackRanking
- ListeningHistory
- StatisticsSection

Keep the ambient background independent of the content layout.

Use CSS custom properties for the dynamic palette.

Implement smooth fallback behavior when artwork or color extraction fails.

Avoid extracting artwork colors on every render. Cache palette results by artwork URL.

## 11. Design Anti-Patterns

Never default to:

- A grid of identical rounded statistic cards.
- Purple and blue gradients unrelated to the music.
- Oversized glowing buttons.
- Heavy borders around every section.
- Excessive backdrop blur.
- Generic analytics-dashboard composition.
- Unnecessary floating elements.
- Bright accent colors competing with album artwork.

## 12. Final Design Standard

The page should feel like a living music environment.

When the song changes, the atmosphere changes.

When the user scrolls, the visual experience transitions naturally from artwork into personal listening data.

The result should feel intentional, immersive and distinctly music-focused.
