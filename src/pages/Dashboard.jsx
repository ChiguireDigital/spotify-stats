import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileHeader from '../components/ProfileHeader';
import CurrentlyPlaying from '../components/CurrentlyPlaying';
import TopArtists from '../components/TopArtists';
import TopTracks from '../components/TopTracks';
import RecentlyPlayed from '../components/RecentlyPlayed';

export default function Dashboard({ profile, dashboard, onLogout, onRefreshCurrentlyPlaying, onRefreshRecentlyPlayed, onRefreshTopArtists, onRefreshTopTracks }) {
  const [artistsRange, setArtistsRange] = useState('medium_term');
  const [tracksRange, setTracksRange] = useState('medium_term');
  const changeArtistsRange = (range) => { setArtistsRange(range); onRefreshTopArtists(range); };
  const changeTracksRange = (range) => { setTracksRange(range); onRefreshTopTracks(range); };
  return <div className="app-shell" id="dashboard"><Sidebar profile={profile} onLogout={onLogout} /><main className="dashboard-main"><ProfileHeader profile={profile} /><div className="dashboard-intro"><p className="eyebrow">TU ACTIVIDAD MUSICAL</p><h2>Lo que está sonando<br /><em>en tu mundo.</em></h2></div><CurrentlyPlaying item={dashboard.currentlyPlaying} loading={dashboard.loading.currentlyPlaying} ready={dashboard.ready.currentlyPlaying} error={dashboard.errors.currentlyPlaying} onRefresh={onRefreshCurrentlyPlaying} onTrackChange={onRefreshRecentlyPlayed} /><div className="stats-grid"><TopArtists artists={dashboard.topArtists} range={artistsRange} onRangeChange={changeArtistsRange} loading={dashboard.loading.topArtists} error={dashboard.errors.topArtists} /><TopTracks tracks={dashboard.topTracks} range={tracksRange} onRangeChange={changeTracksRange} loading={dashboard.loading.topTracks} error={dashboard.errors.topTracks} /></div><RecentlyPlayed items={dashboard.recentlyPlayed} loading={dashboard.loading.recentlyPlayed} ready={dashboard.ready.recentlyPlayed} error={dashboard.errors.recentlyPlayed} onRefresh={onRefreshRecentlyPlayed} /><footer className="dashboard-footer">Contenido y datos proporcionados por Spotify. <span>Los rankings representan afinidad calculada por Spotify.</span></footer></main></div>;
}
