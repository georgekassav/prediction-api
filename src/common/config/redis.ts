import Redis from 'ioredis';
import { config } from './config';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: config.IS_DEVELOPMENT,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
