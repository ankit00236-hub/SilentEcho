import type { Metadata } from 'next';
import './globals.css';
import './brand-theme.css';
export const metadata: Metadata={title:'SilentEcho — Your voice matters',description:'A confidential space to share concerns, find support, and build a safer community.',icons:{icon:'/favicon.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
