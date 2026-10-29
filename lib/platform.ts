// Default runtime: standard Next.js on Vercel. Vite selects platform-cloudflare
// explicitly for the retained Sites build; it never enters the Next.js bundle.
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { put, get, del } from '@vercel/blob';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import * as schema from '../db/schema';
import { databaseConfig, dataKey, localEvidenceDirectory } from './server-config.mjs';

export const trustsPlatformIdentity = false;
export const storageKey = () => dataKey();

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function getDb() {
  // Initialise lazily: the public pages and build do not need database access.
  database ??= drizzle(createClient(databaseConfig()), { schema });
  return database;
}

export function requestAddress(request: Request) {
  // Vercel overwrites x-forwarded-for. Never trust Cloudflare identity/IP
  // headers supplied directly by a visitor to this deployment.
  return process.env.VERCEL === '1'
    ? request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    : 'local';
}

function evidencePath(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('404:File not found');
  return `evidence/${id}`;
}
function blobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('503:Private evidence storage is not configured');
  return token;
}
export async function putEvidence(id: string, ciphertext: string) {
  const name = evidencePath(id), directory = localEvidenceDirectory();
  if (directory) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(path.join(directory, id), ciphertext, { flag: 'wx', mode: 0o600 });
    return;
  }
  await put(name, ciphertext, { access: 'private', token: blobToken(), addRandomSuffix: false, contentType: 'application/octet-stream' });
}
export async function getEvidence(id: string) {
  const name = evidencePath(id), directory = localEvidenceDirectory();
  if (directory) {
    try { return await readFile(path.join(directory, id), 'utf8'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
  }
  const result = await get(name, { access: 'private', token: blobToken(), useCache: false });
  if (!result) return null;
  if (result.statusCode !== 200) throw new Error('503:Unable to read private evidence');
  return new Response(result.stream).text();
}
export async function deleteEvidence(id: string) {
  const name = evidencePath(id), directory = localEvidenceDirectory();
  if (directory) {
    try { await unlink(path.join(directory, id)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    return;
  }
  await del(name, { token: blobToken() });
}
