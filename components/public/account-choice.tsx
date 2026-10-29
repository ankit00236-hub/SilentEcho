import { ArrowRight, Building2, Fingerprint } from 'lucide-react';
import { SiteShell } from './site-shell';
export function AccountChoice({signup=false}:{signup?:boolean}) {
  const action=signup?'signup':'signin';
  return <SiteShell><section className="account-choice"><span className="public-eyebrow">YOUR SPACE IN SILENTECHO</span><h1>{signup?'Where would you like to start?':'Welcome back.'}</h1><p>Choose the workspace you want to {signup?'create':'sign in to'}.</p><div className="choice-grid"><a href={'/personal/'+action}><Fingerprint size={32}/><h2>Personal account</h2><p>Share concerns privately and track your cases.</p><span>{signup?'Personal signup':'Personal sign in'}<ArrowRight size={17}/></span></a><a href={'/organisation/'+action}><Building2 size={32}/><h2>Organisation account</h2><p>Review concerns and respond with your team.</p><span>{signup?'Organisation signup':'Organisation sign in'}<ArrowRight size={17}/></span></a></div><a className="public-inline-link" href={signup?'/signin':'/signup'}>{signup?'Already have an account? Sign in':'New to SilentEcho? Create an account'}<ArrowRight size={16}/></a></section></SiteShell>;
}
