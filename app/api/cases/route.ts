import { context, fail, input, field, categories, priorities } from '@/lib/server';
import { cases, organisations, events } from '@/db/schema';
import { seal } from '@/lib/crypto';
import { eq } from 'drizzle-orm';
export async function POST(request:Request) {try {
 const c=await context(request),b=await input(request);const title=field(b.title,5,140),description=field(b.description,30,15000),org=field(b.org),category=field(b.category),priority=field(b.priority);
 if(!categories.includes(category)||!priorities.includes(priority))throw new Error('400:Invalid category or priority');
 if(!(await c.db.select().from(organisations).where(eq(organisations.id,org)))[0])throw new Error('400:Choose an organisation');
 const id=crypto.randomUUID(),eid=crypto.randomUUID(),now=new Date().toISOString();
 await c.db.batch([c.db.insert(cases).values({id,owner:c.account,org,content:await seal(JSON.stringify({title,description}),c.key,id),category,priority,status:'Submitted',created:now,updated:now}),c.db.insert(events).values({id:eid,caseId:id,kind:'status',actor:'Reporter',content:await seal('Complaint submitted securely',c.key,eid),created:now})]);
 return Response.json({id},{status:201});
 }catch(e){return fail(e);}}
