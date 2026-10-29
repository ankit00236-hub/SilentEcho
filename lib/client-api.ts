export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch('/api/' + path, { method, cache:'no-store', credentials:'same-origin', headers: body instanceof FormData ? {} : body ? { 'Content-Type': 'application/json' } : {}, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new ApiError(data.error || 'Unable to complete this request. Please try again.', response.status);
  return data as T;
}
export type Organisation = { id: string; name: string; kind: string; member: boolean; canInvite?:boolean; caseCount?:number };
export type CaseRecord = { id: string; title: string; description: string; org: string; status: string; priority: string; category: string; created: string; updated: string; mine: boolean };
export type CaseDetail = { record: CaseRecord; canAct: boolean; history: { id: string; actor: string; content: string; created: string; kind: string }[]; files: { id: string; name: string; size: number }[] };
export const categories = ['Bullying','Harassment','Discrimination','Academic issue','Emotional distress','Other'];
export const priorities = ['Low','Moderate','High','Critical'];
export const displayDate = (value: string) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export async function endCurrentSession(){
  await api<{platformSignOut:boolean}>('auth','POST',{action:'logout'}).then(result=>{
    window.dispatchEvent(new Event('silentecho-session-change'));
    if('BroadcastChannel' in window){const channel=new BroadcastChannel('silentecho-session');channel.postMessage('signed-out');channel.close();}
    window.location.replace(result.platformSignOut?'/signout-with-chatgpt?return_to=%2F':'/');
  });
}
