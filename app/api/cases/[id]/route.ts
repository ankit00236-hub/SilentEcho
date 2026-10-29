import { context, access, isMember, publicCase, event, fail, input, field, statuses, priorities, categories } from '@/lib/server';
import { cases, events, evidence } from '@/db/schema';
import { unseal, seal } from '@/lib/crypto';
import { eq, asc } from 'drizzle-orm';
type Params={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Params){try{
 const {id}=await params,c=await context(request),r=await access(c,id);
 const history=await c.db.select().from(events).where(eq(events.caseId,id)).orderBy(asc(events.created));
 const files=await c.db.select().from(evidence).where(eq(evidence.caseId,id));
 await event(c,id,'access',r.owner===c.account?'Reporter':'Organisation','Case viewed');
 return Response.json({record:await publicCase(c,r),canAct:await isMember(c,r.org),history:await Promise.all(history.filter(e=>e.kind!=='access').map(async e=>({...e,content:await unseal(e.content,c.key,e.id)}))),files:await Promise.all(files.map(async f=>({id:f.id,size:f.size,...JSON.parse(await unseal(f.metadata,c.key,f.id))})))},{headers:{'Cache-Control':'no-store'}});
}catch(e){return fail(e);}}
export async function POST(request:Request,{params}:Params){try{
 const {id}=await params,c=await context(request),r=await access(c,id),b=await input(request);const staff=await isMember(c,r.org),actor=r.owner===c.account?'Reporter':'Organisation';
 if(b.action==='message'){const message=field(b.message,1,5000),eid=crypto.randomUUID(),now=new Date().toISOString();await c.db.batch([c.db.insert(events).values({id:eid,caseId:id,kind:'message',actor,content:await seal(message,c.key,eid),created:now}),c.db.update(cases).set({updated:now}).where(eq(cases.id,id))]);}
 else if(b.action==='update'){
 if(!staff)throw new Error('403:Organisation membership required');
 const status=field(b.status),priority=field(b.priority),category=field(b.category),note=field(b.note,5,3000);
 if(!statuses.includes(status)||!priorities.includes(priority)||!categories.includes(category))throw new Error('400:Invalid case update');
 const eid=crypto.randomUUID(),now=new Date().toISOString();
 await c.db.batch([c.db.update(cases).set({status,priority,category,updated:now}).where(eq(cases.id,id)),c.db.insert(events).values({id:eid,caseId:id,actor:'Organisation',kind:'status',content:await seal(`${status} · ${priority} priority · ${category}\n${note}`,c.key,eid),created:now})]);
 }else throw new Error('400:Unknown action');
 return Response.json({ok:true});
}catch(e){return fail(e);}}
