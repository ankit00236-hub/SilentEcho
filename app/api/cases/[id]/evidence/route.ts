import { context, access, event, runtimeEnv, fail } from '@/lib/server';
import { evidence, cases, events } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { seal, base64 } from '@/lib/crypto';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){let uploaded:string|undefined;try{
 const c=await context(request),{id}=await params,r=await access(c,id);
 if(Number(request.headers.get('content-length')||0)>3000000)throw new Error('413:Evidence must be smaller than 2 MB');
 const data=await request.formData(),file=data.get('file');
 if(!(file instanceof File)||file.size>2*1024*1024||file.size===0)throw new Error('400:Choose a file between 1 byte and 2 MB');
 if(!['application/pdf','image/jpeg','image/png','text/plain'].includes(file.type))throw new Error('400:Use a PDF, PNG, JPG, or text file');
 if(!runtimeEnv.BUCKET)throw new Error('503:Evidence storage unavailable');
 const fid=crypto.randomUUID(),raw=await file.arrayBuffer();
 await runtimeEnv.BUCKET.put(fid,await seal(base64(raw),c.key,fid));uploaded=fid;
 const eid=crypto.randomUUID(),now=new Date().toISOString();
 await c.db.batch([c.db.insert(evidence).values({id:fid,caseId:id,metadata:await seal(JSON.stringify({name:file.name.slice(0,200),type:file.type}),c.key,fid),size:file.size}),c.db.insert(events).values({id:eid,caseId:id,kind:'evidence',actor:r.owner===c.account?'Reporter':'Organisation',content:await seal('Evidence added',c.key,eid),created:now}),c.db.update(cases).set({updated:now}).where(eq(cases.id,id))]);return Response.json({id:fid},{status:201});
}catch(e){if(uploaded)await runtimeEnv.BUCKET?.delete(uploaded);return fail(e);}}
