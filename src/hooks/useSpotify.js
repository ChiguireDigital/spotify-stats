import { useCallback, useEffect, useState } from 'react';
import {
  getSession, getCurrentlyPlaying, getProfile, getRecentlyPlayed, getSyncStatus,
  getStoredRecentlyPlayed, getStoredTopArtists, getStoredTopTracks,
  getListeningSummary, getTopAlbums,
  getTopArtists, getTopTracks, syncSpotify,
} from '../api/backend';
import { logout } from '../auth/spotifyAuth';

export function useSpotify() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [dashboard, setDashboard] = useState({
    currentlyPlaying: null,
    topArtists: [],
    topTracks: [],
    recentlyPlayed: [],
    listeningSummary: null,
    topAlbums: [],
    loading: { currentlyPlaying: true, topArtists: true, topTracks: true, recentlyPlayed: true, listeningSummary: true, topAlbums: true },
    ready: { currentlyPlaying: false, topArtists: false, topTracks: false, recentlyPlayed: false, listeningSummary: false, topAlbums: false },
    errors: {},
  });

  const refreshSyncStatus = useCallback(async () => {
    try { setSyncStatus(await getSyncStatus()); } catch { /* estado opcional */ }
  }, []);

  const normalizeSection = (section, value) => {
    if (section === 'currentlyPlaying' || section === 'listeningSummary') return value;
    return value?.items || [];
  };

  const updateSection = useCallback(async (section, request) => {
    setDashboard((current) => ({
      ...current,
      loading: { ...current.loading, [section]: true },
      errors: { ...current.errors, [section]: '' },
    }));
    try {
      const value = await request();
      const normalizedValue = normalizeSection(section, value);
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

  const loadStoredOrLive = useCallback(async (storedFn, liveFn) => {
    try {
      const stored = await storedFn();
      if (stored?.items?.length) return stored;
    } catch { /* fallback */ }
    return liveFn();
  }, []);

  const loadProfile = useCallback(async () => {
    setStatus('loading'); setError('');
    const results = await Promise.allSettled([
      getProfile(),
      getCurrentlyPlaying(),
      loadStoredOrLive(() => getStoredTopArtists('medium_term'), () => getTopArtists('medium_term')),
      loadStoredOrLive(() => getStoredTopTracks('medium_term'), () => getTopTracks('medium_term')),
      loadStoredOrLive(() => getStoredRecentlyPlayed(20), () => getRecentlyPlayed(20)),
      getSyncStatus(),
      getListeningSummary('4w'),
      getTopAlbums('all', 8),
    ]);
    const [profileResult, playingResult, artistsResult, tracksResult, recentResult, syncResult, summaryResult, albumsResult] = results;
    if (profileResult.status === 'rejected') {
      console.error(profileResult.reason);
      setProfile(null); setStatus('error'); setError('No pudimos cargar tu perfil de Spotify.');
      return;
    }
    setProfile(profileResult.value);
    if (syncResult.status === 'fulfilled') setSyncStatus(syncResult.value);
    setStatus('authenticated');
    setDashboard({
      currentlyPlaying: playingResult.status === 'fulfilled' ? playingResult.value : null,
      topArtists: artistsResult.status === 'fulfilled' ? (artistsResult.value?.items || []) : [],
      topTracks: tracksResult.status === 'fulfilled' ? (tracksResult.value?.items || []) : [],
      recentlyPlayed: recentResult.status === 'fulfilled' ? (recentResult.value?.items || []) : [],
      listeningSummary: summaryResult.status === 'fulfilled' ? summaryResult.value : null,
      topAlbums: albumsResult.status === 'fulfilled' ? (albumsResult.value?.items || []) : [],
      loading: { currentlyPlaying: false, topArtists: false, topTracks: false, recentlyPlayed: false, listeningSummary: false, topAlbums: false },
      ready: { currentlyPlaying: true, topArtists: true, topTracks: true, recentlyPlayed: true, listeningSummary: true, topAlbums: true },
      errors: {
        currentlyPlaying: playingResult.status === 'rejected' ? 'No pudimos cargar esta información.' : '',
        topArtists: artistsResult.status === 'rejected' ? 'No pudimos cargar esta información.' : '',
        topTracks: tracksResult.status === 'rejected' ? 'No pudimos cargar esta información.' : '',
        recentlyPlayed: recentResult.status === 'rejected' ? 'No pudimos cargar esta información.' : '',
        listeningSummary: summaryResult.status === 'rejected' ? 'No pudimos cargar esta información.' : '',
        topAlbums: albumsResult.status === 'rejected' ? 'No pudimos cargar esta información.' : '',
      },
    });
    // Sync automático en segundo plano y luego refresca desde BD.
    syncSpotify()
      .then(async () => {
        await refreshSyncStatus();
        const [a, t, r, s, al] = await Promise.allSettled([
          getStoredTopArtists('medium_term'),
          getStoredTopTracks('medium_term'),
          getStoredRecentlyPlayed(20),
          getListeningSummary('4w'),
          getTopAlbums('all', 8),
        ]);
        setDashboard((current) => ({
          ...current,
          topArtists: a.status === 'fulfilled' && a.value?.items?.length ? a.value.items : current.topArtists,
          topTracks: t.status === 'fulfilled' && t.value?.items?.length ? t.value.items : current.topTracks,
          recentlyPlayed: r.status === 'fulfilled' && r.value?.items?.length ? r.value.items : current.recentlyPlayed,
          listeningSummary: s.status === 'fulfilled' ? s.value : current.listeningSummary,
          topAlbums: al.status === 'fulfilled' && al.value?.items?.length ? al.value.items : current.topAlbums,
        }));
      })
      .catch(() => {});
  }, [loadStoredOrLive, refreshSyncStatus]);

  useEffect(() => {
    getSession().then(() => loadProfile()).catch(() => setStatus('unauthenticated'));
  }, [loadProfile]);

  const signOut = async () => { await logout(); setProfile(null); setStatus('unauthenticated'); };
  const syncNow = useCallback(async () => {
    setSyncing(true);
    setSyncError('');
    try {
      const result = await syncSpotify();
      await refreshSyncStatus();
      if (result?.result?.errors?.length) setSyncError('Sincronización parcial: revisa la conexión con Spotify.');
      return result;
    } catch (err) {
      setSyncError(err?.message || 'No se pudo sincronizar.');
      return null;
    } finally {
      setSyncing(false);
    }
  }, [refreshSyncStatus]);

  return {
    profile, status, error, dashboard, reload: loadProfile, signOut,
    syncStatus, syncing, syncError, syncNow,
    refreshCurrentlyPlaying: useCallback(() => updateSection('currentlyPlaying', getCurrentlyPlaying), [updateSection]),
    refreshRecentlyPlayed: useCallback(async () => {
      const v = await updateSection('recentlyPlayed', () => loadStoredOrLive(() => getStoredRecentlyPlayed(20), () => getRecentlyPlayed(20)));
      refreshSyncStatus();
      return v;
    }, [updateSection, loadStoredOrLive, refreshSyncStatus]),
    refreshTopArtists: useCallback(async (range) => {
      const v = await updateSection('topArtists', () => loadStoredOrLive(() => getStoredTopArtists(range), () => getTopArtists(range)));
      refreshSyncStatus();
      return v;
    }, [updateSection, loadStoredOrLive, refreshSyncStatus]),
    refreshTopTracks: useCallback(async (range) => {
      const v = await updateSection('topTracks', () => loadStoredOrLive(() => getStoredTopTracks(range), () => getTopTracks(range)));
      refreshSyncStatus();
      return v;
    }, [updateSection, loadStoredOrLive, refreshSyncStatus]),
    refreshListeningSummary: useCallback((period) => updateSection('listeningSummary', () => getListeningSummary(period)), [updateSection]),
    refreshTopAlbums: useCallback((period) => updateSection('topAlbums', () => getTopAlbums(period, 8)), [updateSection]),
  };
}
