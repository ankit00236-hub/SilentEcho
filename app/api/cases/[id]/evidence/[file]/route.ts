import { context, access, event, runtimeEnv, fail } from '@/lib/server';
import { evidence } from '@/db/schema';
import { unseal } from '@/lib/crypto';
import { eq, and } from 'drizzle-orm';
export async function GET(request:Request,{params}:{params:Promise<{id:string,file:string}>}){try{
 const c=await context(request),{id,file}=await params,r=await access(c,id);
 const [f]=await c.db.select().from(evidence).where(and(eq(evidence.id,file),eq(evidence.caseId,id)));if(!f)throw new Error('404:File not found');
 const object=await runtimeEnv.BUCKET?.get(file);if(!object)throw new Error('404:File not found');
 const meta=JSON.parse(await unseal(f.metadata,c.key,file));const data=await unseal(await object.text(),c.key,file);
 await event(c,id,'access',r.owner===c.account?'Reporter':'Organisation','Evidence downloaded');
 return new Response(Uint8Array.from(atob(data),x=>x.charCodeAt(0)),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(meta.name)}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){return fail(e);}}
