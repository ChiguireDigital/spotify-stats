import crypto from 'node:crypto';
import { config } from '../config/env.js';

const PREFIX = 'enc:v1:';

function getKey() {
  const raw = config.tokenEncryptionKey || process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;
  // Accept base64, hex, or passphrase-derived key material.
  let buf;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) buf = Buffer.from(raw, 'hex');
  else {
    try { buf = Buffer.from(raw, 'base64'); } catch { buf = Buffer.from(raw, 'utf8'); }
  }
  if (buf.length !== 32) buf = crypto.createHash('sha256').update(raw).digest();
  return buf;
}

export function encryptText(plain) {
  if (plain == null || plain === '') return plain;
  const key = getKey();
  if (!key) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptText(value) {
  if (value == null || value === '') return value;
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return value; // legacy plaintext
  const key = getKey();
  if (!key) return null; // cannot decrypt without key
  const data = Buffer.from(value.slice(PREFIX.length), 'base64');
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const enc = data.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

export function encryptionEnabled() {
  return Boolean(getKey());
}
