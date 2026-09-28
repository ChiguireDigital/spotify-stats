import { useEffect, useState } from 'react';
import { completeSpotifyLogin } from '../auth/spotifyAuth';

export default function Callback() {
  const [error, setError] = useState('');
  useEffect(() => { const params = new URLSearchParams(window.location.search); const code = params.get('code'); const state = params.get('state'); const authError = params.get('error'); if (authError) { setError('La autorización fue cancelada.'); return; } if (!code || !state) { setError('La respuesta de Spotify está incompleta.'); return; } completeSpotifyLogin(code, state).then(() => { window.location.replace('/'); }).catch((err) => { console.error(err); setError(err.message || 'No pudimos completar el inicio de sesión.'); }); }, []);
  return <main className="center-page"><div className="status-panel"><div className="spinner" />{error ? <><h1>No se pudo iniciar sesión</h1><p>{error}</p><a className="text-link" href="/">Volver al inicio</a></> : <><h1>Conectando con Spotify…</h1><p>Estamos preparando tu espacio personal.</p></>}</div></main>;
}
