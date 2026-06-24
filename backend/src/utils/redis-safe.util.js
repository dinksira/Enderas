import { getRedisClient } from '../config/redis.config.js';

/**
 * Executes a Redis operation without crashing the request path.
 * Falls back when Redis is offline or misconfigured.
 * @template T
 * @param {(client: import('ioredis').default) => Promise<T>} operation
 * @param {T | ((error: Error) => T)} [fallback]
 */
export async function withRedis(operation, fallback = null) {
  try {
    const client = getRedisClient();

    if (client.status === 'end' || client.status === 'close') {
      throw new Error('redis unavailable');
    }

    if (client.status === 'wait') {
      await client.connect();
    }

    return await operation(client);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[redis] cache bypassed:', message);

    if (typeof fallback === 'function') {
      return fallback(error instanceof Error ? error : new Error(message));
    }

    return fallback;
  }
}

export default {
  withRedis,
};
