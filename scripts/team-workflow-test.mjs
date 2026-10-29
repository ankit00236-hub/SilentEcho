import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
if(!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Run only against an isolated local server.');
async function call(path,body,cookie=''){const response=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{origin:base,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json(),cookie:response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ')};}
assert.equal((await call('auth')).data.authenticated,false);
const admin=await call('auth',{action:'register',workspace:'organisation',organisationName:'Cross-device team '+crypto.randomUUID(),organisationKind:'Community'});assert.equal(admin.status,201);const code=admin.data.invite;
const adminWorkspace=await call('workspace',undefined,admin.cookie);const org=adminWorkspace.data.organisations.find(item=>item.member);assert.ok(org.canInvite);
const invalid=await call('auth',{action:'register',workspace:'team',code:crypto.randomUUID()});assert.equal(invalid.status,400);assert.equal(invalid.cookie,'');
const responder=await call('auth',{action:'register',workspace:'team',code:' '+code.toUpperCase()+'\n'});assert.equal(responder.status,201);assert.equal(responder.data.organisation.id,org.id);assert.ok(responder.data.signInId);
assert.equal((await call('auth',undefined,responder.cookie)).data.hasOrganisation,true);
const reporter=await call('auth',{action:'register',workspace:'personal'});assert.equal(reporter.status,201);
const result=await call('cases',{title:'A complaint received by the response team',description:'A detailed report to verify that a member joining with an invitation can review incoming cases on a different device.',org:org.id,category:'Other',priority:'Moderate'},reporter.cookie);assert.equal(result.status,201);const id=result.data.id;
for(const cookie of [admin.cookie,responder.cookie]){const workspace=await call('workspace',undefined,cookie);assert.ok(workspace.data.cases.some(record=>record.id===id));assert.equal(workspace.data.organisations.find(item=>item.id===org.id).caseCount,1);}
assert.equal((await call('workspace',{action:'join',code},responder.cookie)).status,200);
assert.equal((await call('workspace',{action:'invite',org:org.id},responder.cookie)).status,403);
const before=await call('cases/'+id,undefined,reporter.cookie);
assert.equal((await call('cases/'+id,{action:'message',message:'We have received your concern.'},responder.cookie)).status,200);
const after=await call('cases/'+id,undefined,reporter.cookie);assert.ok(after.data.record.updated>=before.data.record.updated);assert.ok(after.data.history.some(event=>event.content==='We have received your concern.'));
const responderDevice2=await call('auth',{action:'login',signInId:responder.data.signInId});assert.equal(responderDevice2.status,200);assert.notEqual(responderDevice2.cookie,responder.cookie);assert.equal((await call('cases/'+id,undefined,responderDevice2.cookie)).status,200);
const reporterDevice2=await call('auth',{action:'login',signInId:reporter.data.signInId});assert.equal((await call('cases/'+id,undefined,reporterDevice2.cookie)).data.record.mine,true);
assert.equal((await call('cases/'+id,{action:'update',status:'In progress',priority:'High',category:'Other',note:'The response team is working on this case.'},responderDevice2.cookie)).status,200);
assert.equal((await call('cases/'+id,undefined,reporterDevice2.cookie)).data.record.status,'In progress');
const replacement=await call('workspace',{action:'invite',org:org.id},admin.cookie);assert.equal(replacement.status,200);assert.notEqual(replacement.data.invite,code);
assert.equal((await call('workspace',{action:'join',code},reporter.cookie)).status,400);
assert.equal((await call('cases/'+id,undefined,responder.cookie)).status,200);
assert.equal((await call('workspace',{action:'join',code:replacement.data.invite},reporter.cookie)).status,200);
assert.equal((await call('auth',{action:'logout'},responderDevice2.cookie)).status,200);assert.equal((await call('workspace',undefined,responderDevice2.cookie)).status,401);assert.equal((await call('workspace',undefined,responder.cookie)).status,200);
if(process.env.TEST_DB_PATH){const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(process.env.TEST_DB_PATH,{readOnly:true});try{const members=db.prepare('SELECT account,COUNT(*) AS n FROM members WHERE org = ? GROUP BY account').all(org.id);assert.ok(members.every(row=>row.n===1));assert.equal(db.prepare('SELECT COUNT(*) AS n FROM private_accounts').get().n,3);const records=JSON.stringify([db.prepare('SELECT * FROM private_accounts').all(),db.prepare('SELECT * FROM private_sessions').all()]);for(const account of [admin,responder,reporter])assert.ok(!records.includes(account.data.signInId));}finally{db.close();}}
console.log('PASS: invited responder signup, clear invalid-code errors, idempotent membership, organisation folder counts, independent-device sessions, case updates and messaging, administrator-only code replacement, existing member access, and session revocation.');
