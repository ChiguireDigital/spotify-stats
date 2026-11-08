import { Router } from 'express';
import { fetchWithTimeout } from '../utils/fetch.js';

const router = Router();

let cache = { at: 0, items: [] };
const TTL = 1000 * 60 * 60 * 6; // 6h

const KNOWN_ALBUMS = [
  { artist: 'Pink Floyd', album: 'The Dark Side of the Moon' },
  { artist: 'Michael Jackson', album: 'Thriller' },
  { artist: 'The Beatles', album: 'Abbey Road' },
  { artist: 'Fleetwood Mac', album: 'Rumours' },
  { artist: 'Nirvana', album: 'Nevermind' },
  { artist: 'Daft Punk', album: 'Discovery' },
  { artist: 'Radiohead', album: 'OK Computer' },
  { artist: 'Amy Winehouse', album: 'Back to Black' },
  { artist: 'Kendrick Lamar', album: 'good kid, m.A.A.d city' },
  { artist: 'Queen', album: 'A Night at the Opera' },
  { artist: 'Bob Marley & The Wailers', album: 'Legend' },
  { artist: 'David Bowie', album: 'The Rise and Fall of Ziggy Stardust' },
  { artist: 'The Rolling Stones', album: 'Sticky Fingers' },
  { artist: 'Led Zeppelin', album: 'Led Zeppelin IV' },
  { artist: 'Prince', album: 'Purple Rain' },
  { artist: 'Madonna', album: 'Like a Virgin' },
  { artist: 'Eminem', album: 'The Marshall Mathers LP' },
  { artist: 'Beyoncé', album: 'Lemonade' },
  { artist: 'Drake', album: 'Take Care' },
  { artist: 'Taylor Swift', album: '1989' },
  { artist: 'Frank Ocean', album: 'Blonde' },
  { artist: 'Tame Impala', album: 'Currents' },
  { artist: 'Bad Bunny', album: 'Un Verano Sin Ti' },
  { artist: 'Rosalía', album: 'Motomami' },
  { artist: 'The Weeknd', album: 'After Hours' },
  { artist: 'Billie Eilish', album: 'When We All Fall Asleep, Where Do We Go?' },
  { artist: 'Arctic Monkeys', album: 'AM' },
  { artist: 'Gorillaz', album: 'Demon Days' },
  { artist: 'Coldplay', album: 'Parachutes' },
  { artist: 'Oasis', album: "(What's the Story) Morning Glory?" },
  { artist: 'U2', album: 'The Joshua Tree' },
  { artist: 'AC/DC', album: 'Back in Black' },
  { artist: 'Metallica', album: 'Master of Puppets' },
  { artist: 'Guns N Roses', album: 'Appetite for Destruction' },
  { artist: 'Red Hot Chili Peppers', album: 'Californication' },
  { artist: 'The Strokes', album: 'Is This It' },
  { artist: 'Lana Del Rey', album: 'Born to Die' },
  { artist: 'Adele', album: '21' },
  { artist: 'Rihanna', album: 'Anti' },
  { artist: 'Kanye West', album: 'My Beautiful Dark Twisted Fantasy' },
  { artist: 'Tyler, The Creator', album: 'Igor' },
  { artist: 'Shakira', album: 'Fijación Oral, Vol. 1' },
  { artist: 'Soda Stereo', album: 'Canción Animal' },
  { artist: 'Gustavo Cerati', album: 'Bocanada' },
  { artist: 'Juanes', album: 'Mi Sangre' },
  { artist: 'Karol G', album: 'Mañana Será Bonito' },
  { artist: 'Miles Davis', album: 'Kind of Blue' },
  { artist: 'Aretha Franklin', album: 'I Never Loved a Man the Way I Love You' },
];

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function isBadVariant(title, wanted) {
  const t = norm(title);
  const w = norm(wanted);
  // allow deluxe/remaster/anniversary editions, reject live/cover/karaoke/tribute-like mismatches when base differs too much
  if (/(live at|live in|karaoke|tribute|made famous|instrumental|8-bit|lullaby|cover version)/.test(t) && !/(live)/.test(w)) return true;
  return false;
}

function scoreAlbum(candidate, wanted, artistName) {
  const t = norm(candidate.title);
  const w = norm(wanted);
  const a = norm(candidate.artist?.name);
  const wantA = norm(artistName).split(' ')[0]; // loose
  let score = 0;
  if (a.includes(wantA) || wantA && a) score += 3;
  if (t === w) score += 8;
  else if (t.startsWith(w) || t.includes(w)) score += 5;
  else return -1;
  if (candidate.record_type === 'album') score += 3;
  else if (candidate.record_type === 'ep') score += 1;
  else score -= 1;
  if (isBadVariant(candidate.title, wanted)) score -= 6;
  if ((candidate.nb_tracks || 0) >= 6) score += 1;
  return score;
}

async function getJson(url) {
  const res = await fetchWithTimeout(url, {}, 12000);
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

async function resolveCover({ artist, album }) {
  try {
    // 1) find artist
    const aData = await getJson(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artist)}&limit=1`);
    const artistId = aData?.data?.[0]?.id;
    if (artistId) {
      const alData = await getJson(`https://api.deezer.com/artist/${artistId}/albums?limit=40`);
      const list = alData?.data || [];
      let best = null, bestScore = -1;
      for (const c of list) {
        const s = scoreAlbum(c, album, artist);
        if (s > bestScore) { bestScore = s; best = c; }
      }
      if (best && bestScore >= 5 && best.cover_xl) return best.cover_xl;
      if (best && bestScore >= 5 && best.cover_big) return String(best.cover_big).replace('/500x500-', '/1000x1000-');
    }
    // 2) fallback: album search + validation
    const sData = await getJson(`https://api.deezer.com/search/album?q=${encodeURIComponent(`artist:"${artist}" album:"${album}"`)}&limit=6`);
    let best = null, bestScore = -1;
    for (const c of sData?.data || []) {
      const s = scoreAlbum(c, album, artist);
      if (s > bestScore) { bestScore = s; best = c; }
    }
    if (best && bestScore >= 5) return best.cover_xl || (best.cover_big ? String(best.cover_big).replace('/500x500-', '/1000x1000-') : null);
  } catch { /* ignore */ }
  return null;
}

async function fetchCovers(limit = 48) {
  const items = [];
  const seen = new Set();
  const batchSize = 5;
  for (let i = 0; i < KNOWN_ALBUMS.length && items.length < limit; i += batchSize) {
    const batch = KNOWN_ALBUMS.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map((entry) => resolveCover(entry)));
    for (const r of results) {
      const url = r.status === 'fulfilled' ? r.value : null;
      if (url && !seen.has(url)) { seen.add(url); items.push(url); }
      if (items.length >= limit) break;
    }
  }
  return items;
}

router.get('/covers', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 48, 60);
    if (cache.items.length >= limit && Date.now() - cache.at < TTL) return res.json({ items: cache.items.slice(0, limit) });
    const items = await fetchCovers(limit);
    if (items.length) cache = { at: Date.now(), items };
    res.json({ items: items.length ? items.slice(0, limit) : cache.items.slice(0, limit) });
  } catch {
    res.json({ items: cache.items || [] });
  }
});

export default router;
