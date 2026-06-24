import Redis from 'ioredis';
import { env } from './env.config.js';

let redisClient = null;
let redisSubscriber = null;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(env.redis.url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
    });

    redisClient.on('error', (error) => {
      console.warn('[redis] client error:', error.message);
    });
  }

  return redisClient;
}

export function getRedisSubscriber() {
  if (!redisSubscriber) {
    redisSubscriber = new Redis(env.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
    });

    redisSubscriber.on('error', (error) => {
      console.warn('[redis] subscriber error:', error.message);
    });
  }

  return redisSubscriber;
}

export async function disconnectRedis() {
  const clients = [redisClient, redisSubscriber].filter(Boolean);
  await Promise.all(clients.map((client) => client.quit()));
  redisClient = null;
  redisSubscriber = null;
}

export default getRedisClient;
