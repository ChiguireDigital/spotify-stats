import { useEffect, useRef } from 'react';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import ProgressBar from './ProgressBar';

export default function CurrentlyPlaying({ item, loading, ready, error, onRefresh, onTrackChange }) {
  const lastTrackId = useRef(null);
  useEffect(() => { const interval = window.setInterval(onRefresh, 5000); return () => window.clearInterval(interval); }, [onRefresh]);
  useEffect(() => {
    const trackId = item?.item?.id;
    if (trackId && lastTrackId.current && trackId !== lastTrackId.current) onTrackChange();
    lastTrackId.current = trackId || null;
  }, [item, onTrackChange]);
  if (loading && !ready) return <section className="content-section now-playing-section"><SectionHeading eyebrow="AHORA" title="Now Playing" /><LoadingState label="Consultando tu reproducción…" /> </section>;
  if (error && !item) return <section className="content-section now-playing-section"><SectionHeading eyebrow="AHORA" title="Now Playing" /><ErrorState /></section>;
  if (!item?.item) return <section className="content-section now-playing-section"><SectionHeading eyebrow="AHORA" title="Now Playing" /><EmptyState>No hay nada reproduciéndose ahora.</EmptyState></section>;
  const track = item.item;
  const image = track.album?.images?.[0]?.url;
  return <section className="content-section now-playing-section"><SectionHeading eyebrow="AHORA" title="Now Playing"><span className={item.is_playing ? 'playing-indicator' : 'paused-indicator'}>{item.is_playing ? '● En reproducción' : 'Ⅱ Pausado'}</span></SectionHeading><div className="now-playing-content">{image ? <img className="now-playing-cover" src={image} alt={`Portada de ${track.album?.name || track.name}`} /> : <div className="cover-fallback">♪</div>}<div className="now-playing-info"><div><a className="track-title" href={track.external_urls?.spotify} target="_blank" rel="noreferrer">{track.name}</a><p className="track-meta">{track.artists?.map((artist, index) => <span key={artist.id || artist.name}>{index > 0 && ', '}<a href={artist.external_urls?.spotify} target="_blank" rel="noreferrer">{artist.name}</a></span>)}</p><p className="album-meta">{track.album?.name || 'Álbum no disponible'}</p></div><ProgressBar progressMs={item.progress_ms} durationMs={track.duration_ms} isPlaying={item.is_playing} /></div></div></section>;
}

function SectionHeading({ eyebrow, title, children }) { return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{children}</div>; }
