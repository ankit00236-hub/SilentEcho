import { randomBytes } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import nextEnv from '@next/env';
import { localMode, databaseConfig } from '../lib/server-config.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
if (process.env.VERCEL === '1') throw new Error('Local setup cannot run on Vercel. Configure a remote database and private Blob storage instead.');
await mkdir(new URL('../.local/', import.meta.url), { recursive: true, mode: 0o700 });
try {
  await writeFile(new URL('../.env.local', import.meta.url), [
    'SILENTECHO_LOCAL_MODE=1',
    'TURSO_DATABASE_URL=file:.local/silentecho.db',
    'SILENTECHO_LOCAL_DATA_DIR=.local',
    `DATA_KEY=${randomBytes(32).toString('base64')}`, '',
  ].join('\n'), { flag: 'wx', mode: 0o600 });
  console.log('Created ignored local settings and encryption key.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Preserved existing .env.local and encryption key.');
}
nextEnv.loadEnvConfig(root);
if (!localMode() || !databaseConfig().url.startsWith('file:')) throw new Error('Existing settings do not select a local file database. Local setup stopped without migrating any hosted data; use npm run db:migrate explicitly for a remote database.');
const result = spawnSync(process.execPath, ['scripts/migrate-database.mjs'], { cwd: root, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
