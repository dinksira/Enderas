import { createHash, randomBytes } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

export function generateUuid() {
  return uuidv4();
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function generateOpaqueToken(byteLength = 32) {
  return randomBytes(byteLength).toString('base64url');
}

export default {
  generateUuid,
  hashToken,
  generateOpaqueToken,
};
