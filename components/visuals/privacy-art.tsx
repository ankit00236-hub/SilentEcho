'use client';
import { Check, LockKeyhole } from 'lucide-react';

export function PrivacyArt({ kind='personal' }: {kind?:'personal'|'community'}) {
  const community=kind==='community';
  return <div className={'privacy-art-scene brand-illustration '+(community?'community-illustration':'personal-illustration')} data-reactive><div className="illustration-parallax"><img className="supplied-illustration" src={community?'/images/community-conversation.webp':'/images/private-space.webp'} width={community?1254:1855} height={community?1254:848} alt={community?'Three people listening to one another in a supportive conversation.':'A person sits inside a protective speech bubble, surrounded by soft teal leaves.'} decoding="async"/><span className="illustration-light" aria-hidden="true"/></div><div className="floating-tag tag-one"><LockKeyhole size={14}/>Your space. Your privacy.</div><div className="floating-tag tag-two"><span className="green-check"><Check size={12}/></span>{community?'Listening makes a difference':'Every voice deserves to be heard'}</div><span className="scene-caption">{community?'A thoughtful response starts with listening.':'A quiet space. A stronger voice.'}</span></div>;
}
