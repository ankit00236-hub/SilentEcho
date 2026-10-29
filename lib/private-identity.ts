import { fingerprint } from './crypto.ts';

// The sign-in ID is a 256-bit bearer secret, not a public username or a Case ID.
export function newSignInId() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return 'SE-' + btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
export function validSignInId(value: unknown): value is string {
  return typeof value === 'string' && /^SE-[A-Za-z0-9_-]{43}$/.test(value);
}
export function signInReference(signInId: string, key: string) {
  return fingerprint('private-sign-in:' + signInId, key);
}
export function sessionReference(token: string, key: string) {
  return fingerprint('private-session:' + token, key);
}
export function ownerReference(accountId: string, key: string) {
  return fingerprint('private-owner:' + accountId, key);
}
