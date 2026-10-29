import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Check, Copy, Download, KeyRound, ShieldCheck } from 'lucide-react';

export function PrivateAccountForm({ register, busy, switchHref, onSubmit, workspace }: {
  register: boolean;
  busy: boolean;
  switchHref: string;
  workspace: 'personal' | 'organisation';
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const org=workspace==='organisation', [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  return <><span className="modal-symbol"><KeyRound size={25}/></span><div className="eyebrow">YOUR ACCOUNT. YOUR PRIVATE ID.</div><h2>{register ? org ? 'Register your organisation.' : 'Create your personal account.' : org ? 'Welcome back, team.' : 'Welcome back.'}</h2><p className="modal-intro">{register ? org ? 'Tell us about your organisation. We’ll create your administrator account and a private sign-in ID. No personal name or email is required.' : 'No name, email, or phone number required. We’ll generate a private sign-in ID for you to save and use whenever you return.' : org ? 'Enter your private sign-in ID to access your team’s workspace. Organisation membership controls which cases you can review.' : 'Enter the private sign-in ID you saved when creating your account. Your complaints and their progress will be waiting for you.'}</p><form method="post" action="/api/auth" onSubmit={onSubmit}>
    {register && org && <><label>Organisation name<input name="organisationName" required minLength={3} maxLength={100} autoComplete="organization" placeholder="Your institution, company, or team"/></label><label>Organisation type<select name="organisationKind">{['Educational institution','Company','Non-profit','Community','Other'].map(kind=><option key={kind}>{kind}</option>)}</select></label></>}
    {!register && <label>Your private sign-in ID<input name="signInId" type="password" required minLength={46} maxLength={46} autoComplete="current-password" spellCheck={false} autoCapitalize="none" placeholder="SE-…"/><small className="auth-hint">Use your account’s secret sign-in ID, rather than a Case ID.</small></label>}
    {register && org && <p className="auth-hint organisation-signup-note">Organisation registration is self-service and does not verify institutional affiliation.</p>}
    {register && <div className="info-box compact"><ShieldCheck size={18}/><span>Your database record contains a keyed digest of your sign-in ID. The readable ID is shown only when you create the account.</span></div>}
    <button type="submit" className="primary full" disabled={busy||!ready}>{busy ? register ? 'Creating account…' : 'Signing in…' : register ? org ? 'Create organisation account' : 'Generate my sign-in ID' : 'Sign in securely'}<ArrowRight size={16}/></button>
  </form><div className="auth-switch">{register ? 'Already have a private sign-in ID?' : 'New to SilentEcho?'}<a className="text-button" href={switchHref} aria-disabled={busy} onClick={event=>{if(busy)event.preventDefault();}}>{register ? 'Sign in' : 'Create an account'}<ArrowRight size={13}/></a></div></>;
}

export function SaveSignInId({ signInId, onContinue }: { signInId: string; onContinue: () => void }) {
  const [saved, setSaved] = useState(false), [copied, setCopied] = useState(false), [copyError, setCopyError] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(signInId); setCopied(true); setCopyError(''); }
    catch { setCopyError('Select and copy the ID above, or use Download ID.'); }
  }
  function download() {
    const blob = new Blob([`SilentEcho private sign-in ID\n\n${signInId}\n\nKeep this ID secret. It grants access to your account.\nUse it to sign in to SilentEcho and track your complaints.\nThis is not a Case ID.\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'silentecho-private-sign-in-id.txt'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <><span className="modal-symbol"><ShieldCheck size={25}/></span><div className="eyebrow">ACCOUNT CREATED</div><h2>Save your private sign-in ID.</h2><p className="modal-intro">This ID is your secret credential. Keep it somewhere safe and use it to sign in again. Anyone who has it can access your account.</p><label>Your private sign-in ID<input className="generated-signin-id" type="text" readOnly value={signInId} onFocus={event => event.currentTarget.select()} aria-label="Generated private sign-in ID" spellCheck={false}/></label><div className="save-id-actions"><button type="button" className="secondary" onClick={copy}>{copied ? <Check size={15}/> : <Copy size={15}/>}<span role="status">{copied ? 'Copied' : 'Copy ID'}</span></button><button type="button" className="secondary" onClick={download}><Download size={15}/>Download ID</button></div>{copyError && <p className="auth-hint" role="status">{copyError}</p>}<div className="info-box">We cannot retrieve your sign-in ID from the database. Without your saved ID, you cannot sign back in after your session ends.</div><label className="checkbox"><input type="checkbox" checked={saved} onChange={event => setSaved(event.target.checked)}/>I have saved my private sign-in ID.</label><button type="button" className="primary full" disabled={!saved} onClick={onContinue}>Continue to my workspace<ArrowRight size={16}/></button></>;
}
