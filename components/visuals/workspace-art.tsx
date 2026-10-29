import { useId } from 'react';

/** Decorative artwork only; case counts and progress remain driven by real data. */
export function VoiceWave({ compact = false }: { compact?: boolean }) {
  const heights = [12, 22, 16, 36, 52, 30, 64, 44, 76, 54, 90, 66, 46, 72, 52, 32, 58, 38, 24, 42, 18, 28, 12];
  return <div className={'voice-wave' + (compact ? ' compact-wave' : '')} aria-hidden="true">
    {heights.map((height, index) => <span key={index} style={{ height: `${height}%`, animationDelay: `${index * -0.13}s` }} />)}
  </div>;
}

export function ConcernIllustration() {
  const gradient = useId();
  return <svg className="concern-illustration" viewBox="0 0 220 140" fill="none" aria-hidden="true">
    <defs><linearGradient id={gradient} x1="60" y1="30" x2="170" y2="130" gradientUnits="userSpaceOnUse"><stop stopColor="#d9eee8"/><stop offset="1" stopColor="#cce7d8"/></linearGradient></defs>
    <ellipse cx="110" cy="125" rx="76" ry="7" fill="#e8edfc"/>
    <circle cx="110" cy="68" r="57" fill="#f0f7ee"/>
    <circle cx="110" cy="68" r="66" stroke="#d6e8de" strokeDasharray="3 7"/>
    <g className="illustration-leaf" stroke="#9aa8dd" strokeWidth="1.5"><path d="M47 121C47 98 33 89 29 77M46 106C33 108 24 101 25 93C38 91 44 97 46 106Z" fill="#c2e2d6"/><path d="M41 96C52 95 57 87 53 80C43 82 39 88 41 96Z" fill="#cce7d8"/></g>
    <g className="illustration-letter"><rect x="71" y="26" width="80" height="83" rx="9" fill="white" stroke="#c2e2d6"/><rect x="84" y="41" width="25" height="5" rx="2.5" fill="#94cabc"/><path d="M84 56H136M84 65H136M84 74H121" stroke="#d6e8de" strokeWidth="4" strokeLinecap="round"/>
    <path d="M58 70L110 101L162 70V113C162 119 158 122 152 122H68C62 122 58 119 58 113V70Z" fill={`url(#${gradient})`} stroke="#94cabc"/><path d="M59 118L94 92M161 118L126 92" stroke="#94cabc" strokeLinecap="round"/></g>
    <g className="illustration-spark"><path d="M174 35V47M168 41H180M43 45V53M39 49H47" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/><circle cx="177" cy="90" r="4" fill="#a9d5c8"/><circle cx="61" cy="24" r="3" fill="#94cabc"/></g>
    <g className="illustration-badge"><circle cx="153" cy="100" r="18" fill="#ecfdf5" stroke="white" strokeWidth="4"/><path d="M145 100L151 106L161 94" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></g>
  </svg>;
}

export function StatMotif({ kind }: { kind: string }) {
  return <svg className="stat-motif" viewBox="0 0 110 48" fill="none" aria-hidden="true">
    {kind === 'purple' ? <><circle cx="63" cy="24" r="17" stroke="currentColor"/><circle cx="63" cy="24" r="27" stroke="currentColor" strokeDasharray="2 5"/><path d="M56 24L61 29L71 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></> : <>{[12, 23, 17, 31, 25, 39, 32, 45].map((h, i) => <rect key={i} className="motif-bar" x={i * 13} y={48 - h} width="7" height={h} rx="3.5" fill="currentColor" style={{ animationDelay: `${i * 60}ms` }}/>)}</>}
  </svg>;
}
