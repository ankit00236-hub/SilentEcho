import { env } from 'cloudflare:workers';
import { eq, and, gt, lt, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { authLimits, privateAccounts, privateSessions, organisations, members } from '../db/schema';
import { fingerprint } from './crypto';
import { newSignInId, ownerReference, sessionReference, signInReference, validSignInId } from './private-identity';

const cookieName = 'silentecho_session';
const sessionLifetime = 7 * 24 * 60 * 60;
export function storageKey() {
  const key = (env as typeof env & { DATA_KEY?: string }).DATA_KEY;
  if (!key) throw new Error('503:Secure storage is not configured');
  return key;
}
export function checkOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new Error('403:Request origin rejected');
}
function sessionCookie(request: Request) {
  const values = (request.headers.get('cookie') ?? '').split(';').map(s => s.trim()).filter(s => s.startsWith(cookieName + '='));
  if (!values.length) return null;
  if (values.length !== 1) throw new Error('401:Please sign in to continue');
  return values[0].slice(cookieName.length + 1);
}
export function cookieHeader(request: Request, token: string, clear = false) {
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : sessionLifetime}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export async function privateAccount(request: Request, key: string) {
  const token = sessionCookie(request);
  if (token === null) return null;
  if (!validSignInId(token)) throw new Error('401:Please sign in to continue');
  const db = getDb();
  const [row] = await db.select({ owner: privateAccounts.owner }).from(privateSessions).innerJoin(privateAccounts, eq(privateSessions.account, privateAccounts.id)).where(and(eq(privateSessions.tokenHash, await sessionReference(token, key)), gt(privateSessions.expires, Date.now())));
  if (!row) throw new Error('401:Your session expired. Please sign in again');
  return row;
}
export async function startSession(request: Request, account: string, key: string) {
  const token = newSignInId();
  await getDb().insert(privateSessions).values({ account, tokenHash: await sessionReference(token, key), expires: Date.now() + sessionLifetime * 1000 });
  return cookieHeader(request, token);
}
export async function endSession(request: Request, key: string) {
  // Clear duplicate or malformed cookies too, so an invalid session cannot trap the user.
  const tokens = (request.headers.get('cookie') ?? '').split(';').map(s => s.trim()).filter(s => s.startsWith(cookieName + '=')).map(s => s.slice(cookieName.length + 1));
  for (const token of tokens) if (validSignInId(token)) await getDb().delete(privateSessions).where(eq(privateSessions.tokenHash, await sessionReference(token, key)));
  return cookieHeader(request, '', true);
}
export async function limitAuth(request: Request, key: string) {
  const now = Date.now(), window = Math.floor(now / 900_000);
  // Store neither the network address nor a readable account credential.
  const address = request.headers.get('cf-connecting-ip') ?? 'local';
  const bucket = await fingerprint(`auth-window:${window}:${address}`, key);
  const db = getDb();
  const [row] = await db.insert(authLimits).values({ bucket, count: 1, expires: (window + 1) * 900_000 }).onConflictDoUpdate({ target: authLimits.bucket, set: { count: sql`${authLimits.count} + 1` } }).returning({ count: authLimits.count });
  if (row.count > 30) throw new Error('429:Too many attempts. Please try again in 15 minutes');
  await db.delete(authLimits).where(lt(authLimits.expires, now));
  await db.delete(privateSessions).where(lt(privateSessions.expires, now));
}
export async function registerPrivateAccount(key: string, organisation?: { name: string; kind: string }, joinOrganisation?:string) {
  const id = crypto.randomUUID(), signInId = newSignInId(), owner = await ownerReference(id, key), created = new Date().toISOString();
  const db = getDb(), account = { id, loginHash: await signInReference(signInId, key), owner, created };
  if (organisation) {
    const orgId = crypto.randomUUID(), invite = crypto.randomUUID();
    await db.batch([
      db.insert(privateAccounts).values(account),
      db.insert(organisations).values({ id: orgId, name: organisation.name, kind: organisation.kind, owner, inviteHash: await fingerprint('invite:' + invite, key), created }),
    ]);
    return { id, signInId, invite };
  }
  if(joinOrganisation){
    await db.batch([db.insert(privateAccounts).values(account),db.insert(members).values({id:crypto.randomUUID(),org:joinOrganisation,account:owner})]);
    return {id,signInId};
  }
  await db.insert(privateAccounts).values(account);
  return { id, signInId };
}
export async function findPrivateAccount(signInId: unknown, key: string) {
  if (!validSignInId(signInId)) throw new Error('401:That sign-in ID was not recognised. Check the full ID and try again');
  const [row] = await getDb().select({ id: privateAccounts.id }).from(privateAccounts).where(eq(privateAccounts.loginHash, await signInReference(signInId, key)));
  if (!row) throw new Error('401:That sign-in ID was not recognised. Check the full ID and try again');
  return row;
}
