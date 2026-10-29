import { Check, Clock3, LockKeyhole, RefreshCw } from 'lucide-react';
import { caseProgress, type ProgressEvent } from '../lib/case-progress';

export function CaseTracker({ record, history, busy, onRefresh }: {
  record: { id: string; status: string; created: string; updated: string; mine: boolean };
  history: ProgressEvent[];
  busy: boolean;
  onRefresh: () => void;
}) {
  const progress = caseProgress(record.status, record.created, history);
  const stamp = (value: string) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return <section className="case-tracker" aria-labelledby="case-progress-title" aria-busy={busy}>
    <div className="tracker-heading"><div><span className="eyebrow">PRIVATE CASE TRACKING</span><h3 id="case-progress-title">Case progress</h3></div><button className="secondary" type="button" disabled={busy} onClick={onRefresh}><RefreshCw size={14}/>{busy ? 'Checking…' : 'Check for updates'}</button></div>
    <div className="tracker-current" role="status"><strong>{record.status}</strong><p>{progress.description}</p></div>
    <ol className="case-stages" aria-label="Case stages">{progress.stages.map((stage, index) => <li key={stage.label} className={(stage.current ? 'current-stage ' : '') + (stage.recordedAt ? 'recorded-stage' : '')} aria-current={stage.current ? 'step' : undefined}>
      <span className="stage-marker" aria-hidden="true">{stage.current ? <Clock3 size={15}/> : stage.recordedAt ? <Check size={15}/> : index + 1}</span><div><strong>{stage.label}</strong><small>{stage.current ? 'Current stage' : stage.recordedAt ? 'Recorded' : 'No recorded update'}</small>{stage.recordedAt && <time dateTime={stage.recordedAt}>{stamp(stage.recordedAt)}</time>}</div>
    </li>)}</ol>
    {progress.latestUpdate && <div className="tracker-update"><strong>Latest organisation update</strong><p>{progress.latestUpdate.content.split('\n').slice(1).join('\n') || progress.latestUpdate.content}</p><time dateTime={progress.latestUpdate.created}>{stamp(progress.latestUpdate.created)}</time></div>}
    <p className="tracker-updated">Last case update: <time dateTime={record.updated}>{stamp(record.updated)}</time></p>
    <div className="tracking-reference"><span>Case ID</span><code>{record.id}</code></div>
    <p className="tracker-privacy"><LockKeyhole size={14}/><span>{record.mine ? 'Return to My complaints with the same signed-in account to track this case. Your Case ID alone does not grant access.' : 'Only the reporter and authorised organisation members can access this case.'}</span></p>
  </section>;
}
