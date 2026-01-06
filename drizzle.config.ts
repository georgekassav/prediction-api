import { defineConfig } from 'drizzle-kit';
import { config } from './src/common/config/config';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.DATABASE_URL,
  },
});
