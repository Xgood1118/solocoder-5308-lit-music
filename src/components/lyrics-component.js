import { LitElement, html, css } from 'lit';
import { findLyricIndex } from '../utils/lrc-parser.js';

class LyricsComponent extends LitElement {
  static properties = {
    lyrics: { type: Array },
    currentTime: { type: Number },
    visible: { type: Boolean },
    songId: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      background: var(--lyrics-bg, #fff);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--lyrics-header-bg, #f1f3f5);
      border-bottom: 1px solid var(--border-color, #e9ecef);
    }

    .header h3 {
      margin: 0;
      font-size: 16px;
      color: var(--text-color, #333);
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

    .lyrics-container {
      height: 300px;
      overflow-y: auto;
      padding: 80px 24px;
      scroll-behavior: smooth;
      position: relative;
      mask-image: linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent);
      -webkit-mask-image: linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent);
    }

    .lyrics-list {
      transition: transform 0.3s ease-out;
    }

    .lyric-line {
      padding: 8px 0;
      text-align: center;
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-secondary, #999);
      cursor: pointer;
      transition: color 0.2s, font-size 0.2s, opacity 0.2s;
      opacity: 0.6;
    }

    .lyric-line:hover {
      color: var(--text-color, #333);
      opacity: 0.8;
    }

    .lyric-line.active {
      color: var(--primary-color, #667eea);
      font-size: 18px;
      font-weight: 600;
      opacity: 1;
    }

    .lyric-line.near {
      opacity: 0.8;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: var(--text-secondary, #888);
      text-align: center;
    }

    .empty-state svg {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .drop-hint {
      font-size: 13px;
      color: var(--text-secondary, #aaa);
      margin-top: 8px;
    }

    .drag-over {
      background: rgba(102, 126, 234, 0.05);
    }

    input[type="file"] {
      display: none;
    }

    .lyrics-container::-webkit-scrollbar {
      width: 6px;
    }

    .lyrics-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .lyrics-container::-webkit-scrollbar-thumb {
      background: var(--scrollbar-color, #ddd);
      border-radius: 3px;
    }
  `;

  constructor() {
    super();
    this.lyrics = [];
    this.currentTime = 0;
    this.visible = true;
    this.songId = null;
    this._currentIndex = -1;
    this._lineHeight = 38;
  }

  willUpdate(changedProps) {
    if (changedProps.has('currentTime') || changedProps.has('lyrics')) {
      this._currentIndex = findLyricIndex(this.lyrics, this.currentTime);
    }
  }

  updated(changedProps) {
    if (changedProps.has('_currentIndex') || changedProps.has('lyrics')) {
      this._scrollToActive();
    }
  }

  render() {
    return html`
      <div class="${this.visible ? '' : 'hidden'}" @dragover="${this._onDragOver}" @dragleave="${this._onDragLeave}" @drop="${this._onDrop}">
        <div class="header">
          <h3>歌词</h3>
          <div class="header-actions">
            <button class="btn" @click="${this._onLoadLrc}">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
              </svg>
              加载LRC
            </button>
            <input type="file" id="lrcInput" accept=".lrc,.txt" @change="${this._onLrcFileSelect}" />
          </div>
        </div>

        ${this.lyrics.length === 0
          ? html`
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
                <p>暂无歌词</p>
                <p class="drop-hint">拖拽 LRC 文件到这里加载歌词</p>
              </div>
            `
          : html`
              <div class="lyrics-container" ref="${el => this._container = el}">
                <div class="lyrics-list" style="transform: translateY(${this._getTranslateY()}px)">
                  ${this.lyrics.map((line, index) => html`
                    <div 
                      class="lyric-line ${this._getLineClass(index)}"
                      @click="${() => this._seekTo(line.time)}"
                      data-index="${index}"
                    >
                      ${line.text || '...'}
                    </div>
                  `)}
                </div>
              </div>
            `
        }
      </div>
    `;
  }

  _getLineClass(index) {
    if (index === this._currentIndex) return 'active';
    if (Math.abs(index - this._currentIndex) <= 2) return 'near';
    return '';
  }

  _getTranslateY() {
    if (this._currentIndex < 0) return 0;
    const container = this._container;
    if (!container) return 0;
    const containerHeight = container.clientHeight;
    const centerOffset = containerHeight / 2 - this._lineHeight / 2;
    return centerOffset - this._currentIndex * this._lineHeight;
  }

  _scrollToActive() {
    const container = this._container;
    if (!container || this._currentIndex < 0) return;
    requestAnimationFrame(() => {
      const lineEl = container.querySelector(`[data-index="${this._currentIndex}"]`);
      if (lineEl) {
        lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  _seekTo(time) {
    this.dispatchEvent(new CustomEvent('seek', {
      detail: { time: Math.max(0, time - 0.1) }
    }));
  }

  _onLoadLrc() {
    this.shadowRoot.getElementById('lrcInput').click();
  }

  _onLrcFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this._loadLrcFile(file);
    }
    e.target.value = '';
  }

  _onDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  _onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  _onDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    const lrcFile = files.find(f => f.name.toLowerCase().endsWith('.lrc') || f.name.toLowerCase().endsWith('.txt'));
    if (lrcFile) {
      this._loadLrcFile(lrcFile);
    }
  }

  _loadLrcFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      this.dispatchEvent(new CustomEvent('lyrics-loaded', {
        detail: {
          songId: this.songId,
          text,
          filename: file.name
        }
      }));
    };
    reader.readAsText(file);
  }
}

customElements.define('lyrics-component', LyricsComponent);
