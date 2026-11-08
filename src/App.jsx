import { useEffect, useState } from 'react';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { useSpotify } from './hooks/useSpotify';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const spotify = useSpotify();
  useEffect(() => { const onPop = () => setPath(window.location.pathname); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  if (path === '/callback') return <Callback />;
  if (spotify.status === 'loading') return <main className="center-page"><div className="status-panel"><div className="spinner" /><h1>Cargando tu perfil…</h1><p>Un momento, estamos consultando Spotify.</p></div></main>;
  if (spotify.status === 'authenticated') return <Dashboard profile={spotify.profile} dashboard={spotify.dashboard} onLogout={spotify.signOut} onRefreshCurrentlyPlaying={spotify.refreshCurrentlyPlaying} onRefreshRecentlyPlayed={spotify.refreshRecentlyPlayed} onRefreshTopArtists={spotify.refreshTopArtists} onRefreshTopTracks={spotify.refreshTopTracks} onRefreshListeningSummary={spotify.refreshListeningSummary} onRefreshTopAlbums={spotify.refreshTopAlbums} />;
  return <Login />;
}
