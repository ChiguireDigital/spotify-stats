import ArtworkImage from './ArtworkImage';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import TimeRangeSelector from './TimeRangeSelector';

const periods = [
  ['4w', '4 semanas'],
  ['6m', '6 meses'],
  ['all', 'Todo lo guardado'],
];

function formatPlays(ms, plays) {
  const p = `${Number(plays || 0).toLocaleString('es-PE')} reproducciones`;
  const mins = Math.floor(Number(ms || 0) / 60000);
  if (mins < 60) return `${p} · ${mins} min`;
  return `${p} · ${(mins / 60).toFixed(mins % 60 ? 1 : 0)} h`;
}

export default function TopAlbums({ albums, period, onPeriodChange, loading, error }) {
  return (
    <section className="stats-section" id="top-albums" aria-labelledby="h-albums">
      <div className="section-head">
        <div><h2 id="h-albums">Álbumes más escuchados</h2><p className="section-note">Los que más se repiten en tu historial guardado.</p></div>
        <TimeRangeSelector value={period} onChange={onPeriodChange} label="Periodo de álbumes" options={periods} />
      </div>
      {loading && !albums.length ? <LoadingState label="Cargando álbumes…" /> : error && !albums.length ? <ErrorState /> : albums.length ? (
        <ul className="album-rows">
          {albums.map((album, index) => {
            const inner = (
              <>
                <span className="rank-num rank-num-sm">{String(index + 1).padStart(2, '0')}</span>
                <ArtworkImage src={album.image || null} className="album-art" fallbackClassName="album-art-fallback" />
                <div className="rank-copy">
                  <span className="item-title">{album.name}</span>
                  <p className="item-meta">{album.artistName || 'Artista no disponible'}</p>
                </div>
                <span className="metric">{formatPlays(album.ms, album.plays)}</span>
              </>
            );
            return (
              <li key={`${album.name}-${index}`}>
                {album.spotifyUrl ? <a className="album-row-link" href={album.spotifyUrl} target="_blank" rel="noreferrer">{inner}</a> : <div className="album-row-link">{inner}</div>}
              </li>
            );
          })}
        </ul>
      ) : <EmptyState>Aún no hay álbumes para este periodo en tu historial guardado.</EmptyState>}
    </section>
  );
}
