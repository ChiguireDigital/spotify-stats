import { useEffect } from 'react';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';

function formatPlayedAt(value) {
  const date = new Date(value); const now = new Date(); const sameDay = date.toDateString() === now.toDateString(); const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1); const time = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (sameDay) return `Hoy, ${time}`; if (date.toDateString() === yesterday.toDateString()) return `Ayer, ${time}`; return `${new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long' }).format(date)}, ${time}`;
}

export default function RecentlyPlayed({ items, loading, ready, error, onRefresh }) {
  useEffect(() => { const interval = window.setInterval(onRefresh, 15000); return () => window.clearInterval(interval); }, [onRefresh]);
  return <section className="content-section" id="recently-played"><div className="section-heading"><div><p className="eyebrow">ACTIVIDAD RECIENTE</p><h2>Recently Played</h2></div><span className="section-count">Últimas reproducciones</span></div>{loading && !ready ? <LoadingState label="Cargando actividad…" /> : error && !items.length ? <ErrorState /> : items.length ? <ul className="recent-list">{items.map((entry, index) => { const track = entry.track; return <li key={`${entry.played_at}-${track?.id || index}`}>{track?.album?.images?.[0]?.url ? <img src={track.album.images[0].url} alt="" /> : <span className="list-image-fallback">♪</span>}<div className="recent-copy"><a className="item-name" href={track?.external_urls?.spotify} target="_blank" rel="noreferrer">{track?.name || 'Canción no disponible'}</a><span>{track?.artists?.map((artist) => artist.name).join(', ') || 'Artista no disponible'}</span></div><time dateTime={entry.played_at}>{formatPlayedAt(entry.played_at)}</time></li>})}</ul> : <EmptyState>No encontramos reproducciones recientes.</EmptyState>}</section>;
}
