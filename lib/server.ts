import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { cases, members, organisations, events } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { fingerprint, seal, unseal } from './crypto';
import { caseStages } from './case-progress';
import { privateAccount, storageKey } from './private-auth';
export const runtimeEnv = env as typeof env & { DATA_KEY?:string };
export async function context(request:Request) {
 if (!['GET','HEAD'].includes(request.method)) {
  const origin=request.headers.get('origin'); if(!origin || origin!==new URL(request.url).origin) throw new Error('403:Request origin rejected');
 }
 const key=storageKey(),privateUser=await privateAccount(request,key);
 if(privateUser)return {db:getDb(),account:privateUser.owner,key};
 const user=await getChatGPTUser(); if(!user) throw new Error('401:Please sign in to continue');
 return {db:getDb(),account:await fingerprint('account:'+user.userId,key),key};
}
export async function isMember(c:Awaited<ReturnType<typeof context>>,org:string) {
 const [o]=await c.db.select().from(organisations).where(eq(organisations.id,org));
 if(!o) return false;
 if(o.owner===c.account) return true;
 return !!(await c.db.select().from(members).where(and(eq(members.org,org),eq(members.account,c.account))))[0];
}
export async function access(c:Awaited<ReturnType<typeof context>>,id:string) {
 const [record]=await c.db.select().from(cases).where(eq(cases.id,id));
 if(!record || (record.owner!==c.account && !await isMember(c,record.org))) throw new Error('404:Case not found');
 return record;
}
export async function event(c:Awaited<ReturnType<typeof context>>,id:string,kind:string,actor:string,content:string) {
 const eid=crypto.randomUUID();return c.db.insert(events).values({id:eid,caseId:id,kind,actor,content:await seal(content,c.key,eid),created:new Date().toISOString()});
}
export async function publicCase(c:Awaited<ReturnType<typeof context>>,r:typeof cases.$inferSelect) {
 const {owner,content,...rest}=r;
 return {...rest,...JSON.parse(await unseal(content,c.key,r.id)),mine:owner===c.account};
}
export function fail(error:unknown) {
 const m=error instanceof Error?error.message:'';const match=m.match(/^(400|401|403|404|409|413|429|503):(.+)$/);
 return Response.json({error:match?.[2]||'Unable to complete this request. Please try again.'},{status:match?Number(match[1]):500,headers:{'Cache-Control':'no-store'}});
}
export async function input(request:Request):Promise<Record<string,unknown>> { if(Number(request.headers.get('content-length')||0)>100000) throw new Error('413:Request too large');try{const data:unknown=await request.json();if(!data||typeof data!=='object'||Array.isArray(data))throw new Error();return data as Record<string,unknown>;}catch{throw new Error('400:Invalid request');} }
export function field(v:unknown,min=1,max=200) {if(typeof v!=='string'||v.trim().length<min||v.length>max)throw new Error('400:Please check the required fields and their lengths');return v.trim();}
export const categories=['Bullying','Harassment','Discrimination','Academic issue','Emotional distress','Other'];
export const statuses: readonly string[]=caseStages;
export const priorities=['Low','Moderate','High','Critical'];
