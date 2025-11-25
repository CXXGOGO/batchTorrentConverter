// A lightweight Bencode parser focused on extracting the info hash accurately.
// We implement this manually to avoid complex Node.js Buffer polyfills in the browser.

export interface TorrentInfo {
  name: string;
  infoHash: string;
  magnetLink: string;
}

/**
 * Calculates the SHA-1 hash of a buffer using the Web Crypto API.
 */
async function sha1(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Decodes a Bencoded byte array to find specific keys.
 * Note: This is a specialized parser. We need the raw bytes of the 'info' dictionary
 * to calculate the hash, not just the decoded JS object.
 */
function getInfoDictAndName(buffer: Uint8Array): { infoBuffer: Uint8Array | null; name: string | null } {
  const decoder = new TextDecoder();
  let pos = 0;

  function peek() {
    return buffer[pos];
  }

  function consume() {
    return buffer[pos++];
  }

  function readInt(): number {
    consume(); // 'i'
    let end = pos;
    while (buffer[end] !== 101) { // 'e'
      end++;
    }
    const numStr = decoder.decode(buffer.slice(pos, end));
    pos = end + 1;
    return parseInt(numStr, 10);
  }

  function readStringBytes(): Uint8Array {
    let colon = pos;
    while (buffer[colon] !== 58) { // ':'
      colon++;
    }
    const lenStr = decoder.decode(buffer.slice(pos, colon));
    const len = parseInt(lenStr, 10);
    pos = colon + 1;
    const strBytes = buffer.slice(pos, pos + len);
    pos += len;
    return strBytes;
  }

  function readString(): string {
    return decoder.decode(readStringBytes());
  }

  // We are looking for the 'info' key in the root dictionary.
  // Root must be a dictionary 'd'.
  if (peek() !== 100) return { infoBuffer: null, name: null }; // not 'd'
  consume(); // 'd'

  let infoStart = -1;
  let infoEnd = -1;
  let foundName: string | null = null;

  while (pos < buffer.length) {
    if (peek() === 101) break; // 'e' end of dict

    // Keys in bencode are strings
    const key = readString();

    if (key === 'info') {
      infoStart = pos;
      skipValue(); // Skip over the value to find the end
      infoEnd = pos;
    } else if (key === 'name' && !foundName) {
      // Sometimes name is inside info, sometimes outside, usually inside info.
      // If we are at root, this might be the package name if not in info?
      // Actually standard requires 'name' to be in 'info' dict.
      // But we are at root level here. Let's just skip value.
      const val = readValue();
      if (typeof val === 'string') foundName = val;
    } else {
      skipValue();
    }
  }

  // If we have the info buffer, we should extract the name FROM the info buffer to be accurate.
  if (infoStart !== -1 && infoEnd !== -1) {
    const infoBuf = buffer.slice(infoStart, infoEnd);
    // Let's do a quick scan for 'name' inside infoBuf
    try {
      const nameInside = extractNameFromInfo(infoBuf);
      return { infoBuffer: infoBuf, name: nameInside || foundName || 'Unknown Torrent' };
    } catch (e) {
       return { infoBuffer: infoBuf, name: foundName || 'Unknown Torrent' };
    }
  }

  return { infoBuffer: null, name: null };

  // Helper to skip values recursively so we can determine start/end indices
  function skipValue() {
    const char = peek();
    if (char === 105) { // 'i'
      readInt();
    } else if (char === 108) { // 'l'
      consume();
      while (peek() !== 101) skipValue();
      consume();
    } else if (char === 100) { // 'd'
      consume();
      while (peek() !== 101) {
        readStringBytes(); // key
        skipValue(); // value
      }
      consume();
    } else if (char >= 48 && char <= 57) { // '0'-'9' string length
      readStringBytes();
    } else {
       // Unexpected, just advance to avoid infinite loop
       pos++;
    }
  }

  // Helper to read simple value (for name extraction at root if needed)
  function readValue(): any {
    const char = peek();
    if (char === 105) return readInt();
    if (char === 108) {
      consume();
      const list = [];
      while (peek() !== 101) list.push(readValue());
      consume();
      return list;
    }
    if (char === 100) {
      consume();
      const dict: any = {};
      while (peek() !== 101) {
        const k = readString();
        dict[k] = readValue();
      }
      consume();
      return dict;
    }
    if (char >= 48 && char <= 57) return readString();
    return null;
  }
}

function extractNameFromInfo(buffer: Uint8Array): string | null {
  const decoder = new TextDecoder();
  let pos = 0;
  // It's a dictionary 'd' ... 'e'
  if (buffer[pos] !== 100) return null;
  pos++;

  function peek() { return buffer[pos]; }
  function consume() { return buffer[pos++]; }
  function readStringBytes(): Uint8Array {
    let colon = pos;
    while (buffer[colon] !== 58) colon++;
    const len = parseInt(decoder.decode(buffer.slice(pos, colon)), 10);
    pos = colon + 1;
    const bytes = buffer.slice(pos, pos + len);
    pos += len;
    return bytes;
  }
  
  // Basic recursive skipper
  function skip() {
    const c = peek();
    if (c === 105) { // integer
        consume(); while(peek() !== 101) pos++; consume();
    } else if (c === 108 || c === 100) { // list or dict
        consume(); while(peek() !== 101) { 
           if (c === 100) { // if dict, skip key then value
              readStringBytes(); 
              skip(); 
           } else { // if list, just skip value
              skip();
           }
        } consume();
    } else if (c >= 48 && c <= 57) { // string
        readStringBytes();
    }
  }

  while (pos < buffer.length && peek() !== 101) {
    try {
        const key = decoder.decode(readStringBytes());
        if (key === 'name') {
            const nameBytes = readStringBytes();
            return decoder.decode(nameBytes);
        } else {
            skip();
        }
    } catch(e) {
        return null;
    }
  }
  return null;
}

export async function parseTorrentToMagnet(file: File): Promise<TorrentInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const { infoBuffer, name } = getInfoDictAndName(buffer);

        if (!infoBuffer) {
          reject(new Error("Invalid torrent file: 'info' dictionary not found."));
          return;
        }

        const hash = await sha1(infoBuffer);
        const magnetLink = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name || 'file')}`;

        resolve({
          name: name || file.name,
          infoHash: hash,
          magnetLink: magnetLink
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}
