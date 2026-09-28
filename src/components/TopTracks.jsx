import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import TimeRangeSelector from './TimeRangeSelector';

export default function TopTracks({ tracks, range, onRangeChange, loading, error }) {
  return <section className="content-section" id="top-tracks"><div className="section-heading section-heading-wrap"><div><p className="eyebrow">ESCUCHAS DESTACADAS</p><h2>Top Tracks</h2><p className="section-note">Una selección basada en tu afinidad musical.</p></div><TimeRangeSelector value={range} onChange={onRangeChange} label="Periodo de Top Tracks" /></div>{loading ? <LoadingState label="Cargando canciones…" /> : error ? <ErrorState /> : tracks.length ? <ol className="track-list">{tracks.slice(0, 5).map((track, index) => <li key={track.id || `${track.name}-${index}`}><span className="item-number">{String(index + 1).padStart(2, '0')}</span>{track.album?.images?.[0]?.url ? <img src={track.album.images[0].url} alt="" /> : <span className="list-image-fallback">♪</span>}<div className="track-list-copy"><a className="item-name" href={track.external_urls?.spotify} target="_blank" rel="noreferrer">{track.name}</a><span>{track.artists?.map((artist) => artist.name).join(', ')}</span></div><span className="track-album">{track.album?.name || '—'}</span><span className="open-mark">↗</span></li>)}</ol> : <EmptyState>No encontramos canciones para este periodo.</EmptyState>}</section>;
}
