import { LitElement, html, css } from 'lit';
import { formatTime, isSupportedFormat, generateId } from '../utils/utils.js';
import { parseID3v2, parseFilename } from '../utils/id3-parser.js';

class PlaylistComponent extends LitElement {
  static properties = {
    songs: { type: Array },
    currentSongId: { type: String },
    playlists: { type: Array },
    currentPlaylistId: { type: String },
    isCollapsed: { type: Boolean },
    selectedIndexes: { type: Array }
  };

  static styles = css`
    :host {
      display: block;
      background: var(--playlist-bg, #fff);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--playlist-header-bg, #f1f3f5);
      border-bottom: 1px solid var(--border-color, #e9ecef);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header h3 {
      margin: 0;
      font-size: 16px;
      color: var(--text-color, #333);
    }

    .playlist-select {
      padding: 4px 8px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      background: var(--input-bg, #fff);
      color: var(--text-color, #333);
      font-size: 13px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--text-color, #333);
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background 0.2s;
    }

    .btn:hover {
      background: var(--hover-bg, rgba(0, 0, 0, 0.08));
    }

    .btn-primary {
      background: var(--primary-color, #667eea);
      color: #fff;
    }

    .btn-primary:hover {
      background: var(--primary-hover, #5568d3);
    }

    .btn-icon {
      padding: 6px;
    }

    .btn-icon svg {
      width: 18px;
      height: 18px;
    }

    .drop-zone {
      min-height: 300px;
      max-height: 400px;
      overflow-y: auto;
      border: 2px dashed transparent;
      transition: border-color 0.2s, background 0.2s;
    }

    .drop-zone.drag-over {
      border-color: var(--primary-color, #667eea);
      background: rgba(102, 126, 234, 0.05);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: var(--text-secondary, #888);
      text-align: center;
    }

    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .song-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .song-item {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color, #f1f3f5);
      transition: background 0.15s;
      gap: 12px;
    }

    .song-item:hover {
      background: var(--hover-bg, rgba(0, 0, 0, 0.04));
    }

    .song-item.selected {
      background: var(--selected-bg, rgba(102, 126, 234, 0.12));
    }

    .song-item.playing {
      background: var(--playing-bg, rgba(102, 126, 234, 0.2));
    }

    .song-item.dragging {
      opacity: 0.5;
    }

    .song-item.drag-over-bottom {
      border-bottom: 2px solid var(--primary-color, #667eea);
    }

    .song-index {
      width: 24px;
      text-align: right;
      color: var(--text-secondary, #888);
      font-size: 13px;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    .song-playing-indicator {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .song-playing-indicator svg {
      width: 16px;
      height: 16px;
      color: var(--primary-color, #667eea);
    }

    .song-info {
      flex: 1;
      min-width: 0;
    }

    .song-title {
      font-size: 14px;
      color: var(--text-color, #333);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .song-artist {
      font-size: 12px;
      color: var(--text-secondary, #888);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .song-duration {
      font-size: 13px;
      color: var(--text-secondary, #888);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    .song-item.unavailable .song-title,
    .song-item.unavailable .song-artist {
      color: var(--text-disabled, #bbb);
      text-decoration: line-through;
    }

    .context-menu {
      position: fixed;
      background: var(--context-menu-bg, #fff);
      border: 1px solid var(--border-color, #ddd);
      border-radius: 8px;
      padding: 4px 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      min-width: 160px;
    }

    .context-menu-item {
      padding: 8px 16px;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-color, #333);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .context-menu-item:hover {
      background: var(--hover-bg, rgba(0, 0, 0, 0.06));
    }

    .context-menu-item.danger {
      color: var(--danger-color, #e74c3c);
    }

    .collapsed .drop-zone {
      display: none;
    }

    .song-count {
      font-size: 12px;
      color: var(--text-secondary, #888);
    }

    input[type="file"] {
      display: none;
    }
  `;

  constructor() {
    super();
    this.songs = [];
    this.currentSongId = null;
    this.playlists = [];
    this.currentPlaylistId = 'default';
    this.isCollapsed = false;
    this.selectedIndexes = [];
    this._lastSelectedIndex = -1;
    this._dragIndex = -1;
    this._contextMenuIndex = -1;
    this._contextMenuVisible = false;
    this._contextMenuX = 0;
    this._contextMenuY = 0;
  }

  render() {
    return html`
      <div class="playlist-container ${this.isCollapsed ? 'collapsed' : ''}">
        <div class="header">
          <div class="header-left">
            <button class="btn btn-icon" @click="${this._toggleCollapse}" title="${this.isCollapsed ? '展开' : '折叠'}">
              <svg viewBox="0 0 24 24" fill="currentColor" style="transform: ${this.isCollapsed ? 'rotate(-90deg)' : 'rotate(0)'}; transition: transform 0.2s;">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </button>
            <h3>播放列表</h3>
            <select class="playlist-select" @change="${this._onPlaylistChange}" .value="${this.currentPlaylistId}">
              ${this.playlists.map(p => html`
                <option value="${p.id}">${p.name}</option>
              `)}
            </select>
            <span class="song-count">${this.songs.length} 首</span>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" @click="${this._onAddFilesClick}">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              添加文件
            </button>
            <input type="file" id="fileInput" multiple accept="audio/*" @change="${this._onFileSelect}" />
            <button class="btn btn-icon" @click="${this._newPlaylist}" title="新建歌单">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div 
          class="drop-zone"
          @dragover="${this._onDragOver}"
          @dragleave="${this._onDragLeave}"
          @drop="${this._onDrop}"
        >
          ${this.songs.length === 0
            ? html`
                <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <p>拖拽音频文件到这里</p>
                  <p style="font-size: 12px;">或点击"添加文件"按钮选择</p>
                  <p style="font-size: 11px; margin-top: 8px;">支持 MP3、WAV、OGG、FLAC、M4A</p>
                </div>
              `
            : html`
                <ul class="song-list">
                  ${this.songs.map((song, index) => html`
                    <li 
                      class="song-item 
                        ${song.id === this.currentSongId ? 'playing' : ''}
                        ${this.selectedIndexes.includes(index) ? 'selected' : ''}
                        ${song.unavailable ? 'unavailable' : ''}
                        ${this._dragIndex === index ? 'dragging' : ''}"
                      draggable="true"
                      @click="${(e) => this._onSongClick(e, index)}"
                      @dblclick="${() => this._playSong(index)}"
                      @contextmenu="${(e) => this._onContextMenu(e, index)}"
                      @dragstart="${(e) => this._onDragStart(e, index)}"
                      @dragover="${(e) => this._onItemDragOver(e, index)}"
                      @dragleave="${(e) => this._onItemDragLeave(e, index)}"
                      @drop="${(e) => this._onItemDrop(e, index)}"
                      @dragend="${this._onDragEnd}"
                      data-index="${index}"
                    >
                      ${song.id === this.currentSongId
                        ? html`
                            <div class="song-playing-indicator">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                              </svg>
                            </div>
                          `
                        : html`<span class="song-index">${index + 1}</span>`
                      }
                      <div class="song-info">
                        <div class="song-title">${song.title || '未知歌曲'}</div>
                        <div class="song-artist">${song.artist || '未知艺术家'}</div>
                      </div>
                      <span class="song-duration">${formatTime(song.duration)}</span>
                    </li>
                  `)}
                </ul>
              `
          }
        </div>

        ${this._contextMenuVisible ? html`
          <div 
            class="context-menu"
            style="left: ${this._contextMenuX}px; top: ${this._contextMenuY}px;"
            @click="${this._onContextMenuAction}"
          >
            <div class="context-menu-item" data-action="play">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;"><path d="M8 5v14l11-7z"/></svg>
              播放
            </div>
            <div class="context-menu-item" data-action="add-next">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              下一首播放
            </div>
            <div class="context-menu-item" data-action="metadata">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
              查看元数据
            </div>
            <div class="context-menu-item" data-action="show-in-folder">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
              在文件管理器中显示
            </div>
            <div class="context-menu-item danger" data-action="remove">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              从列表移除
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  _toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  _onAddFilesClick() {
    this.shadowRoot.getElementById('fileInput').click();
  }

  _onFileSelect(e) {
    const files = Array.from(e.target.files);
    this._processFiles(files);
    e.target.value = '';
  }

  _onDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  _onDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  }

  _onDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    this._processFiles(files);
  }

  async _processFiles(files) {
    const validFiles = files.filter(f => isSupportedFormat(f.name));
    const invalidFiles = files.filter(f => !isSupportedFormat(f.name));

    if (invalidFiles.length > 0) {
      const names = invalidFiles.map(f => f.name).join('、');
      alert(`以下文件格式不支持，已跳过：\n${names}\n\n支持格式：MP3、WAV、OGG、FLAC、M4A`);
    }

    if (validFiles.length === 0) return;

    const newSongs = [];
    for (const file of validFiles) {
      try {
        const id = generateId();
        const parsed = parseFilename(file.name);
        let metadata = { title: parsed.title, artist: '', album: '', cover: null };
        
        try {
          const id3data = await parseID3v2(file);
          metadata = {
            title: id3data.title || parsed.title,
            artist: id3data.artist || '',
            album: id3data.album || '',
            cover: id3data.cover || null
          };
        } catch (e) {
          console.warn('ID3解析失败，使用文件名:', file.name);
        }

        const song = {
          id,
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          cover: metadata.cover,
          duration: null,
          file,
          url: URL.createObjectURL(file),
          filename: file.name,
          track: parsed.track,
          size: file.size,
          unavailable: false,
          addedAt: Date.now()
        };

        const tempAudio = new Audio();
        tempAudio.src = song.url;
        await new Promise((resolve) => {
          tempAudio.addEventListener('loadedmetadata', () => {
            song.duration = tempAudio.duration;
            resolve();
          });
          tempAudio.addEventListener('error', () => {
            song.duration = 0;
            song.unavailable = true;
            resolve();
          });
          setTimeout(resolve, 5000);
        });

        newSongs.push(song);
      } catch (e) {
        console.error('处理文件失败:', file.name, e);
      }
    }

    if (newSongs.length > 0) {
      newSongs.sort((a, b) => {
        if (a.track && b.track) return a.track - b.track;
        return a.title.localeCompare(b.title);
      });

      this.dispatchEvent(new CustomEvent('songs-added', {
        detail: { songs: newSongs }
      }));
    }
  }

  _onSongClick(e, index) {
    if (e.shiftKey && this._lastSelectedIndex >= 0) {
      const start = Math.min(this._lastSelectedIndex, index);
      const end = Math.max(this._lastSelectedIndex, index);
      const range = [];
      for (let i = start; i <= end; i++) range.push(i);
      this.selectedIndexes = range;
    } else if (e.ctrlKey || e.metaKey) {
      if (this.selectedIndexes.includes(index)) {
        this.selectedIndexes = this.selectedIndexes.filter(i => i !== index);
      } else {
        this.selectedIndexes = [...this.selectedIndexes, index];
      }
      this._lastSelectedIndex = index;
    } else {
      this.selectedIndexes = [index];
      this._lastSelectedIndex = index;
    }
  }

  _playSong(index) {
    this.dispatchEvent(new CustomEvent('play-song', {
      detail: { index, song: this.songs[index] }
    }));
  }

  _onContextMenu(e, index) {
    e.preventDefault();
    if (!this.selectedIndexes.includes(index)) {
      this.selectedIndexes = [index];
      this._lastSelectedIndex = index;
    }
    this._contextMenuIndex = index;
    this._contextMenuVisible = true;
    this._contextMenuX = e.clientX;
    this._contextMenuY = e.clientY;
    setTimeout(() => {
      document.addEventListener('click', this._closeContextMenu, { once: true });
    }, 0);
  }

  _closeContextMenu = () => {
    this._contextMenuVisible = false;
    this._contextMenuIndex = -1;
  };

  _onContextMenuAction(e) {
    const action = e.target.closest('.context-menu-item')?.dataset.action;
    if (!action) return;

    const indexes = this.selectedIndexes.length > 0 ? this.selectedIndexes : [this._contextMenuIndex];

    switch (action) {
      case 'play':
        this._playSong(this._contextMenuIndex);
        break;
      case 'add-next':
        this.dispatchEvent(new CustomEvent('add-next', { detail: { indexes } }));
        break;
      case 'remove':
        this.dispatchEvent(new CustomEvent('remove-songs', { detail: { indexes } }));
        this.selectedIndexes = [];
        break;
      case 'metadata':
        this.dispatchEvent(new CustomEvent('show-metadata', { detail: { index: this._contextMenuIndex } }));
        break;
      case 'show-in-folder':
        alert('浏览器环境无法直接打开文件管理器。\n文件名: ' + this.songs[this._contextMenuIndex]?.filename);
        break;
    }

    this._closeContextMenu();
  }

  _onDragStart(e, index) {
    this._dragIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  }

  _onItemDragOver(e, index) {
    e.preventDefault();
    e.stopPropagation();
    const item = e.currentTarget;
    item.classList.add('drag-over-bottom');
  }

  _onItemDragLeave(e, index) {
    e.currentTarget.classList.remove('drag-over-bottom');
  }

  _onItemDrop(e, index) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over-bottom');

    const fromIndex = this._dragIndex;
    const toIndex = index;

    if (fromIndex === toIndex || fromIndex < 0) return;

    this.dispatchEvent(new CustomEvent('reorder', {
      detail: { fromIndex, toIndex }
    }));
  }

  _onDragEnd() {
    this._dragIndex = -1;
    const items = this.shadowRoot.querySelectorAll('.song-item');
    items.forEach(item => item.classList.remove('drag-over-bottom'));
  }

  _onPlaylistChange(e) {
    this.dispatchEvent(new CustomEvent('playlist-change', {
      detail: { playlistId: e.target.value }
    }));
  }

  _newPlaylist() {
    const name = prompt('输入歌单名称：');
    if (name && name.trim()) {
      this.dispatchEvent(new CustomEvent('new-playlist', {
        detail: { name: name.trim() }
      }));
    }
  }
}

customElements.define('playlist-component', PlaylistComponent);
