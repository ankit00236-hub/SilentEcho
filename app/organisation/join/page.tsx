import {SiteShell} from '../../../components/public/site-shell';
import {JoinTeamForm} from '../../../components/team/join-team-form';
import {ArrowLeft,ShieldCheck} from 'lucide-react';
export const metadata={title:'Join a response team — SilentEcho'};
export default function Page(){return <SiteShell><section className="team-join-page"><a className="auth-back" href="/organisation/signin"><ArrowLeft size={15}/>Organisation sign in</a><span className="public-eyebrow">A PLACE FOR EVERY TRUSTED RESPONDER</span><h1>You have a team.<br/><em>Here’s how to join.</em></h1><p className="team-join-intro">An invitation code connects your own private account to the right organisation. Once you join, its incoming complaints appear in your case inbox.</p><div className="team-join-card modal"><JoinTeamForm/></div><p className="team-join-privacy"><ShieldCheck size={15}/>Joining a team grants access to its cases. Keep invitations within your authorised response team.</p></section></SiteShell>;}
