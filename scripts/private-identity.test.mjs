import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSignInId, validSignInId, signInReference, sessionReference, ownerReference } from '../lib/private-identity.ts';
const randomSecret=()=>Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
const key=randomSecret();
test('generated sign-in IDs contain 256 random bits and do not collide',()=>{
 const ids=new Set(Array.from({length:1000},newSignInId));assert.equal(ids.size,1000);
 for(const id of ids){assert.equal(validSignInId(id),true);assert.equal(Buffer.from(id.slice(3),'base64url').length,32);}
 assert.equal(validSignInId(crypto.randomUUID()),false);assert.equal(validSignInId('SE-12345678'),false);assert.equal(validSignInId(null),false);
});
test('database references cannot be used as sign-in IDs or session tokens',async()=>{
 const id=newSignInId(),hash=await signInReference(id,key);
 assert.equal(hash,await signInReference(id,key));assert.notEqual(hash,id);assert.equal(validSignInId(hash),false);
 assert.notEqual(hash,await sessionReference(id,key));assert.notEqual(hash,await ownerReference(id,key));
 assert.notEqual(hash,await signInReference(id,randomSecret()));
});
