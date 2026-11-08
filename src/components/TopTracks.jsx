import ArtworkImage from './ArtworkImage';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import TimeRangeSelector from './TimeRangeSelector';

export default function TopTracks({ tracks, range, onRangeChange, loading, error }) {
  const [first, ...rest] = tracks || [];
  return (
    <section className="stats-section" id="top-tracks" aria-labelledby="h-tracks">
      <div className="section-head">
        <div><h2 id="h-tracks">Canciones destacadas</h2><p className="section-note">Tu ranking por afinidad en este periodo.</p></div>
        <TimeRangeSelector value={range} onChange={onRangeChange} label="Periodo de canciones" />
      </div>
      {loading ? <LoadingState label="Cargando canciones…" /> : error ? <ErrorState /> : tracks.length ? (
        <>
          {first && (
            <a className="spotlight spotlight-track" href={first.external_urls?.spotify} target="_blank" rel="noreferrer">
              <ArtworkImage src={first.album?.images?.[0]?.url || null} className="spotlight-art" fallbackClassName="spotlight-art-fallback" />
              <div className="spotlight-copy">
                <p className="spotlight-kicker">#1 · Tu canción principal</p>
                <h3 className="spotlight-title">{first.name}</h3>
                <p className="spotlight-meta">{first.artists?.map((a) => a.name).join(', ') || 'Artista no disponible'}{first.album?.name ? ` — ${first.album.name}` : ''}</p>
              </div>
            </a>
          )}
          {rest.length > 0 && (
            <ul className="track-rows">
              {rest.slice(0, 7).map((track, index) => (
                <li key={track.id || `${track.name}-${index}`}>
                  <span className="track-index">{String(index + 2).padStart(2, '0')}</span>
                  <ArtworkImage src={track.album?.images?.[0]?.url || null} className="track-art" fallbackClassName="track-art-fallback" />
                  <div className="rank-copy">
                    <a className="item-title" href={track.external_urls?.spotify} target="_blank" rel="noreferrer">{track.name}</a>
                    <p className="item-meta">{track.artists?.map((a) => a.name).join(', ') || 'Artista no disponible'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : <EmptyState>No encontramos canciones para este periodo.</EmptyState>}
    </section>
  );
}
