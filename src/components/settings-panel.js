import { LitElement, html, css } from 'lit';
import { ROLES, FREE_QUOTA, getRole, setRole, getSubscribed, setSubscribed, getChildPin, setChildPin } from '../utils/storage.js';

class SettingsPanel extends LitElement {
  static properties = {
    visible: { type: Boolean },
    role: { type: String },
    subscribed: { type: Boolean },
    songCount: { type: Number },
    childPinInput: { type: String }
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
      max-width: 480px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color, #eee);
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      color: var(--text-color, #333);
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 24px;
      color: var(--text-secondary, #999);
      padding: 0;
      line-height: 1;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    }

    .close-btn:hover {
      background: var(--hover-bg, rgba(0, 0, 0, 0.06));
      color: var(--text-color, #333);
    }

    .modal-body {
      padding: 20px 24px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary, #888);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .role-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .role-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border: 2px solid var(--border-color, #eee);
      border-radius: 10px;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }

    .role-item:hover {
      border-color: var(--primary-color, #667eea);
    }

    .role-item.active {
      border-color: var(--primary-color, #667eea);
      background: var(--selected-bg, rgba(102, 126, 234, 0.08));
    }

    .role-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--hover-bg, rgba(0, 0, 0, 0.06));
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .role-item.active .role-icon {
      background: var(--primary-color, #667eea);
      color: #fff;
    }

    .role-icon svg {
      width: 22px;
      height: 22px;
    }

    .role-info {
      flex: 1;
    }

    .role-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color, #333);
      margin-bottom: 2px;
    }

    .role-desc {
      font-size: 12px;
      color: var(--text-secondary, #888);
    }

    .quota-info {
      padding: 16px;
      background: var(--hover-bg, rgba(0, 0, 0, 0.04));
      border-radius: 10px;
    }

    .quota-bar {
      height: 8px;
      background: var(--border-color, #eee);
      border-radius: 4px;
      overflow: hidden;
      margin: 8px 0;
    }

    .quota-fill {
      height: 100%;
      background: var(--primary-color, #667eea);
      border-radius: 4px;
      transition: width 0.3s;
    }

    .quota-fill.warning {
      background: #f39c12;
    }

    .quota-fill.danger {
      background: var(--danger-color, #e74c3c);
    }

    .quota-text {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--text-secondary, #888);
    }

    .quota-count {
      font-weight: 600;
      color: var(--text-color, #333);
    }

    .subscribe-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-radius: 10px;
    }

    .subscribe-info {
      flex: 1;
    }

    .subscribe-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color, #333);
    }

    .subscribe-desc {
      font-size: 12px;
      color: var(--text-secondary, #888);
      margin-top: 2px;
    }

    .switch {
      position: relative;
      width: 48px;
      height: 28px;
      cursor: pointer;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .switch-slider {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      border-radius: 28px;
      transition: 0.3s;
    }

    .switch-slider:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: 0.3s;
    }

    .switch input:checked + .switch-slider {
      background-color: var(--primary-color, #667eea);
    }

    .switch input:checked + .switch-slider:before {
      transform: translateX(20px);
    }

    .child-pin-section {
      margin-top: 12px;
    }

    .pin-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 8px;
      font-size: 14px;
      color: var(--text-color, #333);
      background: var(--input-bg, #fff);
      box-sizing: border-box;
    }

    .pin-input:focus {
      outline: none;
      border-color: var(--primary-color, #667eea);
    }

    .pin-hint {
      font-size: 12px;
      color: var(--text-secondary, #888);
      margin-top: 6px;
    }

    .upgrade-banner {
      padding: 14px 16px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      border-radius: 10px;
      margin-top: 12px;
    }

    .upgrade-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .upgrade-desc {
      font-size: 12px;
      opacity: 0.9;
    }
  `;

  constructor() {
    super();
    this.visible = false;
    this.role = getRole();
    this.subscribed = getSubscribed();
    this.songCount = 0;
    this.childPinInput = '';
  }

  willUpdate(changedProps) {
    if (changedProps.has('visible') && this.visible) {
      this.role = getRole();
      this.subscribed = getSubscribed();
      this.childPinInput = getChildPin();
    }
  }

  render() {
    if (!this.visible) return '';

    const quotaPercent = this.subscribed ? 0 : Math.min((this.songCount / FREE_QUOTA) * 100, 100);
    const quotaClass = quotaPercent >= 90 ? 'danger' : quotaPercent >= 70 ? 'warning' : '';

    return html`
      <div class="modal-overlay" @click="${this._onOverlayClick}">
        <div class="modal" @click="${e => e.stopPropagation()}">
          <div class="modal-header">
            <h3>设置</h3>
            <button class="close-btn" @click="${this._close}">&times;</button>
          </div>
          <div class="modal-body">
            <div class="section">
              <div class="section-title">角色</div>
              <div class="role-list">
                <div class="role-item ${this.role === ROLES.ADMIN ? 'active' : ''}" @click="${() => this._setRole(ROLES.ADMIN)}">
                  <div class="role-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div class="role-info">
                    <div class="role-name">管理员</div>
                    <div class="role-desc">完整权限，可管理所有音乐和设置</div>
                  </div>
                </div>

                <div class="role-item ${this.role === ROLES.USER ? 'active' : ''}" @click="${() => this._setRole(ROLES.USER)}">
                  <div class="role-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div class="role-info">
                    <div class="role-name">普通用户</div>
                    <div class="role-desc">创建个人歌单，不能删除管理员文件</div>
                  </div>
                </div>

                <div class="role-item ${this.role === ROLES.CHILD ? 'active' : ''}" @click="${() => this._setRole(ROLES.CHILD)}">
                  <div class="role-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div class="role-info">
                    <div class="role-name">儿童模式</div>
                    <div class="role-desc">仅儿童友好内容，音量上限 60%</div>
                  </div>
                </div>

                <div class="role-item ${this.role === ROLES.GUEST ? 'active' : ''}" @click="${() => this._setRole(ROLES.GUEST)}">
                  <div class="role-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                  <div class="role-info">
                    <div class="role-name">访客</div>
                    <div class="role-desc">30 分钟临时使用，只能听最近 10 首</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">配额</div>
              ${this.subscribed
                ? html`
                    <div class="subscribe-section">
                      <div class="subscribe-info">
                        <div class="subscribe-title">✨ 订阅版</div>
                        <div class="subscribe-desc">无限制歌曲数量</div>
                      </div>
                      <label class="switch">
                        <input type="checkbox" .checked="${this.subscribed}" @change="${this._toggleSubscribe}" />
                        <span class="switch-slider"></span>
                      </label>
                    </div>
                  `
                : html`
                    <div class="quota-info">
                      <div class="quota-text">
                        <span>免费版配额</span>
                        <span class="quota-count">${this.songCount} / ${FREE_QUOTA} 首</span>
                      </div>
                      <div class="quota-bar">
                        <div class="quota-fill ${quotaClass}" style="width: ${quotaPercent}%"></div>
                      </div>
                      <div class="quota-text">
                        <span>剩余 ${FREE_QUOTA - this.songCount} 首</span>
                      </div>
                    </div>
                    <div class="upgrade-banner">
                      <div class="upgrade-title">升级到订阅版</div>
                      <div class="upgrade-desc">解锁无限歌曲数量、更多高级功能</div>
                    </div>
                    <div style="margin-top: 12px;">
                      <label class="switch" style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" .checked="${this.subscribed}" @change="${this._toggleSubscribe}" />
                        <span class="switch-slider"></span>
                        <span style="font-size: 13px; color: var(--text-color);">已订阅（模拟）</span>
                      </label>
                    </div>
                  `
              }
            </div>

            ${this.role === ROLES.CHILD || getChildPin()
              ? html`
                  <div class="section">
                    <div class="section-title">儿童模式 PIN</div>
                    <div class="child-pin-section">
                      <input 
                        type="password" 
                        class="pin-input"
                        placeholder="设置 4 位 PIN 码"
                        maxlength="4"
                        .value="${this.childPinInput}"
                        @input="${e => this.childPinInput = e.target.value}"
                        @blur="${this._savePin}"
                      />
                      <div class="pin-hint">退出儿童模式需要输入 PIN 码</div>
                    </div>
                  </div>
                `
              : ''
            }
          </div>
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

  _setRole(role) {
    if (role === ROLES.CHILD && getChildPin()) {
      const pin = prompt('请输入儿童模式 PIN 码：');
      if (pin !== getChildPin()) {
        alert('PIN 码错误');
        return;
      }
    }

    if (this.role === ROLES.CHILD && role !== ROLES.CHILD && getChildPin()) {
      const pin = prompt('请输入 PIN 码退出儿童模式：');
      if (pin !== getChildPin()) {
        alert('PIN 码错误');
        return;
      }
    }

    this.role = role;
    setRole(role);
    this.dispatchEvent(new CustomEvent('role-change', { detail: { role } }));
  }

  _toggleSubscribe(e) {
    this.subscribed = e.target.checked;
    setSubscribed(this.subscribed);
    this.dispatchEvent(new CustomEvent('subscribe-change', { detail: { subscribed: this.subscribed } }));
  }

  _savePin() {
    if (this.childPinInput.length === 4 || this.childPinInput.length === 0) {
      setChildPin(this.childPinInput);
    }
  }
}

customElements.define('settings-panel', SettingsPanel);
