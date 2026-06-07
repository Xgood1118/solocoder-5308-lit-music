import { LitElement, html, css } from 'lit';

class MonthlyReport extends LitElement {
  static properties = {
    visible: { type: Boolean },
    report: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .modal {
      background: var(--modal-bg, #fff);
      border-radius: 16px;
      width: 90%;
      max-width: 520px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border-radius: 16px 16px 0 0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
    }

    .header-subtitle {
      font-size: 12px;
      opacity: 0.8;
      margin-top: 2px;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 24px;
      color: rgba(255, 255, 255, 0.8);
      padding: 0;
      line-height: 1;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s, color 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }

    .modal-body {
      padding: 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--hover-bg, rgba(0, 0, 0, 0.04));
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary-color, #667eea);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-secondary, #888);
      margin-top: 4px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color, #333);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title svg {
      width: 18px;
      height: 18px;
      color: var(--primary-color, #667eea);
    }

    .artist-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .artist-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .artist-rank {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--hover-bg, rgba(0, 0, 0, 0.06));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary, #888);
      flex-shrink: 0;
    }

    .artist-rank.top-1 {
      background: linear-gradient(135deg, #ffd700, #ffb347);
      color: #fff;
    }

    .artist-rank.top-2 {
      background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
      color: #fff;
    }

    .artist-rank.top-3 {
      background: linear-gradient(135deg, #cd7f32, #b8860b);
      color: #fff;
    }

    .artist-info {
      flex: 1;
    }

    .artist-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color, #333);
    }

    .artist-plays {
      font-size: 12px;
      color: var(--text-secondary, #888);
    }

    .artist-bar {
      height: 4px;
      background: var(--hover-bg, rgba(0, 0, 0, 0.06));
      border-radius: 2px;
      margin-top: 6px;
      overflow: hidden;
    }

    .artist-bar-fill {
      height: 100%;
      background: var(--primary-color, #667eea);
      border-radius: 2px;
      transition: width 0.5s ease-out;
    }

    .hourly-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 100px;
      gap: 2px;
      padding: 0 4px;
    }

    .hour-bar {
      flex: 1;
      background: var(--primary-color, #667eea);
      border-radius: 3px 3px 0 0;
      opacity: 0.6;
      transition: opacity 0.2s, height 0.3s;
      min-height: 2px;
      position: relative;
    }

    .hour-bar:hover {
      opacity: 1;
    }

    .hour-bar.peak {
      background: linear-gradient(to top, #667eea, #764ba2);
      opacity: 1;
    }

    .hour-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      padding: 0 4px;
    }

    .hour-label {
      font-size: 10px;
      color: var(--text-secondary, #888);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary, #888);
    }

    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 4px 0;
      font-size: 14px;
    }
  `;

  constructor() {
    super();
    this.visible = false;
    this.report = null;
  }

  render() {
    if (!this.visible) return '';

    const hasData = this.report && this.report.totalPlays > 0;

    return html`
      <div class="modal-overlay" @click="${this._onOverlayClick}">
        <div class="modal" @click="${e => e.stopPropagation()}">
          <div class="modal-header">
            <div>
              <h3>🎵 本月听歌报告</h3>
              <div class="header-subtitle">${this.report ? `${this.report.year}年${this.report.month + 1}月` : ''}</div>
            </div>
            <button class="close-btn" @click="${this._close}">&times;</button>
          </div>
          <div class="modal-body">
            ${hasData ? this._renderReport() : this._renderEmpty()}
          </div>
        </div>
      </div>
    `;
  }

  _renderEmpty() {
    return html`
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        <p>本月还没有听歌记录</p>
        <p style="font-size: 12px;">开始听歌后再来看看吧~</p>
      </div>
    `;
  }

  _renderReport() {
    const { totalPlays, totalDuration, topArtists, hourlyDistribution, newSongsCount, uniqueSongs } = this.report;
    const maxPlays = topArtists.length > 0 ? topArtists[0].count : 1;
    const maxHourly = Math.max(...hourlyDistribution, 1);
    const peakHour = hourlyDistribution.indexOf(maxHourly);

    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);

    return html`
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalPlays}</div>
          <div class="stat-label">播放次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${hours > 0 ? hours + 'h' : ''}${minutes}m</div>
          <div class="stat-label">听歌时长</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${uniqueSongs}</div>
          <div class="stat-label">听过的歌</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${newSongsCount}</div>
          <div class="stat-label">新发现</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          最爱歌手 Top 5
        </div>
        <div class="artist-list">
          ${topArtists.length > 0
            ? topArtists.map((artist, index) => html`
                <div class="artist-item">
                  <div class="artist-rank top-${index + 1}">${index + 1}</div>
                  <div class="artist-info">
                    <div class="artist-name">${artist.name || '未知艺术家'}</div>
                    <div class="artist-bar">
                      <div class="artist-bar-fill" style="width: ${(artist.count / maxPlays) * 100}%"></div>
                    </div>
                  </div>
                  <div class="artist-plays">${artist.count} 次</div>
                </div>
              `)
            : html`<p style="color: var(--text-secondary); font-size: 13px;">暂无数据</p>`
          }
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          听歌时间分布
        </div>
        <div class="hourly-chart">
          ${hourlyDistribution.map((count, hour) => html`
            <div 
              class="hour-bar ${hour === peakHour ? 'peak' : ''}"
              style="height: ${Math.max((count / maxHourly) * 100, 2)}%"
              title="${hour}:00 - ${count} 次"
            ></div>
          `)}
        </div>
        <div class="hour-labels">
          <span class="hour-label">0时</span>
          <span class="hour-label">6时</span>
          <span class="hour-label">12时</span>
          <span class="hour-label">18时</span>
          <span class="hour-label">23时</span>
        </div>
      </div>
    `;
  }

  _onOverlayClick() {
    this._close();
  }

  _close() {
    this.visible = false;
    this.dispatchEvent(new CustomEvent('close'));
  }
}

customElements.define('monthly-report', MonthlyReport);
