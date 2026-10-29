import { getChatGPTUser } from '../../chatgpt-auth';
import { context, fail, input, field } from '../../../lib/server';
import { members, organisations } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { invitationOrganisation } from '../../../lib/team-service';
import { checkOrigin, endSession, findPrivateAccount, limitAuth, registerPrivateAccount, startSession, storageKey } from '../../../lib/private-auth';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await input(request), key = storageKey();
    if (body.action === 'logout') {
      const cookie = await endSession(request, key);
      return Response.json({ ok: true, platformSignOut: !!await getChatGPTUser() }, { headers: { 'Set-Cookie': cookie, 'Cache-Control': 'no-store' } });
    }
    if (body.action !== 'register' && body.action !== 'login') throw new Error('400:Unknown sign-in action');
    await limitAuth(request, key);
    if (body.action === 'register') {
      if (body.workspace !== undefined && !['personal','organisation','team'].includes(String(body.workspace))) throw new Error('400:Choose a valid workspace');
      const organisation = body.workspace === 'organisation' ? { name: field(body.organisationName,3,100), kind: field(body.organisationKind,2,60) } : undefined;
      const team = body.workspace === 'team' ? await invitationOrganisation(body.code,key) : undefined;
      const { id, signInId, ...extra } = await registerPrivateAccount(key, organisation, team?.id);
      return Response.json({ signInId, ...extra, ...(team?{organisation:{id:team.id,name:team.name}}:{}) }, { status: 201, headers: { 'Set-Cookie': await startSession(request, id, key), 'Cache-Control': 'no-store' } });
    }
    const account = await findPrivateAccount(body.signInId, key);
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': await startSession(request, account.id, key), 'Cache-Control': 'no-store' } });
  } catch (error) { return fail(error); }
}

export async function GET(request:Request){
  try{
    const c=await context(request);
    const [owned,joined]=await Promise.all([c.db.select({id:organisations.id}).from(organisations).where(eq(organisations.owner,c.account)).limit(1),c.db.select({id:members.id}).from(members).where(eq(members.account,c.account)).limit(1)]);
    return Response.json({authenticated:true,hasOrganisation:owned.length>0||joined.length>0},{headers:{'Cache-Control':'no-store'}});
  }catch(error){if(error instanceof Error&&error.message.startsWith('401:'))return Response.json({authenticated:false,hasOrganisation:false},{headers:{'Cache-Control':'no-store'}});return fail(error);}
}
