import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { context } from './server';
import { Workspace } from '../components/workspace';

export async function WorkspacePage({ workspace, view='Overview' }: { workspace:'personal'|'organisation';view?:'Overview'|'My complaints'|'Organisations' }) {
  try { await context(new Request('https://silentecho.local/',{headers:await headers()})); }
  catch(error){if(error instanceof Error&&error.message.startsWith('401:'))redirect('/'+workspace+'/signin');else throw error;}
  return <Workspace workspace={workspace} view={view}/>;
}
