import ArtworkImage from './ArtworkImage';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import TimeRangeSelector from './TimeRangeSelector';

function artistImage(artist) {
  return artist?.images?.find((img) => img?.url)?.url || null;
}

export default function TopArtists({ artists, range, onRangeChange, loading, error }) {
  const [first, ...rest] = artists || [];
  return (
    <section className="stats-section" id="top-artists" aria-labelledby="h-artists">
      <div className="section-head">
        <div><h2 id="h-artists">Artistas más escuchados</h2><p className="section-note">Tu ranking por afinidad en este periodo.</p></div>
        <TimeRangeSelector value={range} onChange={onRangeChange} label="Periodo de artistas" />
      </div>
      {loading ? <LoadingState label="Cargando artistas…" /> : error ? <ErrorState /> : artists.length ? (
        <>
          {first && (
            <a className="spotlight spotlight-artist" href={first.external_urls?.spotify} target="_blank" rel="noreferrer">
              <ArtworkImage src={artistImage(first)} className="spotlight-art" fallbackClassName="spotlight-art-fallback" />
              <div className="spotlight-copy">
                <p className="spotlight-kicker">#1 · Tu artista principal</p>
                <h3 className="spotlight-title">{first.name}</h3>
                <p className="spotlight-meta">Afinidad más alta en este periodo</p>
              </div>
            </a>
          )}
          {rest.length > 0 && (
            <ol className="artist-rank" start="2">
              {rest.slice(0, 4).map((artist, index) => (
                <li key={artist.id || artist.name}>
                  <span className="rank-num">{String(index + 2).padStart(2, '0')}</span>
                  <ArtworkImage src={artistImage(artist)} className="artist-photo" fallbackClassName="artist-photo-fallback" />
                  <div className="rank-copy">
                    <a className="item-title" href={artist.external_urls?.spotify} target="_blank" rel="noreferrer">{artist.name}</a>
                    <p className="item-meta">Afinidad alta en este periodo</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : <EmptyState>No encontramos artistas para este periodo.</EmptyState>}
    </section>
  );
}
