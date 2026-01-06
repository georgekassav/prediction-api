import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { config } from '../common/config/config';

async function runMigrations() {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('Running migrations...');

  await migrate(db, { migrationsFolder: './migrations' });

  console.log('Migrations completed successfully');

  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
