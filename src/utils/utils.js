export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getFileExtension(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ext;
}

export const SUPPORTED_FORMATS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

export function isSupportedFormat(filename) {
  const ext = getFileExtension(filename);
  return SUPPORTED_FORMATS.includes(ext);
}

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function parseM3U(content, basePath = '') {
  const lines = content.split(/\r?\n/);
  const songs = [];
  let currentTitle = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      if (trimmed.startsWith('#EXTINF:')) {
        const parts = trimmed.substring(8).split(',');
        if (parts.length > 1) {
          currentTitle = parts.slice(1).join(',').trim();
        }
      }
      continue;
    }

    songs.push({
      path: trimmed,
      title: currentTitle || trimmed.split('/').pop().split('\\').pop(),
      duration: null
    });
    currentTitle = '';
  }

  return songs;
}
