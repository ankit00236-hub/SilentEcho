import { context, fail, input, field, isMember, publicCase } from '@/lib/server';
import { organisations, members, cases } from '@/db/schema';
import { fingerprint, seal } from '@/lib/crypto';
import { invitationOrganisation } from '@/lib/team-service';
import { eq, or, inArray, desc } from 'drizzle-orm';
export async function GET(request:Request) {try {
 const c=await context(request);const orgs=await c.db.select().from(organisations);const memberships:string[]=[];for(const o of orgs)if(await isMember(c,o.id))memberships.push(o.id);
 const allowed=await c.db.select().from(cases).where(memberships.length?or(eq(cases.owner,c.account),inArray(cases.org,memberships)):eq(cases.owner,c.account)).orderBy(desc(cases.updated));
 return Response.json({organisations:orgs.map(o=>({id:o.id,name:o.name,kind:o.kind,member:memberships.includes(o.id),canInvite:o.owner===c.account,caseCount:allowed.filter(record=>record.org===o.id).length})),cases:await Promise.all(allowed.map(r=>publicCase(c,r)))},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return fail(e);}}
export async function POST(request:Request) {try {
 const c=await context(request);const b=await input(request);
 if(b.action==='create') {
 const id=crypto.randomUUID(),code=crypto.randomUUID();const name=field(b.name,3,100),kind=field(b.kind,2,60);
 await c.db.insert(organisations).values({id,name,kind,owner:c.account,inviteHash:await fingerprint('invite:'+code,c.key),created:new Date().toISOString()});return Response.json({id,invite:code},{status:201});
 }
 if(b.action==='join') {
 const org=await invitationOrganisation(b.code,c.key);
 if(!await isMember(c,org.id))await c.db.insert(members).values({id:crypto.randomUUID(),org:org.id,account:c.account}).onConflictDoNothing({target:[members.org,members.account]});return Response.json({id:org.id,name:org.name});
 }
 if(b.action==='invite'){
 const id=field(b.org);const [org]=await c.db.select().from(organisations).where(eq(organisations.id,id));
 if(!org||org.owner!==c.account)throw new Error('403:Only the organisation administrator can create a team invitation');
 const invite=crypto.randomUUID();await c.db.update(organisations).set({inviteHash:await fingerprint('invite:'+invite,c.key)}).where(eq(organisations.id,id));return Response.json({invite,name:org.name});
 }
 throw new Error('400:Unknown action');
 }catch(e){return fail(e);}}
