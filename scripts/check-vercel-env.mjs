import nextEnv from '@next/env';
import { databaseConfig, dataKey } from '../lib/server-config.mjs';

nextEnv.loadEnvConfig(process.cwd());
try {
  const env = { ...process.env, VERCEL: '1' };
  databaseConfig(env);
  dataKey(env);
  if (!env.BLOB_READ_WRITE_TOKEN) throw new Error('Private Blob storage is not configured');
  console.log('Vercel database, encryption and private-storage settings are present.');
} catch (error) {
  console.error(error.message.replace(/^503:/, ''));
  console.error('Add TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, DATA_KEY and BLOB_READ_WRITE_TOKEN to this Vercel environment. See docs/VERCEL.md.');
  process.exitCode = 1;
}
