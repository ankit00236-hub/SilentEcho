import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

export const trustsPlatformIdentity = true;
export function getDb() {
  if (!env.DB) throw new Error('503:Shared database is not configured');
  return drizzle(env.DB, { schema });
}
export function storageKey() {
  const key = (env as typeof env & { DATA_KEY?: string }).DATA_KEY;
  if (!key) throw new Error('503:Secure storage is not configured');
  return key;
}
export function requestAddress(request: Request) { return request.headers.get('cf-connecting-ip') ?? 'local'; }
export async function putEvidence(id: string, ciphertext: string) {
  if (!env.BUCKET) throw new Error('503:Evidence storage unavailable');
  await env.BUCKET.put(id, ciphertext);
}
export async function getEvidence(id: string) {
  if (!env.BUCKET) throw new Error('503:Evidence storage unavailable');
  const object = await env.BUCKET.get(id);
  return object ? object.text() : null;
}
export async function deleteEvidence(id: string) { await env.BUCKET?.delete(id); }
