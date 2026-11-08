import { useEffect, useState } from 'react';
import AmbientBackground from '../components/AmbientBackground';
import ChatPanel from '../components/ChatPanel';
import ImmersiveHero from '../components/ImmersiveHero';
import ListeningSummary from '../components/ListeningSummary';
import RecentlyPlayed from '../components/RecentlyPlayed';
import TopAlbums from '../components/TopAlbums';
import TopArtists from '../components/TopArtists';
import TopNav from '../components/TopNav';
import TopTracks from '../components/TopTracks';
import { useArtworkPalette } from '../hooks/useArtworkPalette';

export default function Dashboard({ profile, dashboard, onLogout, onRefreshCurrentlyPlaying, onRefreshRecentlyPlayed, onRefreshTopArtists, onRefreshTopTracks, onRefreshListeningSummary, onRefreshTopAlbums }) {
  const [artistsRange, setArtistsRange] = useState('medium_term');
  const [tracksRange, setTracksRange] = useState('medium_term');
  const [summaryPeriod, setSummaryPeriod] = useState('4w');
  const [albumsPeriod, setAlbumsPeriod] = useState('all');
  const playing = dashboard.currentlyPlaying;
  const isPlaying = Boolean(playing?.is_playing && playing?.item);
  useArtworkPalette(playing?.item?.album?.images?.[0]?.url, isPlaying);

  useEffect(() => {
    onRefreshCurrentlyPlaying();
    const interval = window.setInterval(() => onRefreshCurrentlyPlaying(), 5000);
    return () => window.clearInterval(interval);
  }, [onRefreshCurrentlyPlaying]);

  const changeArtistsRange = (range) => { setArtistsRange(range); onRefreshTopArtists(range); };
  const changeTracksRange = (range) => { setTracksRange(range); onRefreshTopTracks(range); };
  const changeSummaryPeriod = (period) => { setSummaryPeriod(period); onRefreshListeningSummary?.(period); };
  const changeAlbumsPeriod = (period) => { setAlbumsPeriod(period); onRefreshTopAlbums?.(period); };

  return (
    <div className="app-shell redesign">
      <AmbientBackground />
      <TopNav profile={profile} onLogout={onLogout} />
      <ImmersiveHero currentlyPlaying={dashboard.currentlyPlaying} profile={profile} />
      <main className="content">
        <ListeningSummary summary={dashboard.listeningSummary} period={summaryPeriod} onPeriodChange={changeSummaryPeriod} loading={dashboard.loading.listeningSummary} error={dashboard.errors.listeningSummary} />
        <div className="cols">
          <TopArtists artists={dashboard.topArtists} range={artistsRange} onRangeChange={changeArtistsRange} loading={dashboard.loading.topArtists} error={dashboard.errors.topArtists} />
          <TopTracks tracks={dashboard.topTracks} range={tracksRange} onRangeChange={changeTracksRange} loading={dashboard.loading.topTracks} error={dashboard.errors.topTracks} />
        </div>
        <TopAlbums albums={dashboard.topAlbums} period={albumsPeriod} onPeriodChange={changeAlbumsPeriod} loading={dashboard.loading.topAlbums} error={dashboard.errors.topAlbums} />
        <RecentlyPlayed items={dashboard.recentlyPlayed} loading={dashboard.loading.recentlyPlayed} ready={dashboard.ready.recentlyPlayed} error={dashboard.errors.recentlyPlayed} onRefresh={onRefreshRecentlyPlayed} />
        <footer className="footer">Contenido y datos proporcionados por Spotify. <span>La atmósfera cambia con lo que estás escuchando.</span></footer>
      </main>
      <ChatPanel />
    </div>
  );
}
