import { useEffect } from 'react';
import ArtworkImage from './ArtworkImage';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';

function formatPlayedAt(value) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const time = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (sameDay) return `Hoy, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Ayer, ${time}`;
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function RecentlyPlayed({ items, loading, ready, error, onRefresh }) {
  useEffect(() => { const interval = window.setInterval(onRefresh, 15000); return () => window.clearInterval(interval); }, [onRefresh]);
  return (
    <section className="stats-section" id="recently-played" aria-labelledby="h-recent">
      <div className="section-head"><div><h2 id="h-recent">Actividad reciente</h2><p className="section-note">Escuchas en orden cronológico.</p></div></div>
      {loading && !ready ? <LoadingState label="Cargando actividad…" /> : error && !items.length ? <ErrorState /> : items.length ? (
        <ul className="history-list">
          {items.map((entry, index) => {
            const track = entry.track;
            return (
              <li key={`${entry.played_at}-${track?.id || index}`}>
                <ArtworkImage src={track?.album?.images?.[0]?.url || null} className="history-art" fallbackClassName="history-art-fallback" />
                <div className="rank-copy">
                  <a className="item-title" href={track?.external_urls?.spotify} target="_blank" rel="noreferrer">{track?.name || 'Canción no disponible'}</a>
                  <p className="item-meta">{track?.artists?.map((a) => a.name).join(', ') || 'Artista no disponible'}</p>
                </div>
                <time dateTime={entry.played_at}>{formatPlayedAt(entry.played_at)}</time>
              </li>
            );
          })}
        </ul>
      ) : <EmptyState>No encontramos reproducciones recientes.</EmptyState>}
    </section>
  );
}
