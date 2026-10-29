import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normaliseInvitationCode} from '../lib/team-invites.ts';
test('team codes accept copied whitespace and uppercase UUIDs',()=>{const code=crypto.randomUUID();assert.equal(normaliseInvitationCode('  '+code.toUpperCase()+'\n'),code);assert.equal(normaliseInvitationCode(code.slice(0,15)+'\n'+code.slice(15)),code);});
test('private account IDs and incomplete invitations are rejected with useful messages',()=>{assert.throws(()=>normaliseInvitationCode('SE-'+'a'.repeat(43)),/private sign-in ID/);assert.throws(()=>normaliseInvitationCode('12345678'),/complete team invitation/);assert.throws(()=>normaliseInvitationCode(null),/Paste/);assert.throws(()=>normaliseInvitationCode('x'.repeat(101)),/Paste/);});
