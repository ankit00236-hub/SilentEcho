import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seal, unseal, fingerprint } from '../lib/crypto.ts';
const secret=crypto.getRandomValues(new Uint8Array(32)).toBase64();
test('AES-GCM protects content and uses a fresh nonce',async()=>{const a=await seal('private report',secret,'case-a'),b=await seal('private report',secret,'case-a');assert.notEqual(a,b);assert.equal(await unseal(a,secret,'case-a'),'private report');assert.ok(!a.includes('private report'));});
test('Ciphertext cannot be moved to another case or decrypted using another key',async()=>{const a=await seal('sensitive',secret,'case-a');await assert.rejects(unseal(a,secret,'case-b'));await assert.rejects(unseal(a,crypto.getRandomValues(new Uint8Array(32)).toBase64(),'case-a'));const [iv,data]=a.split('.');const modified=Uint8Array.fromBase64(data);modified[0]^=1;await assert.rejects(unseal(iv+'.'+modified.toBase64(),secret,'case-a'));});
test('Account references are stable, keyed, and distinct',async()=>{const a=await fingerprint('account:a',secret);assert.equal(a,await fingerprint('account:a',secret));assert.notEqual(a,await fingerprint('account:b',secret));assert.notEqual(a,await fingerprint('account:a',crypto.getRandomValues(new Uint8Array(32)).toBase64()));});
