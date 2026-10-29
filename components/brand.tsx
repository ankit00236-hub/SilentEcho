export function Brand({ className='public-brand' }: { className?:string }) {
  return <a className={className} href="/" aria-label="SilentEcho home"><span className="brand-mark" aria-hidden="true"><img src="/images/silentecho-logo.webp" width={84} height={84} alt=""/></span><span className="brand-wordmark" aria-hidden="true"><img src="/images/silentecho-logo.webp" width={188} height={188} alt=""/></span><span className="sr-only">SilentEcho</span></a>;
}
