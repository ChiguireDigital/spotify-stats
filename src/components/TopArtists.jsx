import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import TimeRangeSelector from './TimeRangeSelector';

export default function TopArtists({ artists, range, onRangeChange, loading, error }) {
  return <section className="content-section" id="top-artists"><div className="section-heading section-heading-wrap"><div><p className="eyebrow">AFINIDAD</p><h2>Top Artists</h2><p className="section-note">Tus artistas con mayor afinidad en Spotify.</p></div><TimeRangeSelector value={range} onChange={onRangeChange} label="Periodo de Top Artists" /></div>{loading ? <LoadingState label="Cargando artistas…" /> : error ? <ErrorState /> : artists.length ? <ol className="artist-list">{artists.slice(0, 5).map((artist, index) => <li key={artist.id || artist.name}><span className="item-number">{String(index + 1).padStart(2, '0')}</span>{artist.images?.[0]?.url ? <img src={artist.images[0].url} alt="" /> : <span className="list-image-fallback">♪</span>}<a className="item-name" href={artist.external_urls?.spotify} target="_blank" rel="noreferrer">{artist.name}</a><span className="open-mark">↗</span></li>)}</ol> : <EmptyState>No encontramos artistas para este periodo.</EmptyState>}</section>;
}
