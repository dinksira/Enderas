import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';

const ACCESS_TOKEN_TYPE = 'access';

export function signAccessToken(payload) {
  return jwt.sign(
    {
      ...payload,
      typ: ACCESS_TOKEN_TYPE,
    },
    env.jwt.accessSecret,
    {
      expiresIn: env.jwt.accessExpiresIn,
      algorithm: 'HS256',
    },
  );
}

export function verifyAccessToken(token) {
  const decoded = jwt.verify(token, env.jwt.accessSecret, {
    algorithms: ['HS256'],
  });

  if (decoded.typ !== ACCESS_TOKEN_TYPE) {
    const error = new Error('Invalid token type');
    error.name = 'JsonWebTokenError';
    throw error;
  }

  return decoded;
}

export default {
  signAccessToken,
  verifyAccessToken,
};
