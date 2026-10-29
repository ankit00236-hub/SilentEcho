import test from 'node:test';
import assert from 'node:assert/strict';
import { checkOrigin } from '../lib/request-security.ts';

test('accepts the actual browser host when Next.js normalises a loopback URL', () => {
  assert.doesNotThrow(() => checkOrigin(new Request('http://localhost:5173/api/auth', { headers: { host: '127.0.0.1:5173', origin: 'http://127.0.0.1:5173' } })));
  assert.doesNotThrow(() => checkOrigin(new Request('https://silent-echo.example/api/auth', { headers: { host: 'silent-echo.example', origin: 'https://silent-echo.example' } })));
});

test('rejects cross-origin writes, missing origins and spoofed forwarding headers', () => {
  for (const origin of [undefined, 'null', 'https://attacker.example', 'http://silent-echo.example', 'https://silent-echo.example:1234']) {
    assert.throws(() => checkOrigin(new Request('https://silent-echo.example/api/auth', { headers: { host: 'silent-echo.example', ...(origin ? { origin } : {}), 'x-forwarded-host': 'attacker.example' } })), /403:/);
  }
});
