import fs from 'node:fs/promises';

const SIGNATURES = [
  { type: 'png', mime: 'image/png', check: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
  { type: 'jpeg', mime: 'image/jpeg', check: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'gif', mime: 'image/gif', check: (b) => b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61 },
  {
    type: 'webp',
    mime: 'image/webp',
    check: (b) => b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  }
];

export function detectImageSignature(buffer) {
  if (!buffer || buffer.length < 3) return null;
  const found = SIGNATURES.find((s) => s.check(buffer));
  return found ? { type: found.type, mime: found.mime } : null;
}

export async function validateImageFileSignature(filePath, declaredMime) {
  let handle;
  try {
    handle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, 16, 0);
    const detected = detectImageSignature(buffer.subarray(0, bytesRead));
    if (!detected) return { ok: false, detected: null };
    if (declaredMime && detected.mime !== declaredMime) return { ok: false, detected };
    return { ok: true, detected };
  } catch {
    return { ok: false, detected: null, error: 'read_failed' };
  } finally {
    await handle?.close().catch(() => {});
  }
}
