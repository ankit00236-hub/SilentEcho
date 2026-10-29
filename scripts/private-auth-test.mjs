import assert from 'node:assert/strict';
import { newSignInId } from '../lib/private-identity.ts';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
if(!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Run only against an isolated local test server.');
async function call(path,body,cookie='',origin=base){const r=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{origin,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; '),cookieFlags:r.headers.get('set-cookie'),cache:r.headers.get('cache-control')};}
assert.equal((await call('workspace')).status,401);
assert.equal((await call('auth',{action:'register'},'','https://elsewhere.test')).status,403);
assert.equal((await call('auth',{action:'register',workspace:'invalid'})).status,400);
assert.equal((await call('auth',{action:'register',workspace:'organisation',organisationName:'x',organisationKind:'Company'})).status,400);
const organisationAdmin=await call('auth',{action:'register',workspace:'organisation',organisationName:'Organisation signup workflow',organisationKind:'Company'});assert.equal(organisationAdmin.status,201);assert.ok(organisationAdmin.data.invite);
const adminWorkspace=await call('workspace',undefined,organisationAdmin.cookie);assert.ok(adminWorkspace.data.organisations.some(org=>org.name==='Organisation signup workflow'&&org.member));
const reporter=await call('auth',{action:'register'}),staff=await call('auth',{action:'register'}),stranger=await call('auth',{action:'register'});
for(const response of [reporter,staff,stranger,organisationAdmin]){assert.equal(response.status,201);assert.match(response.data.signInId,/^SE-[A-Za-z0-9_-]{43}$/);assert.ok(response.cookie);assert.ok(response.cookieFlags.includes('HttpOnly'));assert.ok(response.cookieFlags.includes('SameSite=Lax'));assert.equal(response.cache,'no-store');}
assert.equal((await call('auth',{action:'login',signInId:newSignInId()})).status,401);
assert.equal((await call('auth',{action:'login',signInId:'SE-short'})).status,401);
const org=await call('workspace',{action:'create',name:'Private account test organisation',kind:'Community'},staff.cookie);assert.equal(org.status,201);
const filed=await call('cases',{title:'A privately tracked case',description:'A detailed concern used to verify private sign-in accounts and case tracking without storing readable credentials.',org:org.data.id,category:'Other',priority:'Moderate'},reporter.cookie);assert.equal(filed.status,201);const id=filed.data.id;
assert.equal((await call('cases/'+id,undefined,stranger.cookie)).status,404);
assert.equal((await call('cases/'+id,{action:'update',status:'Resolved',category:'Other',priority:'Moderate',note:'Unauthorised change'},reporter.cookie)).status,403);
assert.equal((await call('cases/'+id,{action:'update',status:'In progress',category:'Other',priority:'Moderate',note:'The response team is reviewing the evidence.'},staff.cookie)).status,200);
const oldCookie=reporter.cookie;
assert.equal((await call('auth',{action:'logout'},oldCookie)).status,200);
assert.equal((await call('workspace',undefined,oldCookie)).status,401);
const signedIn=await call('auth',{action:'login',signInId:reporter.data.signInId});assert.equal(signedIn.status,200);assert.notEqual(signedIn.cookie,oldCookie);
const tracked=await call('cases/'+id,undefined,signedIn.cookie);assert.equal(tracked.status,200);assert.equal(tracked.data.record.status,'In progress');assert.ok(tracked.data.record.mine);assert.ok(!('owner' in tracked.data.record));assert.ok(!JSON.stringify(tracked.data).includes(reporter.data.signInId));
assert.equal((await call('workspace',undefined,'silentecho_session='+newSignInId())).status,401);
if(process.env.TEST_DB_PATH){
 const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(process.env.TEST_DB_PATH,{readOnly:true});
 try{
  const accountRows=db.prepare('SELECT * FROM private_accounts').all(),sessions=db.prepare('SELECT * FROM private_sessions').all(),cases=db.prepare('SELECT * FROM cases').all();
  const stored=JSON.stringify([accountRows,sessions,cases,...db.prepare('SELECT * FROM auth_limits').all()]);
  for(const response of [reporter,staff,stranger,organisationAdmin]){assert.ok(!stored.includes(response.data.signInId));assert.ok(!stored.includes(response.cookie.split('=')[1]));}
  assert.ok(!stored.includes(signedIn.cookie.split('=')[1]));
  assert.ok(accountRows.every(a=>/^[A-Za-z0-9+/]{43}=$/.test(a.login_hash)&&a.owner!==a.login_hash));
  assert.ok(accountRows.every(a=>!('email' in a)&&!('name' in a)));
  assert.ok(!stored.includes('A privately tracked case'));
  const row=cases.find(c=>c.id===id);assert.ok(accountRows.some(a=>a.owner===row.owner));
  const databaseDigest=accountRows[0].login_hash;assert.equal((await call('auth',{action:'login',signInId:databaseDigest})).status,401);
  console.log('PASS: database contains no readable sign-in IDs, session tokens, names, emails, or plaintext report content; database digests cannot sign in.');
 }finally{db.close();}
}
let limited=false;for(let i=0;i<32;i++){const attempt=await call('auth',{action:'login',signInId:newSignInId()});if(attempt.status===429){limited=true;break;}assert.equal(attempt.status,401);}assert.ok(limited);
console.log('PASS: separate personal/organisation registration, ID sign-in, session persistence and revocation, cross-account isolation, case progress tracking, CSRF protection, and authentication throttling.');
