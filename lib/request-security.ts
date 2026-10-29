/** Next.js normalises loopback URLs to localhost. The HTTP Host header keeps
 * the browser's actual host (including its port); use it for same-origin checks.
 * Forwarded host headers supplied by callers never grant write access. */
export function checkOrigin(request: Request) {
  const actual = new URL(request.url);
  const host = request.headers.get('host');
  if (host) {
    let parsed: URL;
    try { parsed = new URL(`${actual.protocol}//${host}`); }
    catch { throw new Error('403:Request origin rejected'); }
    if (parsed.host !== host.toLowerCase() || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('403:Request origin rejected');
    actual.host = parsed.host;
  }
  if (request.headers.get('origin') !== actual.origin) throw new Error('403:Request origin rejected');
}
