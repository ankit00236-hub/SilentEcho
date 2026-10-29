export function normaliseInvitationCode(value: unknown) {
  if(typeof value!=='string'||value.length>100)throw new Error('400:Paste the organisation’s invitation code');
  const code=value.replace(/\s+/g,'').toLowerCase();
  if(code.startsWith('se-'))throw new Error('400:Use the team invitation code here, not your private sign-in ID');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(code))throw new Error('400:Paste the complete team invitation code, including its hyphens');
  return code;
}
