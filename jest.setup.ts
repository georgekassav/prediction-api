import { redis } from './src/common/config/redis';
import { pool } from './src/db';

// Increase timeout for database operations
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  await Promise.all([
    redis.quit(),
    pool.end(),
  ]);
});
