import path from 'node:path';

export function localMode(env = process.env) {
  return env.SILENTECHO_LOCAL_MODE === '1' && env.VERCEL !== '1';
}

export function databaseConfig(env = process.env) {
  const url = env.TURSO_DATABASE_URL?.trim();
  if (!url) throw new Error('503:Shared database is not configured');
  if (url.startsWith('file:')) {
    if (!localMode(env)) throw new Error('503:A remote database is required for hosted deployment');
    return { url };
  }
  if (!/^libsql:\/\/[^/\s]+\/?$/.test(url) && !/^https:\/\/[^/\s]+\/?$/.test(url)) {
    throw new Error('503:Shared database URL is invalid');
  }
  const authToken = env.TURSO_AUTH_TOKEN?.trim();
  if (!authToken) throw new Error('503:Shared database credentials are not configured');
  return { url, authToken };
}

export function dataKey(env = process.env) {
  const key = env.DATA_KEY?.trim();
  if (!key || !/^[A-Za-z0-9+/]{43}=$/.test(key)) {
    throw new Error('503:Secure storage requires a base64-encoded 32-byte DATA_KEY');
  }
  return key;
}

export function localEvidenceDirectory(env = process.env) {
  if (!localMode(env)) return null;
  return path.resolve(env.SILENTECHO_LOCAL_DATA_DIR || '.local', 'evidence');
}
