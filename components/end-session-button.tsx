'use client';
import {useState} from 'react';
import {LogOut} from 'lucide-react';
import {endCurrentSession} from '../lib/client-api';
export function EndSessionButton({iconOnly=false,className='end-session-button'}:{iconOnly?:boolean;className?:string}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function end(){setBusy(true);setError('');try{await endCurrentSession();}catch(error){setError((error as Error).message);setBusy(false);}}
  return <span className="end-session-control"><button type="button" className={className} disabled={busy} onClick={()=>void end()} aria-label={iconOnly?'Sign out':'End session'}><LogOut size={15}/>{!iconOnly&&<span>{busy?'Signing out…':'End session'}</span>}</button>{error&&<span className="session-end-error" role="alert">{error}</span>}</span>;
}
