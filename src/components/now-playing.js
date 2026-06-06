import { LitElement, html, css } from 'lit';
import { formatTime } from '../utils/utils.js';

class NowPlaying extends LitElement {
  static properties = {
    song: { type: Object },
    currentTime: { type: Number },
    duration: { type: Number },
    isPlaying: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      padding: 24px;
      background: var(--now-playing-bg, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
      color: #fff;
      border-radius: 12px;
    }

    .container {
      display: flex;
      gap: 24px;
      align-items: center;
    }

    .cover {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover svg {
      width: 48px;
      height: 48px;
      opacity: 0.6;
    }

    .info {
      flex: 1;
      min-width: 0;
    }

    .title {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .artist {
      font-size: 16px;
      opacity: 0.9;
      margin: 0 0 4px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .album {
      font-size: 14px;
      opacity: 0.7;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .progress-container {
      margin-top: 20px;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #fff;
      border-radius: 3px;
      transition: width 0.1s linear;
      position: relative;
    }

    .progress-fill::after {
      content: '';
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      background: #fff;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .progress-bar:hover .progress-fill::after {
      opacity: 1;
    }

    .time-info {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      opacity: 0.8;
      font-variant-numeric: tabular-nums;
    }

    @media (max-width: 600px) {
      .container {
        flex-direction: column;
        text-align: center;
      }

      .cover {
        width: 96px;
        height: 96px;
      }

      .title {
        font-size: 20px;
      }
    }
  `;

  constructor() {
    super();
    this.song = null;
    this.currentTime = 0;
    this.duration = 0;
    this.isPlaying = false;
    this._isDragging = false;
  }

  render() {
    const progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;

    return html`
      <div class="container">
        <div class="cover">
          ${this.song?.cover
            ? html`<img src="${this.song.cover}" alt="Album cover" />`
            : html`
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              `
          }
        </div>
        <div class="info">
          <h2 class="title">${this.song?.title || '未选择歌曲'}</h2>
          <p class="artist">${this.song?.artist || '—'}</p>
          <p class="album">${this.song?.album || ''}</p>
          <div class="progress-container">
            <div class="progress-bar" 
                 @click="${this._onProgressClick}"
                 @mousedown="${this._onProgressMouseDown}">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="time-info">
              <span>${formatTime(this.currentTime)}</span>
              <span>${formatTime(this.duration)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _onProgressClick(e) {
    if (!this.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this._dispatchSeek(percent);
  }

  _onProgressMouseDown(e) {
    this._isDragging = true;
    const bar = e.currentTarget;
    const onMouseMove = (ev) => {
      if (!this._isDragging) return;
      const rect = bar.getBoundingClientRect();
      let percent = (ev.clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      this._dispatchSeek(percent);
    };
    const onMouseUp = () => {
      this._isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  _dispatchSeek(percent) {
    const time = percent * this.duration;
    this.dispatchEvent(new CustomEvent('seek', {
      detail: { time, percent }
    }));
  }
}

customElements.define('now-playing', NowPlaying);
