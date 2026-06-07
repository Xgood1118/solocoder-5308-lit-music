const DB_NAME = 'lit-music-db';
const DB_VERSION = 1;
const STORE_SONGS = 'songs';
const STORE_PLAYLISTS = 'playlists';
const STORE_HISTORY = 'history';

export class StorageManager {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_SONGS)) {
          const store = db.createObjectStore(STORE_SONGS, { keyPath: 'id' });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('artist', 'artist', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_PLAYLISTS)) {
          db.createObjectStore(STORE_PLAYLISTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id', autoIncrement: true });
          historyStore.createIndex('songId', 'songId', { unique: false });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
    return this.initPromise;
  }

  async addSong(song) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SONGS, 'readwrite');
      const store = tx.objectStore(STORE_SONGS);
      const request = store.put(song);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSong(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SONGS, 'readonly');
      const store = tx.objectStore(STORE_SONGS);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSongs() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SONGS, 'readonly');
      const store = tx.objectStore(STORE_SONGS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSong(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SONGS, 'readwrite');
      const store = tx.objectStore(STORE_SONGS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async savePlaylist(playlist) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_PLAYLISTS, 'readwrite');
      const store = tx.objectStore(STORE_PLAYLISTS);
      const request = store.put(playlist);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPlaylist(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_PLAYLISTS, 'readonly');
      const store = tx.objectStore(STORE_PLAYLISTS);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPlaylists() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_PLAYLISTS, 'readonly');
      const store = tx.objectStore(STORE_PLAYLISTS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePlaylist(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_PLAYLISTS, 'readwrite');
      const store = tx.objectStore(STORE_PLAYLISTS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addHistoryEntry(entry) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_HISTORY);
      const request = store.add({ ...entry, timestamp: Date.now() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentHistory(limit = 100) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_HISTORY, 'readonly');
      const store = tx.objectStore(STORE_HISTORY);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      const results = [];
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const storage = new StorageManager();

const LS_KEYS = {
  VOLUME: 'lit-music-volume',
  MUTED: 'lit-music-muted',
  LOOP_MODE: 'lit-music-loop',
  SHUFFLE: 'lit-music-shuffle',
  THEME: 'lit-music-theme',
  LAST_SONG: 'lit-music-last-song',
  CURRENT_PLAYLIST: 'lit-music-current-playlist',
  LYRICS_CACHE: 'lit-music-lyrics-',
  ROLE: 'lit-music-role',
  SUBSCRIBED: 'lit-music-subscribed',
  CHILD_PIN: 'lit-music-child-pin',
  GUEST_START_TIME: 'lit-music-guest-start',
  LAST_MONTHLY_REPORT: 'lit-music-last-monthly-report'
};

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
  CHILD: 'child'
};

export const FREE_QUOTA = 200;
export const CHILD_VOLUME_LIMIT = 0.6;
export const GUEST_TIMEOUT = 30 * 60 * 1000;

export function getVolume() {
  const v = localStorage.getItem(LS_KEYS.VOLUME);
  return v !== null ? parseFloat(v) : 0.7;
}

export function setVolume(vol) {
  localStorage.setItem(LS_KEYS.VOLUME, String(vol));
}

export function getMuted() {
  return localStorage.getItem(LS_KEYS.MUTED) === 'true';
}

export function setMuted(muted) {
  localStorage.setItem(LS_KEYS.MUTED, String(muted));
}

export function getLoopMode() {
  return localStorage.getItem(LS_KEYS.LOOP_MODE) || 'list';
}

export function setLoopMode(mode) {
  localStorage.setItem(LS_KEYS.LOOP_MODE, mode);
}

export function getShuffle() {
  return localStorage.getItem(LS_KEYS.SHUFFLE) === 'true';
}

export function setShuffle(shuffle) {
  localStorage.setItem(LS_KEYS.SHUFFLE, String(shuffle));
}

export function getTheme() {
  return localStorage.getItem(LS_KEYS.THEME) || 'system';
}

export function setTheme(theme) {
  localStorage.setItem(LS_KEYS.THEME, theme);
}

export function getLastSong() {
  try {
    const data = localStorage.getItem(LS_KEYS.LAST_SONG);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setLastSong(songId, currentTime) {
  localStorage.setItem(LS_KEYS.LAST_SONG, JSON.stringify({ songId, currentTime, timestamp: Date.now() }));
}

export function getCurrentPlaylistId() {
  return localStorage.getItem(LS_KEYS.CURRENT_PLAYLIST) || 'default';
}

export function setCurrentPlaylistId(id) {
  localStorage.setItem(LS_KEYS.CURRENT_PLAYLIST, id);
}

export function getLyricsCache(songId) {
  try {
    const data = localStorage.getItem(LS_KEYS.LYRICS_CACHE + songId);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setLyricsCache(songId, lyrics) {
  localStorage.setItem(LS_KEYS.LYRICS_CACHE + songId, JSON.stringify(lyrics));
}

export function getRole() {
  return localStorage.getItem(LS_KEYS.ROLE) || ROLES.ADMIN;
}

export function setRole(role) {
  localStorage.setItem(LS_KEYS.ROLE, role);
  if (role === ROLES.GUEST) {
    localStorage.setItem(LS_KEYS.GUEST_START_TIME, String(Date.now()));
  }
}

export function getSubscribed() {
  return localStorage.getItem(LS_KEYS.SUBSCRIBED) === 'true';
}

export function setSubscribed(subscribed) {
  localStorage.setItem(LS_KEYS.SUBSCRIBED, String(subscribed));
}

export function getChildPin() {
  return localStorage.getItem(LS_KEYS.CHILD_PIN) || '';
}

export function setChildPin(pin) {
  localStorage.setItem(LS_KEYS.CHILD_PIN, pin);
}

export function getGuestStartTime() {
  const t = localStorage.getItem(LS_KEYS.GUEST_START_TIME);
  return t ? parseInt(t, 10) : 0;
}

export function getLastMonthlyReport() {
  const t = localStorage.getItem(LS_KEYS.LAST_MONTHLY_REPORT);
  return t ? parseInt(t, 10) : 0;
}

export function setLastMonthlyReport(time) {
  localStorage.setItem(LS_KEYS.LAST_MONTHLY_REPORT, String(time));
}

export async function getHistoryByDateRange(startTime, endTime) {
  const allHistory = await storage.getRecentHistory(10000);
  return allHistory.filter(h => h.timestamp >= startTime && h.timestamp <= endTime);
}

export async function getMonthlyReport(year, month) {
  const startOfMonth = new Date(year, month, 1).getTime();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).getTime();
  const history = await getHistoryByDateRange(startOfMonth, endOfMonth);
  
  const totalPlays = history.length;
  let totalDuration = 0;
  const artistPlays = {};
  const songPlays = {};
  const hourlyDistribution = new Array(24).fill(0);
  const firstTimeSongs = new Set();
  const allSongIds = new Set();

  for (const entry of history) {
    totalDuration += entry.duration || 0;
    if (entry.artist) {
      artistPlays[entry.artist] = (artistPlays[entry.artist] || 0) + 1;
    }
    if (entry.songId) {
      if (!allSongIds.has(entry.songId)) {
        firstTimeSongs.add(entry.songId);
      }
      allSongIds.add(entry.songId);
      songPlays[entry.songId] = (songPlays[entry.songId] || 0) + 1;
    }
    const hour = new Date(entry.timestamp).getHours();
    hourlyDistribution[hour]++;
  }

  const topArtists = Object.entries(artistPlays)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    year,
    month,
    totalPlays,
    totalDuration,
    topArtists,
    hourlyDistribution,
    newSongsCount: firstTimeSongs.size,
    uniqueSongs: allSongIds.size
  };
}
