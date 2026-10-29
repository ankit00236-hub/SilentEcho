'use client';
import {useEffect,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {api} from '../../lib/client-api';
import {EndSessionButton} from '../end-session-button';
export function SessionNavigation(){
  const [session,setSession]=useState<{authenticated:boolean;hasOrganisation:boolean}|null>(null);
  useEffect(()=>{let active=true;async function check(){try{const current=await api<{authenticated:boolean;hasOrganisation:boolean}>('auth');if(active)setSession(current);}catch{}}
    void check();window.addEventListener('focus',check);window.addEventListener('silentecho-session-change',check);return()=>{active=false;window.removeEventListener('focus',check);window.removeEventListener('silentecho-session-change',check);};
  },[]);
  return session?.authenticated?<div className="public-account-actions"><a className="public-signin" href={session.hasOrganisation?'/organisation':'/personal'}>Workspace<ArrowRight size={15}/></a><EndSessionButton/></div>:<a className="public-signin" href="/signin">Sign in<ArrowRight size={16}/></a>;
}
