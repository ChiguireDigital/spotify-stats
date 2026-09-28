import { useCallback, useEffect, useState } from 'react';
import { getCurrentlyPlaying, getProfile, getRecentlyPlayed, getTopArtists, getTopTracks } from '../api/spotify';
import { getStoredToken, logout } from '../auth/spotifyAuth';

export function useSpotify() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(getStoredToken() ? 'loading' : 'unauthenticated');
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState({
    currentlyPlaying: null,
    topArtists: [],
    topTracks: [],
    recentlyPlayed: [],
    loading: { currentlyPlaying: true, topArtists: true, topTracks: true, recentlyPlayed: true },
    ready: { currentlyPlaying: false, topArtists: false, topTracks: false, recentlyPlayed: false },
    errors: {},
  });

  const updateSection = useCallback(async (section, request) => {
    setDashboard((current) => ({
      ...current,
      loading: { ...current.loading, [section]: true },
      errors: { ...current.errors, [section]: '' },
    }));
    try {
      const value = await request();
      const normalizedValue = section === 'currentlyPlaying' ? value : (value?.items || []);
      setDashboard((current) => ({
        ...current,
        [section]: normalizedValue,
        loading: { ...current.loading, [section]: false },
        ready: { ...current.ready, [section]: true },
      }));
      return normalizedValue;
    } catch (err) {
      console.error(err);
      if (err.status === 401) {
        logout();
        setProfile(null);
        setStatus('unauthenticated');
      }
      setDashboard((current) => ({
        ...current,
        loading: { ...current.loading, [section]: false },
        errors: { ...current.errors, [section]: 'No pudimos cargar esta información.' },
      }));
      return null;
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setStatus('loading'); setError('');
    const results = await Promise.allSettled([
      getProfile(),
      getCurrentlyPlaying(),
      getTopArtists('medium_term'),
      getTopTracks('medium_term'),
      getRecentlyPlayed(),
    ]);
    const [profileResult, playingResult, artistsResult, tracksResult, recentResult] = results;
    if (profileResult.status === 'rejected') {
      console.error(profileResult.reason);
      setProfile(null); setStatus('error'); setError('No pudimos cargar tu perfil de Spotify.');
      return;
    }
    setProfile(profileResult.value);
    setStatus('authenticated');
    setDashboard({
      currentlyPlaying: playingResult.status === 'fulfilled' ? playingResult.value : null,
      topArtists: artistsResult.status === 'fulfilled' ? (artistsResult.value?.items || []) : [],
      topTracks: tracksResult.status === 'fulfilled' ? (tracksResult.value?.items || []) : [],
      recentlyPlayed: recentResult.status === 'fulfilled' ? (recentResult.value?.items || []) : [],
      loading: { currentlyPlaying: false, topArtists: false, topTracks: false, recentlyPlayed: false },
      ready: { currentlyPlaying: true, topArtists: true, topTracks: true, recentlyPlayed: true },
      errors: {
        currentlyPlaying: playingResult.status === 'rejected' ? 'No pudimos cargar esta información.' : '',
        topArtists: artistsResult.status === 'rejected' ? 'No pudimos cargar esta información.' : '',
        topTracks: tracksResult.status === 'rejected' ? 'No pudimos cargar esta información.' : '',
        recentlyPlayed: recentResult.status === 'rejected' ? 'No pudimos cargar esta información.' : '',
      },
    });
  }, []);

  useEffect(() => { if (getStoredToken()) loadProfile(); }, [loadProfile]);

  const signOut = () => { logout(); setProfile(null); setStatus('unauthenticated'); };
  return {
    profile, status, error, dashboard, reload: loadProfile, signOut,
    refreshCurrentlyPlaying: useCallback(() => updateSection('currentlyPlaying', getCurrentlyPlaying), [updateSection]),
    refreshRecentlyPlayed: useCallback(() => updateSection('recentlyPlayed', getRecentlyPlayed), [updateSection]),
    refreshTopArtists: useCallback((range) => updateSection('topArtists', () => getTopArtists(range)), [updateSection]),
    refreshTopTracks: useCallback((range) => updateSection('topTracks', () => getTopTracks(range)), [updateSection]),
  };
}
