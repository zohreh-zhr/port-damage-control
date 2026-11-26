import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { env } from '../config/env.js';

function resolveUploadDir() {
  return path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.resolve(process.cwd(), env.UPLOAD_DIR);
}

export function getUploadDir() {
  return resolveUploadDir();
}

export async function ensureUploadDir() {
  const dir = resolveUploadDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function buildSafeFilename(originalName = 'image') {
  const ext = path.extname(originalName || '').toLowerCase().slice(0, 10) || '.bin';
  const safeExt = /^\.[a-z0-9]+$/i.test(ext) ? ext : '.bin';
  const id = crypto.randomUUID();
  return `${Date.now()}-${id}${safeExt}`;
}

export async function deleteFileIfExists(filePath) {
  if (!filePath) return { deleted: true, skipped: true };
  const dir = resolveUploadDir();
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const normalizedDir = path.normalize(dir + path.sep);
  const normalizedFile = path.normalize(absolute);
  if (!normalizedFile.startsWith(normalizedDir)) {
    return { deleted: false, skipped: true, reason: 'outside_upload_dir' };
  }
  try {
    await fs.unlink(absolute);
    return { deleted: true };
  } catch (err) {
    if (err.code === 'ENOENT') return { deleted: true, missing: true };
    console.error('[fileStorage] failed to delete file', { path: normalizedFile, code: err.code, message: err.message });
    return { deleted: false, error: err.code || err.message };
  }
}

export function getPublicImagePath(filename) {
  return `/uploads/${filename}`;
}
