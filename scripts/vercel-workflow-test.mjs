// Exercises the production Next.js server with isolated libSQL/file storage.
// Remote Turso and Blob connectivity is verified only after real credentials
// are connected; these tests never mutate hosted data.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { createClient } from '@libsql/client';

const root = fileURLToPath(new URL('..', import.meta.url));
const browser = process.argv.includes('--browser');
const suites = browser ? ['team-browser-check.mjs'] : ['integration-test.mjs', 'team-workflow-test.mjs', 'private-auth-test.mjs'];
async function run(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  const code = await new Promise(resolve => child.once('exit', resolve));
  assert.equal(code, 0, `Failed: ${args[0]}`);
}
async function freePort() {
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}
for (const suite of suites) {
  const directory = await mkdtemp(path.join(tmpdir(), 'silentecho-next-test-'));
  const port = await freePort(), url = `http://127.0.0.1:${port}`;
  const env = { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', VERCEL: '', SILENTECHO_LOCAL_MODE: '1', SILENTECHO_LOCAL_DATA_DIR: directory, TURSO_DATABASE_URL: `file:${directory}/cases.db`, TURSO_AUTH_TOKEN: '', BLOB_READ_WRITE_TOKEN: '', DATA_KEY: randomBytes(32).toString('base64'), TEST_URL: url, TEST_DB_PATH: path.join(directory, 'cases.db') };
  let server;
  try {
    await run(['scripts/migrate-database.mjs'], env);
    // A second migration must be safe and retain the same schema.
    await run(['scripts/migrate-database.mjs'], env);
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: root, env, stdio: 'inherit' });
    let ready = false;
    for (let i = 0; i < 150 && server.exitCode === null; i++) {
      try { ready = (await fetch(url + '/')).ok; } catch { /* starting */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'Production Next.js server must start');
    const spoofed = await fetch(url + '/api/workspace', { headers: { 'oai-authenticated-user-id': 'forged-admin', 'oai-authenticated-user-email': 'forged@example.test' } });
    assert.equal(spoofed.status, 401, 'Vercel must reject client-supplied platform identities');
    await run(['scripts/' + suite], env);
    const inspection = createClient({ url: env.TURSO_DATABASE_URL });
    const counts = async () => (await Promise.all(['private_accounts', 'private_sessions', 'organisations', 'members', 'cases', 'events', 'evidence'].map(table => inspection.execute(`SELECT COUNT(*) AS n FROM ${table}`)))).map(result => result.rows[0].n);
    try {
      const before = await counts();
      assert.ok(before[0] >= 3);
      await run(['scripts/migrate-database.mjs'], env);
      assert.deepEqual(await counts(), before, 'Redeployment migrations must retain existing accounts and complaints');
    } finally { inspection.close(); }
    // Evidence on disk must remain encrypted, including its original filename.
    if (suite === 'integration-test.mjs') {
      const files = await readdir(path.join(directory, 'evidence'));
      assert.equal(files.length, 1);
      const stored = await readFile(path.join(directory, 'evidence', files[0]), 'utf8');
      assert.ok(!stored.includes('encrypted evidence content') && !stored.includes('test.txt'));
    }
  } finally {
    if (server && server.exitCode === null) {
      const ended = new Promise(resolve => server.once('exit', resolve));
      server.kill('SIGTERM');
      await ended;
    }
    await rm(directory, { recursive: true, force: true });
  }
}
console.log('PASS: production Next.js workflows use shared-storage adapters, reject forged identity headers, and preserve private accounts, encrypted cases, evidence and team access.');
