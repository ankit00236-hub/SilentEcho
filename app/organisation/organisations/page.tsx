import type { Metadata } from 'next';
import { WorkspacePage } from '../../../lib/workspace-page';
export const dynamic='force-dynamic';
export const metadata: Metadata = {title:'Organisation · Organisations — SilentEcho'};
export default function Page() {return <WorkspacePage workspace="organisation" view="Organisations"/>;}
