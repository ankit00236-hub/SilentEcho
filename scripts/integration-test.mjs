import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
if(!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Run only against an isolated local test server.');
const cookies=new Map(),credentials=[];
async function call(path,user,method='GET',body){const r=await fetch(base+'/api/'+path,{method,headers:{...(user?{cookie:cookies.get(user)}:{}),origin:base,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});let data;try{data=await r.json();}catch{data=null;}return {status:r.status,data};}
const suffix=crypto.randomUUID(),staff='staff-'+suffix,reporter='reporter-'+suffix,stranger='stranger-'+suffix;
for(const user of [staff,reporter,stranger]){
 const response=await fetch(base+'/api/auth',{method:'POST',headers:{origin:base,'Content-Type':'application/json'},body:JSON.stringify({action:'register',workspace:'personal'})});
 assert.equal(response.status,201);credentials.push((await response.json()).signInId);cookies.set(user,response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; '));
}
assert.equal((await call('workspace',null)).status,401);
const org=await call('workspace',staff,'POST',{action:'create',name:'Test institution '+suffix,kind:'Educational institution'});assert.equal(org.status,201);assert.ok(org.data.invite);
const created=await call('cases',reporter,'POST',{org:org.data.id,title:'Confidential test complaint',description:'This is a detailed report for an isolated integration test of the reporting workflow.',category:'Other',priority:'Moderate'});assert.equal(created.status,201);const id=created.data.id;
assert.equal((await call('cases/'+id,stranger)).status,404);
assert.equal((await call('cases/'+id,stranger,'POST',{action:'message',message:'unauthorised'})).status,404);
assert.equal((await call('cases/'+id,reporter,'POST',{action:'update',status:'Resolved',category:'Other',priority:'Low',note:'forbidden'})).status,403);
const reporterWorkspace=await call('workspace',reporter);assert.equal(reporterWorkspace.status,200);assert.ok(reporterWorkspace.data.cases.some(c=>c.id===id&&c.mine));
const strangerWorkspace=await call('workspace',stranger);assert.ok(!strangerWorkspace.data.cases.some(c=>c.id===id));
const staffView=await call('cases/'+id,staff);assert.equal(staffView.status,200);assert.equal(staffView.data.record.title,'Confidential test complaint');assert.equal(staffView.data.record.mine,false);assert.ok(!JSON.stringify(staffView.data).includes(reporter));assert.ok(!('owner' in staffView.data.record));
assert.equal((await call('cases/'+id,reporter,'POST',{action:'message',message:'A private follow-up message.'})).status,200);
for(const status of ['Under review','In progress']){
 const note='Case tracking check: '+status;
 assert.equal((await call('cases/'+id,staff,'POST',{action:'update',status,category:'Other',priority:'Moderate',note})).status,200);
 const tracked=await call('cases/'+id,reporter);assert.equal(tracked.data.record.status,status);assert.ok(tracked.data.history.some(e=>e.kind==='status'&&e.content.includes(note)));
 assert.ok(!('owner' in tracked.data.record));assert.ok(!JSON.stringify(tracked.data).includes(reporter));
}
assert.equal((await call('cases/'+id,staff,'POST',{action:'update',status:'Resolved',category:'Other',priority:'Low',note:'We reviewed the report and documented the resolution.'})).status,200);
const form=new FormData();form.set('file',new File(['encrypted evidence content'],'test.txt',{type:'text/plain'}));const upload=await call('cases/'+id+'/evidence',reporter,'POST',form);assert.equal(upload.status,201);
assert.equal((await call('cases/'+id+'/evidence/'+upload.data.id,stranger)).status,404);
const downloaded=await fetch(base+'/api/cases/'+id+'/evidence/'+upload.data.id,{headers:{cookie:cookies.get(staff)}});assert.equal(downloaded.status,200);assert.equal(await downloaded.text(),'encrypted evidence content');
const final=await call('cases/'+id,reporter);assert.equal(final.data.record.status,'Resolved');assert.equal(final.data.files.length,1);assert.ok(final.data.history.some(e=>e.content==='A private follow-up message.'));
assert.equal((await call('workspace',stranger,'POST',{action:'join',code:crypto.randomUUID()})).status,400);
assert.equal((await call('workspace',stranger,'POST',{action:'join',code:org.data.invite})).status,200);assert.equal((await call('cases/'+id,stranger)).status,200);
const badOrigin=await fetch(base+'/api/cases',{method:'POST',headers:{origin:'https://elsewhere.test','Content-Type':'application/json','oai-authenticated-user-id':reporter,'oai-authenticated-user-email':'a@example.test'},body:'{}'});assert.equal(badOrigin.status,403);
if(process.env.TEST_DB_PATH){
 const {DatabaseSync}=await import('node:sqlite');
 const db=new DatabaseSync(process.env.TEST_DB_PATH,{readOnly:true});
 try{
  const stored=db.prepare('SELECT * FROM cases WHERE id = ?').get(id);assert.ok(stored);
  assert.match(stored.owner,/^[A-Za-z0-9+/]{43}=$/,'Case ownership must be a keyed reference');
  const rows=[stored,...db.prepare('SELECT * FROM events WHERE case_id = ?').all(id),...db.prepare('SELECT * FROM evidence WHERE case_id = ?').all(id),...db.prepare('SELECT * FROM organisations WHERE id = ?').all(org.data.id),...db.prepare('SELECT * FROM members WHERE org = ?').all(org.data.id)];
  const storedText=JSON.stringify(rows);
  for(const identity of [reporter,staff,stranger,...credentials,...cookies.values()])assert.ok(!storedText.includes(identity),'Raw authenticated identity must not be stored');
  for(const plaintext of ['Confidential test complaint','A private follow-up message.','We reviewed the report and documented the resolution.','test.txt'])assert.ok(!storedText.includes(plaintext),'Sensitive content must be encrypted at rest');
  assert.ok(db.prepare('SELECT actor FROM events WHERE case_id = ?').all(id).every(e=>['Reporter','Organisation'].includes(e.actor)));
  console.log('PASS: direct database inspection confirms pseudonymous ownership, role-only audit actors, encrypted content and no raw authenticated account IDs or emails.');
 }finally{db.close();}
}
console.log('PASS: authentication, organisation registration and invitation, case submission, reporter progress tracking, identity separation, cross-account isolation, role restrictions, secure messaging, resolution, evidence upload/download and CSRF origin protection.');
