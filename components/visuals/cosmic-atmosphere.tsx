'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';

/** Ambient motion stays outside the content; pointer coordinates never enter React state. */
export function CosmicAtmosphere({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const root=stage.current;if(!root)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
    let frame=0,active:HTMLElement|null=null;
    const target={x:0,y:0},current={x:0,y:0};
    function resetSurface(){if(!active)return;for(const property of ['--tilt-x','--tilt-y','--surface-shift-x','--surface-shift-y','--shine-x','--shine-y'])active.style.removeProperty(property);active=null;}
    function stop(){cancelAnimationFrame(frame);frame=0;resetSurface();root!.classList.remove('has-cursor');root!.style.setProperty('--sky-x','0px');root!.style.setProperty('--sky-y','0px');}
    function draw(){
      frame=0;current.x+=(target.x-current.x)*.13;current.y+=(target.y-current.y)*.13;
      root!.style.setProperty('--sky-x',`${current.x.toFixed(2)}px`);root!.style.setProperty('--sky-y',`${current.y.toFixed(2)}px`);
      if(Math.abs(target.x-current.x)+Math.abs(target.y-current.y)>.05)frame=requestAnimationFrame(draw);
    }
    function move(event:PointerEvent){
      if(paused||reduced.matches||!fine.matches||event.pointerType!=='mouse')return;
      target.x=(event.clientX/innerWidth-.5)*26;target.y=(event.clientY/innerHeight-.5)*20;
      root!.classList.add('has-cursor');root!.style.setProperty('--cursor-x',`${event.clientX}px`);root!.style.setProperty('--cursor-y',`${event.clientY}px`);
      const surface=event.target instanceof Element?event.target.closest<HTMLElement>('[data-reactive]'):null;
      if(active!==surface){resetSurface();active=surface;}
      if(active){const bounds=active.getBoundingClientRect(),x=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width)),y=Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height));active.style.setProperty('--tilt-x',`${((.5-y)*2.6).toFixed(2)}deg`);active.style.setProperty('--tilt-y',`${((x-.5)*2.6).toFixed(2)}deg`);active.style.setProperty('--surface-shift-x',`${((x-.5)*14).toFixed(2)}px`);active.style.setProperty('--surface-shift-y',`${((y-.5)*10).toFixed(2)}px`);active.style.setProperty('--shine-x',`${(x*100).toFixed(1)}%`);active.style.setProperty('--shine-y',`${(y*100).toFixed(1)}%`);}
      if(!frame)frame=requestAnimationFrame(draw);
    }
    function preference(){stop();}
    root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerleave',stop);reduced.addEventListener('change',preference);fine.addEventListener('change',preference);
    return()=>{stop();root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',stop);reduced.removeEventListener('change',preference);fine.removeEventListener('change',preference);};
  },[paused]);
  return <div ref={stage} className={'public-site cosmic-stage'+(paused?' motion-paused':'')}><div className="cosmic-background" aria-hidden="true"><div className="nebula-parallax"><div className="supplied-wave-background"/><div className="nebula-cloud cloud-lilac"/><div className="nebula-cloud cloud-blue"/><div className="nebula-cloud cloud-peach"/><div className="nebula-stars"/></div><div className="cosmic-cursor-glow"/><div className="cosmic-paper-veil"/></div>{children}<button className="cosmic-motion-toggle" type="button" aria-pressed={paused} onClick={()=>setPaused(!paused)} aria-label={paused?'Resume ambient motion':'Pause ambient motion'}>{paused?<Play size={12}/>:<Pause size={12}/>}<span>{paused?'Resume motion':'Pause motion'}</span></button></div>;
}
