import { LitElement, html, css } from 'lit';
import { 
  getVolume, setVolume, getMuted, setMuted,
  getLoopMode, setLoopMode, getShuffle, setShuffle,
  getLastSong, setLastSong, getLyricsCache, setLyricsCache,
  getCurrentPlaylistId, setCurrentPlaylistId,
  storage, generateId, shuffleArray, debounce
} from '../utils/all-utils.js';
import { parseLRC } from '../utils/lrc-parser.js';

import './now-playing.js';
import './player-controls.js';
import './playlist-component.js';
import './lyrics-component.js';

class MusicPlayer extends LitElement {
  static properties = {
    songs: { type: Array },
    currentSongIndex: { type: Number },
    currentSong: { type: Object },
    isPlaying: { type: Boolean },
    currentTime: { type: Number },
    duration: { type: Number },
    volume: { type: Number },
    muted: { type: Boolean },
    loopMode: { type: String },
    shuffle: { type: Boolean },
    playlists: { type: Array },
    currentPlaylistId: { type: String },
    lyrics: { type: Array },
    showLyrics: { type: Boolean },
    shuffleHistory: { type: Array },
    shuffleIndex: { type: Number },
    userStopped: { type: Boolean },
    showMetadata: { type: Boolean },
    metadataSong: { type: Object },
    autoplayBlocked: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .player-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .main-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .settings-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 0;
    }

    .theme-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      color: var(--text-color, #333);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .theme-btn:hover {
      background: var(--hover-bg, rgba(0, 0, 0, 0.1));
    }

    .theme-btn svg {
      width: 20px;
      height: 20px;
    }

    .autoplay-warning {
      background: #fff3cd;
      color: #856404;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .autoplay-warning button {
      background: #ffc107;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      color: #856404;
      font-weight: 500;
    }

    .metadata-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .metadata-content {
      background: var(--modal-bg, #fff);
      padding: 24px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .metadata-content h3 {
      margin-top: 0;
      color: var(--text-color, #333);
    }

    .metadata-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color, #eee);
      font-size: 14px;
    }

    .metadata-label {
      width: 100px;
      color: var(--text-secondary, #888);
      flex-shrink: 0;
    }

    .metadata-value {
      flex: 1;
      color: var(--text-color, #333);
      word-break: break-all;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 24px;
      color: var(--text-secondary, #888);
      float: right;
      padding: 0;
      line-height: 1;
    }

    .close-btn:hover {
      color: var(--text-color, #333);
    }

    @media (max-width: 768px) {
      .main-content {
        grid-template-columns: 1fr;
      }
    }
  `;

  constructor() {
    super();
    this.songs = [];
    this.currentSongIndex = -1;
    this.currentSong = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = getVolume();
    this.muted = getMuted();
    this.loopMode = getLoopMode();
    this.shuffle = getShuffle();
    this.playlists = [];
    this.currentPlaylistId = getCurrentPlaylistId();
    this.lyrics = [];
    this.showLyrics = true;
    this.shuffleHistory = [];
    this.shuffleIndex = -1;
    this.userStopped = false;
    this.showMetadata = false;
    this.metadataSong = null;
    this.autoplayBlocked = false;
    this._audio = null;
    this._debouncedSetCurrentTime = null;
    this._saveProgressTimer = null;
  }

  firstUpdated() {
    this._audio = new Audio();
    this._audio.volume = this.muted ? 0 : this.volume;

    this._audio.addEventListener('timeupdate', () => {
      this.currentTime = this._audio.currentTime;
    });

    this._audio.addEventListener('loadedmetadata', () => {
      this.duration = this._audio.duration;
      if (this.currentSong) {
        this.currentSong.duration = this._audio.duration;
      }
    });

    this._audio.addEventListener('ended', () => {
      if (!this.userStopped) {
        this._onSongEnded();
      }
      this.userStopped = false;
    });

    this._audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.autoplayBlocked = false;
    });

    this._audio.addEventListener('pause', () => {
      this.isPlaying = false;
    });

    this._audio.addEventListener('error', () => {
      console.error('音频播放错误');
      this.isPlaying = false;
    });

    this._debouncedSetCurrentTime = debounce((time) => {
      this._audio.currentTime = time;
    }, 50);

    this._loadPlaylists();
    this._loadSongs();
    this._restoreLastPlayed();

    document.addEventListener('visibilitychange', () => {
      // 页面切换时音频继续播放（不做任何暂停操作）
    });

    this._saveProgressTimer = setInterval(() => {
      if (this.currentSong && this.isPlaying) {
        setLastSong(this.currentSong.id, this.currentTime);
      }
    }, 5000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._saveProgressTimer) {
      clearInterval(this._saveProgressTimer);
    }
    if (this.currentSong) {
      setLastSong(this.currentSong.id, this.currentTime);
    }
  }

  async _loadPlaylists() {
    try {
      const playlists = await storage.getAllPlaylists();
      if (playlists.length === 0) {
        const defaultPlaylist = {
          id: 'default',
          name: '默认歌单',
          songIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await storage.savePlaylist(defaultPlaylist);
        this.playlists = [defaultPlaylist];
      } else {
        this.playlists = playlists;
      }
    } catch (e) {
      console.error('加载歌单失败:', e);
      this.playlists = [{ id: 'default', name: '默认歌单', songIds: [] }];
    }
  }

  async _loadSongs() {
    try {
      const allSongs = await storage.getAllSongs();
      const currentPlaylist = this.playlists.find(p => p.id === this.currentPlaylistId);
      if (currentPlaylist) {
        this.songs = allSongs.filter(s => currentPlaylist.songIds.includes(s.id));
      }
    } catch (e) {
      console.error('加载歌曲失败:', e);
    }
  }

  async _restoreLastPlayed() {
    const last = getLastSong();
    if (!last) return;

    const song = this.songs.find(s => s.id === last.songId);
    if (!song) return;

    const timeDiff = Date.now() - last.timestamp;
    if (timeDiff < 10 * 1000) {
      this._playSongById(last.songId);
      setTimeout(() => {
        if (last.currentTime > 0) {
          this._audio.currentTime = last.currentTime;
        }
      }, 100);
    }
  }

  render() {
    return html`
      <div class="player-wrapper">
        <div class="settings-bar">
          <button class="theme-btn" @click="${this._toggleLyrics}" title="${this.showLyrics ? '隐藏歌词' : '显示歌词'}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </button>
          <button class="theme-btn" @click="${this._cycleTheme}" title="切换主题">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
            </svg>
          </button>
        </div>

        ${this.autoplayBlocked ? html`
          <div class="autoplay-warning">
            <span>浏览器阻止了自动播放，点击页面任意位置开始播放</span>
            <button @click="${this._dismissAutoplayWarning}">知道了</button>
          </div>
        ` : ''}

        <now-playing
          .song="${this.currentSong}"
          .currentTime="${this.currentTime}"
          .duration="${this.duration}"
          .isPlaying="${this.isPlaying}"
          @seek="${this._onSeek}"
        ></now-playing>

        <player-controls
          .isPlaying="${this.isPlaying}"
          .volume="${this.volume}"
          .muted="${this.muted}"
          .loopMode="${this.loopMode}"
          .shuffle="${this.shuffle}"
          .hasPrev="${this.songs.length > 0}"
          .hasNext="${this.songs.length > 0}"
          @play-pause="${this._togglePlay}"
          @prev="${this._prev}"
          @next="${this._next}"
          @toggle-mute="${this._toggleMute}"
          @volume-change="${this._onVolumeChange}"
          @volume-change-end="${this._onVolumeChangeEnd}"
          @loop-change="${this._onLoopChange}"
          @shuffle-change="${this._onShuffleChange}"
        ></player-controls>

        <div class="main-content">
          <playlist-component
            .songs="${this.songs}"
            .currentSongId="${this.currentSong?.id}"
            .playlists="${this.playlists}"
            .currentPlaylistId="${this.currentPlaylistId}"
            .selectedIndexes="${[]}"
            @songs-added="${this._onSongsAdded}"
            @play-song="${this._onPlaySong}"
            @remove-songs="${this._onRemoveSongs}"
            @reorder="${this._onReorder}"
            @playlist-change="${this._onPlaylistChange}"
            @new-playlist="${this._onNewPlaylist}"
            @show-metadata="${this._onShowMetadata}"
            @add-next="${this._onAddNext}"
          ></playlist-component>

          ${this.showLyrics ? html`
            <lyrics-component
              .lyrics="${this.lyrics}"
              .currentTime="${this.currentTime}"
              .songId="${this.currentSong?.id}"
              .visible="${true}"
              @seek="${this._onLyricSeek}"
              @lyrics-loaded="${this._onLyricsLoaded}"
            ></lyrics-component>
          ` : ''}
        </div>

        ${this.showMetadata && this.metadataSong ? html`
          <div class="metadata-modal" @click="${this._closeMetadata}">
            <div class="metadata-content" @click="${e => e.stopPropagation()}">
              <button class="close-btn" @click="${this._closeMetadata}">&times;</button>
              <h3>歌曲元数据</h3>
              <div class="metadata-row">
                <span class="metadata-label">标题</span>
                <span class="metadata-value">${this.metadataSong.title || '未知'}</span>
              </div>
              <div class="metadata-row">
                <span class="metadata-label">艺术家</span>
                <span class="metadata-value">${this.metadataSong.artist || '未知'}</span>
              </div>
              <div class="metadata-row">
                <span class="metadata-label">专辑</span>
                <span class="metadata-value">${this.metadataSong.album || '未知'}</span>
              </div>
              <div class="metadata-row">
                <span class="metadata-label">文件名</span>
                <span class="metadata-value">${this.metadataSong.filename || '未知'}</span>
              </div>
              <div class="metadata-row">
                <span class="metadata-label">时长</span>
                <span class="metadata-value">${this._formatTime(this.metadataSong.duration)}</span>
              </div>
              <div class="metadata-row">
                <span class="metadata-label">文件大小</span>
                <span class="metadata-value">${this._formatFileSize(this.metadataSong.size)}</span>
              </div>
              <div class="metadata-row">
                <span class="metadata-label">音轨号</span>
                <span class="metadata-value">${this.metadataSong.track || '-'}</span>
              </div>
              <div class="metadata-row">
                <span class="metadata-label">ID</span>
                <span class="metadata-value">${this.metadataSong.id}</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  _formatTime(seconds) {
    if (!seconds) return '未知';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  _formatFileSize(bytes) {
    if (!bytes) return '未知';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  _togglePlay() {
    if (this.isPlaying) {
      this.userStopped = true;
      this._audio.pause();
    } else {
      this.userStopped = false;
      if (!this.currentSong && this.songs.length > 0) {
        this.playIndex(0);
      } else {
        const playPromise = this._audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('自动播放被阻止:', err);
            this.autoplayBlocked = true;
          });
        }
      }
    }
  }

  _prev() {
    if (this.songs.length === 0) return;

    if (this.shuffle) {
      if (this.shuffleIndex > 0) {
        this.shuffleIndex--;
        const songId = this.shuffleHistory[this.shuffleIndex];
        this._playSongById(songId);
      }
      return;
    }

    let newIndex = this.currentSongIndex - 1;
    if (newIndex < 0) {
      if (this.loopMode === 'none') {
        return;
      }
      newIndex = this.songs.length - 1;
    }
    this.playIndex(newIndex);
  }

  _next() {
    if (this.songs.length === 0) return;

    if (this.shuffle) {
      this._playNextShuffle();
      return;
    }

    let newIndex = this.currentSongIndex + 1;
    if (newIndex >= this.songs.length) {
      if (this.loopMode === 'none') {
        this.userStopped = true;
        this._audio.pause();
        return;
      }
      if (this.loopMode === 'one') {
        this._audio.currentTime = 0;
        this._audio.play();
        return;
      }
      newIndex = 0;
    }
    this.playIndex(newIndex);
  }

  _playNextShuffle() {
    if (this.shuffleIndex < this.shuffleHistory.length - 1) {
      this.shuffleIndex++;
      const songId = this.shuffleHistory[this.shuffleIndex];
      this._playSongById(songId);
      return;
    }

    const unplayed = this.songs.filter(s => !this.shuffleHistory.includes(s.id));
    if (unplayed.length === 0) {
      if (this.loopMode === 'none') {
        this.userStopped = true;
        this._audio.pause();
        return;
      }
      this.shuffleHistory = [];
      this.shuffleIndex = -1;
      this._playNextShuffle();
      return;
    }

    const randomIndex = Math.floor(Math.random() * unplayed.length);
    const song = unplayed[randomIndex];
    this.shuffleHistory.push(song.id);
    this.shuffleIndex = this.shuffleHistory.length - 1;
    this._playSongById(song.id);
  }

  _onSongEnded() {
    if (this.loopMode === 'one') {
      this._audio.currentTime = 0;
      this._audio.play();
      return;
    }
    this._next();
  }

  playIndex(index) {
    if (index < 0 || index >= this.songs.length) return;
    const song = this.songs[index];
    this.currentSongIndex = index;
    this.currentSong = song;
    this._audio.src = song.url;
    this._audio.play().catch(err => {
      console.warn('播放失败:', err);
      this.autoplayBlocked = true;
    });
    this._loadLyricsForSong(song.id);

    if (this.shuffle) {
      if (!this.shuffleHistory.includes(song.id)) {
        this.shuffleHistory.push(song.id);
        this.shuffleIndex = this.shuffleHistory.length - 1;
      }
    }

    setLastSong(song.id, 0);
  }

  _playSongById(songId) {
    const index = this.songs.findIndex(s => s.id === songId);
    if (index >= 0) {
      this.playIndex(index);
    }
  }

  _onSeek(e) {
    const { time } = e.detail;
    this._debouncedSetCurrentTime(time);
  }

  _onLyricSeek(e) {
    const { time } = e.detail;
    this._audio.currentTime = time;
  }

  _toggleMute() {
    this.muted = !this.muted;
    this._audio.muted = this.muted;
    setMuted(this.muted);
  }

  _onVolumeChange(e) {
    const { volume } = e.detail;
    if (this.muted && volume > 0) {
      this.muted = false;
      this._audio.muted = false;
    }
    this._audio.volume = volume;
  }

  _onVolumeChangeEnd(e) {
    const { volume } = e.detail;
    this.volume = volume;
    if (volume > 0) {
      this.muted = false;
    }
    setVolume(volume);
    setMuted(this.muted);
  }

  _onLoopChange(e) {
    this.loopMode = e.detail.mode;
    setLoopMode(this.loopMode);
  }

  _onShuffleChange(e) {
    this.shuffle = e.detail.shuffle;
    setShuffle(this.shuffle);
    if (this.shuffle) {
      this.shuffleHistory = this.currentSong ? [this.currentSong.id] : [];
      this.shuffleIndex = this.currentSong ? 0 : -1;
    } else {
      this.shuffleHistory = [];
      this.shuffleIndex = -1;
    }
  }

  _onSongsAdded(e) {
    const { songs } = e.detail;
    this.songs = [...this.songs, ...songs];
    this._saveCurrentPlaylist();
    songs.forEach(s => storage.addSong(s));
  }

  _onPlaySong(e) {
    const { index } = e.detail;
    this.playIndex(index);
  }

  _onRemoveSongs(e) {
    const { indexes } = e.detail;
    const sortedIndexes = [...indexes].sort((a, b) => b - a);
    
    for (const idx of sortedIndexes) {
      if (idx === this.currentSongIndex) {
        this._audio.pause();
        this.currentSong = null;
        this.currentSongIndex = -1;
        this.duration = 0;
        this.currentTime = 0;
      } else if (idx < this.currentSongIndex) {
        this.currentSongIndex--;
      }
      const song = this.songs[idx];
      if (song?.url) {
        URL.revokeObjectURL(song.url);
      }
      if (song?.id) {
        storage.deleteSong(song.id);
      }
    }

    this.songs = this.songs.filter((_, i) => !indexes.includes(i));
    this._saveCurrentPlaylist();
  }

  _onReorder(e) {
    const { fromIndex, toIndex } = e.detail;
    const newSongs = [...this.songs];
    const [moved] = newSongs.splice(fromIndex, 1);
    newSongs.splice(toIndex, 0, moved);
    this.songs = newSongs;

    if (this.currentSongIndex === fromIndex) {
      this.currentSongIndex = toIndex;
    } else if (fromIndex < this.currentSongIndex && toIndex >= this.currentSongIndex) {
      this.currentSongIndex--;
    } else if (fromIndex > this.currentSongIndex && toIndex <= this.currentSongIndex) {
      this.currentSongIndex++;
    }

    this._saveCurrentPlaylist();
  }

  _onPlaylistChange(e) {
    this.currentPlaylistId = e.detail.playlistId;
    setCurrentPlaylistId(this.currentPlaylistId);
    this._loadSongs();
    this.currentSong = null;
    this.currentSongIndex = -1;
    this._audio.pause();
    this._audio.src = '';
  }

  async _onNewPlaylist(e) {
    const { name } = e.detail;
    const newPlaylist = {
      id: generateId(),
      name,
      songIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storage.savePlaylist(newPlaylist);
    this.playlists = [...this.playlists, newPlaylist];
    this.currentPlaylistId = newPlaylist.id;
    setCurrentPlaylistId(newPlaylist.id);
    this.songs = [];
  }

  async _saveCurrentPlaylist() {
    const playlist = this.playlists.find(p => p.id === this.currentPlaylistId);
    if (playlist) {
      playlist.songIds = this.songs.map(s => s.id);
      playlist.updatedAt = Date.now();
      await storage.savePlaylist(playlist);
    }
  }

  _onShowMetadata(e) {
    const { index } = e.detail;
    this.metadataSong = this.songs[index];
    this.showMetadata = true;
  }

  _closeMetadata() {
    this.showMetadata = false;
    this.metadataSong = null;
  }

  _onAddNext(e) {
    const { indexes } = e.detail;
    const songsToAdd = indexes.map(i => this.songs[i]).filter(Boolean);
    console.log('下一首播放:', songsToAdd);
  }

  _loadLyricsForSong(songId) {
    const cached = getLyricsCache(songId);
    if (cached) {
      this.lyrics = cached.lyrics || [];
      return;
    }
    this.lyrics = [];
  }

  _onLyricsLoaded(e) {
    const { songId, text } = e.detail;
    const parsed = parseLRC(text);
    this.lyrics = parsed.lyrics;
    if (songId) {
      setLyricsCache(songId, { lyrics: parsed.lyrics, metadata: parsed.metadata });
    }
  }

  _toggleLyrics() {
    this.showLyrics = !this.showLyrics;
  }

  _cycleTheme() {
    const themes = ['light', 'dark', 'system'];
    const currentTheme = this._getCurrentTheme();
    const currentIdx = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIdx + 1) % themes.length];
    this._applyTheme(nextTheme);
  }

  _getCurrentTheme() {
    const root = document.documentElement;
    if (root.classList.contains('theme-light')) return 'light';
    if (root.classList.contains('theme-dark')) return 'dark';
    return 'system';
  }

  _applyTheme(theme) {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-system');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('lit-music-theme', theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) {
        root.classList.add('theme-dark');
      } else {
        root.classList.add('theme-light');
      }
    }
  }

  _dismissAutoplayWarning() {
    this.autoplayBlocked = false;
  }
}

customElements.define('music-player', MusicPlayer);
