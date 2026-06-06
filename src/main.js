import './components/music-player.js';
import { getTheme } from './utils/storage.js';

function initTheme() {
  const theme = getTheme();
  const root = document.documentElement;
  root.classList.add(`theme-${theme}`);

  if (theme === 'system') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.matches) {
      root.classList.add('theme-dark');
    } else {
      root.classList.add('theme-light');
    }

    mq.addEventListener('change', (e) => {
      if (root.classList.contains('theme-system')) {
        root.classList.remove('theme-light', 'theme-dark');
        if (e.matches) {
          root.classList.add('theme-dark');
        } else {
          root.classList.add('theme-light');
        }
      }
    });
  }
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('Service Worker 注册失败:', err);
      });
    });
  }
}

initTheme();
registerServiceWorker();
