import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseConfig, dataKey, localEvidenceDirectory } from '../lib/server-config.mjs';

test('serverless deployment cannot fall back to a local database or file store', () => {
  const env = { VERCEL: '1', SILENTECHO_LOCAL_MODE: '1', TURSO_DATABASE_URL: 'file:/tmp/cases.db' };
  assert.throws(() => databaseConfig(env), /remote database/);
  assert.equal(localEvidenceDirectory(env), null);
  assert.throws(() => databaseConfig({}), /not configured/);
  assert.throws(() => databaseConfig({ TURSO_DATABASE_URL: 'libsql://example.turso.io' }), /credentials/);
  assert.throws(() => databaseConfig({ TURSO_DATABASE_URL: 'http://example.turso.io', TURSO_AUTH_TOKEN: 'test' }), /invalid/);
});

test('remote database credentials and encryption keys are validated without leaking values', () => {
  assert.deepEqual(databaseConfig({ TURSO_DATABASE_URL: 'libsql://example.turso.io', TURSO_AUTH_TOKEN: 'test-token' }), { url: 'libsql://example.turso.io', authToken: 'test-token' });
  const secret = 'this-must-not-appear-in-an-error';
  assert.throws(() => dataKey({ DATA_KEY: secret }), error => !error.message.includes(secret));
  assert.equal(dataKey({ DATA_KEY: Buffer.alloc(32, 7).toString('base64') }), Buffer.alloc(32, 7).toString('base64'));
});
