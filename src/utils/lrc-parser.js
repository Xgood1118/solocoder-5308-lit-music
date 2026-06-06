export function parseLRC(lrcText) {
  const lines = lrcText.split(/\r?\n/);
  const lyrics = [];
  const metadata = {};
  const timeTagRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
  const metaTagRegex = /\[(\w+):([^\]]+)\]/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const metaMatch = trimmed.match(metaTagRegex);
    if (metaMatch && !timeTagRegex.test(trimmed)) {
      metadata[metaMatch[1].toLowerCase()] = metaMatch[2].trim();
      continue;
    }

    timeTagRegex.lastIndex = 0;
    const timeTags = [];
    let match;
    while ((match = timeTagRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const msStr = match[3];
      const milliseconds = msStr.length === 3
        ? parseInt(msStr, 10)
        : parseInt(msStr, 10) * 10;
      const time = minutes * 60 + seconds + milliseconds / 1000;
      timeTags.push(time);
    }

    if (timeTags.length > 0) {
      const text = trimmed.replace(timeTagRegex, '').trim();
      for (const time of timeTags) {
        lyrics.push({ time, text });
      }
    }
  }

  lyrics.sort((a, b) => a.time - b.time);
  return { metadata, lyrics };
}

export function findLyricIndex(lyrics, currentTime) {
  if (!lyrics || lyrics.length === 0) return -1;
  let left = 0;
  let right = lyrics.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (lyrics[mid].time <= currentTime) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return result;
}
