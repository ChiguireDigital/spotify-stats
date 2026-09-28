import { useState } from 'react';
import { beginSpotifyLogin } from '../auth/spotifyAuth';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleLogin = async () => { setLoading(true); setError(''); try { await beginSpotifyLogin(); } catch (err) { setLoading(false); setError(err.message); } };
  return <main className="login-page"><section className="login-panel"><div className="brand-mark">♪</div><p className="eyebrow">PERSONAL MUSIC INSIGHTS</p><h1>Spotify<br /><span>Stats</span></h1><p className="login-copy">Una mirada clara a tus hábitos musicales, usando tus propios datos de Spotify.</p><button className="spotify-button" onClick={handleLogin} disabled={loading}>{loading ? 'Conectando…' : 'Iniciar sesión con Spotify'}</button>{error && <p className="error-message" role="alert">{error}</p>}<p className="fine-print">Solo solicitaremos permisos de lectura para tus estadísticas.</p></section><div className="login-art" aria-hidden="true"><span className="art-note note-one">♪</span><span className="art-note note-two">♫</span><div className="art-lines" /></div></main>;
}
