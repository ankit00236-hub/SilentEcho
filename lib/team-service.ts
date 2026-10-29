import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { organisations } from '../db/schema';
import { fingerprint } from './crypto';
import { normaliseInvitationCode } from './team-invites';
export async function invitationOrganisation(value:unknown,key:string){
  const code=normaliseInvitationCode(value);
  const [organisation]=await getDb().select().from(organisations).where(eq(organisations.inviteHash,await fingerprint('invite:'+code,key)));
  if(!organisation)throw new Error('400:This invitation code is invalid or has been replaced. Ask your administrator for the current code');
  return organisation;
}
