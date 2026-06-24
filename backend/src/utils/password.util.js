import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

/**
 * Compares a plain-text password against a bcrypt hash from users.password.
 * @param {string} plainTextPassword
 * @param {string} passwordHash
 */
export async function verifyPassword(plainTextPassword, passwordHash) {
  if (!plainTextPassword || !passwordHash) {
    return false;
  }

  return bcrypt.compare(plainTextPassword, passwordHash);
}

/**
 * Hashes a password for storage in users.password.
 * @param {string} plainTextPassword
 */
export async function hashPassword(plainTextPassword) {
  return bcrypt.hash(plainTextPassword, BCRYPT_ROUNDS);
}

export default {
  verifyPassword,
  hashPassword,
};
