const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001';
const cache = new Map();

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function pickAccentFromImage(img) {
  const c = document.createElement('canvas');
  c.width = 48; c.height = 48;
  const x = c.getContext('2d', { willReadFrequently: true });
  if (!x) return null;
  x.drawImage(img, 0, 0, 48, 48);
  const d = x.getImageData(0, 0, 48, 48).data;
  let best = null, bestScore = -1;
  for (let i = 0; i < d.length; i += 16) {
    const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    if (a < 180) continue;
    const [h, s, l] = rgbToHsl(r, g, b);
    const score = (s / 100) * (1 - Math.abs(l - 46) / 58) - (l < 10 ? 0.5 : 0) - (l > 90 ? 0.3 : 0);
    if (score > bestScore) { bestScore = score; best = { h, s, l }; }
  }
  if (!best) return [140, 140, 150];
  // keep it vivid enough to tint the page, but still comfortable as ambient color
  const s = Math.min(Math.max(best.s, 34), 78);
  const l = Math.min(Math.max(best.l, 38), 62);
  return hslToRgb(best.h, s, l);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function getArtworkAccent(artworkUrl) {
  if (!artworkUrl) return null;
  if (cache.has(artworkUrl)) return cache.get(artworkUrl);
  try {
    const proxy = `${API_BASE}/api/spotify/artwork?url=${encodeURIComponent(artworkUrl)}`;
    const res = await fetch(proxy, { credentials: 'include' });
    if (!res.ok) throw new Error('proxy');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const img = await loadImage(objectUrl);
      const rgb = pickAccentFromImage(img) || [130, 130, 130];
      cache.set(artworkUrl, rgb);
      return rgb;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

export function applyPalette(rgb, isPlaying) {
  const root = document.documentElement.style;
  if (!rgb || !isPlaying) {
    root.setProperty('--accent-rgb', '120,120,128');
    root.setProperty('--accent', 'rgb(120,120,128)');
    root.setProperty('--ambient-opacity', isPlaying ? '0.55' : '0.16');
    root.setProperty('--ambient-strength', isPlaying ? '0.35' : '0.12');
    return;
  }
  const [r, g, b] = rgb;
  root.setProperty('--accent-rgb', `${r},${g},${b}`);
  root.setProperty('--accent', `rgb(${r},${g},${b})`);
  root.setProperty('--ambient-opacity', '1');
  root.setProperty('--ambient-strength', '0.92');
}
