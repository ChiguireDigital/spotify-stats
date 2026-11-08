import { useEffect, useState } from 'react';

export default function ImmersiveHero({ currentlyPlaying, profile }) {
  const track = currentlyPlaying?.item || null;
  const image = track?.album?.images?.[0]?.url || null;
  const isPlaying = Boolean(currentlyPlaying?.is_playing && track);
  const hasTrack = Boolean(track);
  const name = profile?.display_name ? `, ${profile.display_name}` : '';

  const [slots, setSlots] = useState({ a: image, b: null, active: 'a' });
  useEffect(() => {
    setSlots((prev) => {
      const current = prev.active === 'a' ? prev.a : prev.b;
      if (current === image) return prev;
      if (!image) return { a: null, b: null, active: 'a' };
      const next = prev.active === 'a' ? 'b' : 'a';
      return { ...prev, [next]: image, active: next };
    });
  }, [image]);

  return (
    <header className="immersive-hero" id="dashboard">
      <div className="hero-art" aria-hidden={!image}>
        <div className={`hero-artwork hero-artwork-slot ${slots.active === 'a' && slots.a ? 'is-visible' : ''}`} style={slots.a ? { backgroundImage: `url("${slots.a}")` } : undefined} />
        <div className={`hero-artwork hero-artwork-slot ${slots.active === 'b' && slots.b ? 'is-visible' : ''}`} style={slots.b ? { backgroundImage: `url("${slots.b}")` } : undefined} />
        {!slots.a && !slots.b && <div className="hero-artwork hero-artwork-empty is-visible" />}
        <div className="hero-layer hero-fade" />
        <div className="hero-layer hero-protect" />
        <div className="hero-layer hero-warm" />
        <div className="hero-layer hero-seam" />
      </div>
      <div className="hero-content">
        <p className="kicker">{hasTrack ? (isPlaying ? 'Sonando ahora' : 'En pausa') : 'Tu espacio'}</p>
        <h1 className="hero-title">
          {hasTrack ? track.name : `Bienvenido${name}`}
        </h1>
        <p className="hero-sub">
          {hasTrack
            ? `${(track.artists || []).map((a) => a.name).join(', ')}${track.album?.name ? ` — ${track.album.name}` : ''}`
            : 'No hay nada sonando. Cuando reproduzcas algo, la atmósfera tomará el color del artwork.'}
        </p>
        <div className="hero-meta">
          <span className={`hero-dot ${hasTrack && isPlaying ? 'is-live' : ''}`} aria-hidden="true" />
          <span>{hasTrack ? (isPlaying ? 'Reproducción en curso' : 'Pausado') : 'Tema neutro, estadísticas disponibles'}</span>
        </div>
      </div>
    </header>
  );
}
