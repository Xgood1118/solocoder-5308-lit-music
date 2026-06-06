const ID3_FRAMES = {
  TIT2: 'title',
  TPE1: 'artist',
  TALB: 'album',
  TCON: 'genre',
  TYER: 'year',
  TRCK: 'track',
  APIC: 'cover',
  TDRC: 'year'
};

function syncSafeInt(bytes) {
  let out = 0;
  for (let i = 0; i < 4; i++) {
    out = (out << 7) | (bytes[i] & 0x7f);
  }
  return out;
}

function readUtf16String(view, offset, length) {
  if (length < 2) return '';
  const bom = view.getUint16(offset, false);
  const littleEndian = bom === 0xfffe;
  let str = '';
  const start = offset + 2;
  const end = offset + length;
  for (let i = start; i < end - 1; i += 2) {
    const code = view.getUint16(i, littleEndian);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str;
}

function readIsoString(view, offset, length) {
  let str = '';
  for (let i = 0; i < length; i++) {
    const byte = view.getUint8(offset + i);
    if (byte === 0) break;
    str += String.fromCharCode(byte);
  }
  return str;
}

export async function parseID3v2(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const view = new DataView(buffer);
        const header = String.fromCharCode(
          view.getUint8(0), view.getUint8(1), view.getUint8(2)
        );
        if (header !== 'ID3') {
          resolve({ title: '', artist: '', album: '', cover: null });
          return;
        }
        const version = view.getUint8(3);
        const tagSize = syncSafeInt([
          view.getUint8(6), view.getUint8(7),
          view.getUint8(8), view.getUint8(9)
        ]);
        const result = { title: '', artist: '', album: '', cover: null };
        let offset = 10;
        const end = 10 + tagSize;
        while (offset < end - 10) {
          let frameId, frameSize, frameHeaderSize;
          if (version === 3 || version === 4) {
            frameId = String.fromCharCode(
              view.getUint8(offset), view.getUint8(offset + 1),
              view.getUint8(offset + 2), view.getUint8(offset + 3)
            );
            if (frameId === '\x00\x00\x00\x00') break;
            frameSize = version === 4
              ? syncSafeInt([
                  view.getUint8(offset + 4), view.getUint8(offset + 5),
                  view.getUint8(offset + 6), view.getUint8(offset + 7)
                ])
              : view.getUint32(offset + 4, false);
            frameHeaderSize = 10;
          } else {
            frameId = String.fromCharCode(
              view.getUint8(offset), view.getUint8(offset + 1),
              view.getUint8(offset + 2)
            );
            if (frameId === '\x00\x00\x00') break;
            frameSize = view.getUint8(offset + 3) << 16
              | view.getUint8(offset + 4) << 8
              | view.getUint8(offset + 5);
            frameHeaderSize = 6;
          }
          if (frameSize <= 0) break;
          const frameOffset = offset + frameHeaderSize;
          const fieldName = ID3_FRAMES[frameId];
          if (fieldName) {
            if (frameId === 'APIC') {
              const encoding = view.getUint8(frameOffset);
              let pos = frameOffset + 1;
              let mime = '';
              while (pos < frameOffset + frameSize) {
                const b = view.getUint8(pos++);
                if (b === 0) break;
                mime += String.fromCharCode(b);
              }
              const pictureType = view.getUint8(pos++);
              let description = '';
              if (encoding === 0) {
                while (pos < frameOffset + frameSize) {
                  const b = view.getUint8(pos++);
                  if (b === 0) break;
                  description += String.fromCharCode(b);
                }
              } else {
                while (pos < frameOffset + frameSize - 1) {
                  const b1 = view.getUint8(pos++);
                  const b2 = view.getUint8(pos++);
                  if (b1 === 0 && b2 === 0) break;
                  description += String.fromCharCode(encoding === 1 ? b2 : b1);
                }
              }
              const picData = new Uint8Array(buffer, pos, frameOffset + frameSize - pos);
              result.cover = `data:${mime};base64,${arrayBufferToBase64(picData)}`;
            } else {
              const encoding = view.getUint8(frameOffset);
              const textData = encoding === 0
                ? readIsoString(view, frameOffset + 1, frameSize - 1)
                : readUtf16String(view, frameOffset + 1, frameSize - 1);
              result[fieldName] = textData;
            }
          }
          offset += frameHeaderSize + frameSize;
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file.slice(0, Math.min(256 * 1024, file.size)));
  });
}

function arrayBufferToBase64(bytes) {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

export function parseFilename(filename) {
  const name = filename.replace(/\.[^/.]+$/, '');
  const match = name.match(/^(\d+)\s*[-.]\s*(.+)$/);
  if (match) {
    return { track: parseInt(match[1], 10), title: match[2].trim() };
  }
  return { track: null, title: name };
}
