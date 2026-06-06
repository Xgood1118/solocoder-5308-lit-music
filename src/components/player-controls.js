import { LitElement, html, css } from 'lit';

class PlayerControls extends LitElement {
  static properties = {
    isPlaying: { type: Boolean },
    volume: { type: Number },
    muted: { type: Boolean },
    loopMode: { type: String },
    shuffle: { type: Boolean },
    hasPrev: { type: Boolean },
    hasNext: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      padding: 16px 24px;
      background: var(--controls-bg, #f8f9fa);
      border-radius: 12px;
    }

    .container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .left-controls, .right-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 180px;
    }

    .right-controls {
      justify-content: flex-end;
    }

    .center-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      color: var(--text-color, #333);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s, transform 0.1s;
    }

    .btn:hover {
      background: var(--hover-bg, rgba(0, 0, 0, 0.1));
    }

    .btn:active {
      transform: scale(0.95);
    }

    .btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .btn svg {
      width: 20px;
      height: 20px;
    }

    .btn-play {
      width: 48px;
      height: 48px;
      background: var(--primary-color, #667eea);
      color: #fff;
    }

    .btn-play:hover {
      background: var(--primary-hover, #5568d3);
    }

    .btn-play svg {
      width: 24px;
      height: 24px;
    }

    .btn.active {
      color: var(--primary-color, #667eea);
    }

    .volume-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .volume-slider {
      width: 80px;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: var(--slider-bg, #ddd);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }

    .volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      background: var(--primary-color, #667eea);
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.1s;
    }

    .volume-slider::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }

    .volume-slider::-moz-range-thumb {
      width: 14px;
      height: 14px;
      background: var(--primary-color, #667eea);
      border-radius: 50%;
      cursor: pointer;
      border: none;
    }

    .loop-indicator {
      position: relative;
    }

    .loop-one-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      font-size: 8px;
      font-weight: bold;
      line-height: 1;
    }

    @media (max-width: 600px) {
      .left-controls, .right-controls {
        min-width: auto;
      }

      .volume-slider {
        display: none;
      }
    }
  `;

  constructor() {
    super();
    this.isPlaying = false;
    this.volume = 0.7;
    this.muted = false;
    this.loopMode = 'list';
    this.shuffle = false;
    this.hasPrev = false;
    this.hasNext = false;
  }

  render() {
    return html`
      <div class="container">
        <div class="left-controls">
          <button 
            class="btn ${this.shuffle ? 'active' : ''}"
            @click="${this._toggleShuffle}"
            title="随机播放">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
          <button 
            class="btn loop-indicator ${this.loopMode !== 'none' ? 'active' : ''}"
            @click="${this._toggleLoop}"
            title="循环模式">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
            </svg>
            ${this.loopMode === 'one' ? html`<span class="loop-one-dot">1</span>` : ''}
          </button>
        </div>

        <div class="center-controls">
          <button 
            class="btn" 
            @click="${this._prev}"
            ?disabled="${!this.hasPrev}"
            title="上一首">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button 
            class="btn btn-play" 
            @click="${this._togglePlay}"
            title="${this.isPlaying ? '暂停' : '播放'}">
            ${this.isPlaying
              ? html`
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                `
              : html`
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                `
            }
          </button>
          <button 
            class="btn" 
            @click="${this._next}"
            ?disabled="${!this.hasNext}"
            title="下一首">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>

        <div class="right-controls">
          <div class="volume-container">
            <button 
              class="btn" 
              @click="${this._toggleMute}"
              title="${this.muted ? '取消静音' : '静音'}">
              ${this.muted || this.volume === 0
                ? html`
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  `
                : this.volume < 0.5
                  ? html`
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                      </svg>
                    `
                  : html`
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    `
              }
            </button>
            <input 
              type="range" 
              class="volume-slider"
              min="0" 
              max="100" 
              .value="${(this.muted ? 0 : this.volume) * 100}"
              @input="${this._onVolumeChange}"
              @change="${this._onVolumeChangeEnd}"
            />
          </div>
        </div>
      </div>
    `;
  }

  _togglePlay() {
    this.dispatchEvent(new CustomEvent('play-pause'));
  }

  _prev() {
    this.dispatchEvent(new CustomEvent('prev'));
  }

  _next() {
    this.dispatchEvent(new CustomEvent('next'));
  }

  _toggleMute() {
    this.dispatchEvent(new CustomEvent('toggle-mute'));
  }

  _toggleLoop() {
    const modes = ['list', 'one', 'none'];
    const currentIdx = modes.indexOf(this.loopMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    this.dispatchEvent(new CustomEvent('loop-change', { detail: { mode: nextMode } }));
  }

  _toggleShuffle() {
    this.dispatchEvent(new CustomEvent('shuffle-change', { detail: { shuffle: !this.shuffle } }));
  }

  _onVolumeChange(e) {
    const value = e.target.value / 100;
    this.dispatchEvent(new CustomEvent('volume-change', { detail: { volume: value } }));
  }

  _onVolumeChangeEnd(e) {
    const value = e.target.value / 100;
    this.dispatchEvent(new CustomEvent('volume-change-end', { detail: { volume: value } }));
  }
}

customElements.define('player-controls', PlayerControls);
