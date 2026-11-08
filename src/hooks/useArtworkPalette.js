import { useEffect, useState } from 'react';
import { applyPalette, getArtworkAccent } from '../lib/palette';

export function useArtworkPalette(artworkUrl, isPlaying) {
  const [rgb, setRgb] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (!artworkUrl || !isPlaying) {
      setRgb(null);
      applyPalette(null, false);
      return () => { cancelled = true; };
    }
    getArtworkAccent(artworkUrl).then((value) => {
      if (cancelled) return;
      setRgb(value);
      applyPalette(value, true);
    });
    return () => { cancelled = true; };
  }, [artworkUrl, isPlaying]);
  return rgb;
}
