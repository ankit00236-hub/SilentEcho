import nextEnv from '@next/env';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { databaseConfig } from '../lib/server-config.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
nextEnv.loadEnvConfig(root);
const config = databaseConfig();
if (config.url.startsWith('file:')) await mkdir(path.dirname(config.url.slice(5)), { recursive: true, mode: 0o700 });
const client = createClient(config);
try {
  await migrate(drizzle(client), { migrationsFolder: path.join(root, 'drizzle') });
  console.log('Database schema is up to date. Existing accounts and case records were preserved.');
} catch {
  // Driver errors can include endpoint or connection details. Do not print secrets.
  console.error('Database migration failed. Check the database credentials and access, then retry npm run db:migrate.');
  process.exitCode = 1;
} finally {
  client.close();
}
