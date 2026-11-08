import { useEffect, useMemo, useState } from 'react';
import { beginSpotifyLogin } from '../auth/spotifyAuth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001';

function buildRows(covers, count = 48) {
  const base = covers.length ? covers : Array.from({ length: count }, () => null);
  const fill = [];
  while (fill.length < count) fill.push(...base);
  const items = fill.slice(0, count);
  // interleave across 4 rows so the same covers aren't clustered
  const rows = [[], [], [], []];
  items.forEach((item, i) => rows[i % 4].push(item));
  return rows.filter((r) => r.length);
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [covers, setCovers] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/public/covers?limit=48`)
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((d) => { if (!cancelled) setCovers(Array.isArray(d?.items) ? d.items : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const rows = useMemo(() => buildRows(covers, 48), [covers]);
  const handleLogin = async () => { setLoading(true); setError(''); try { await beginSpotifyLogin(); } catch (err) { setLoading(false); setError(err.message); } };

  return (
    <main className="login-page steam-login">
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg-dim" />
        {rows.map((row, i) => (
          <div key={i} className={`cover-marquee row-${i + 1}`}>
            <div className="cover-marquee-track">
              {[...row, ...row].map((url, j) => (
                <span key={`${i}-${j}-${url || 'p'}-${Math.floor(j / row.length)}`} className={`marquee-tile tone-${(j % 6) + 1}`}>
                  {url ? <img src={url} alt="" loading="eager" decoding="async" ref={(el) => { if (el && el.complete && el.naturalWidth) el.classList.add('is-loaded'); }} onLoad={(e) => e.currentTarget.classList.add('is-loaded')} onError={(e) => e.currentTarget.classList.add('is-error')} /> : null}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div className="login-bg-vignette" />
      </div>

      <section className="login-center">
        <div className="login-card">
          <div className="brand-mark">♪</div>
          <p className="eyebrow">PERSONAL MUSIC INSIGHTS</p>
          <h1>Spotify<br /><span>Stats</span></h1>
          <p className="login-copy">Una mirada clara a tus hábitos musicales, usando tus propios datos de Spotify.</p>
          <button className="spotify-button" onClick={handleLogin} disabled={loading}>{loading ? 'Conectando…' : 'Iniciar sesión con Spotify'}</button>
          {error && <p className="error-message" role="alert">{error}</p>}
          <p className="fine-print">Solo solicitaremos permisos de lectura para tus estadísticas.</p>
        </div>
      </section>
    </main>
  );
}
