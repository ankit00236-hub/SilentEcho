export const caseStages = ['Submitted', 'Under review', 'In progress', 'Resolved', 'Closed'] as const;
export type CaseStage = typeof caseStages[number];
export type ProgressEvent = { kind: string; content: string; created: string; actor: string };

export const stageDescriptions: Record<CaseStage, string> = {
  Submitted: 'Your complaint has been received. Your organisation can now review it.',
  'Under review': 'Your organisation is reviewing the concern and deciding the next steps.',
  'In progress': 'Your organisation is working on the concern. Read their latest update below.',
  Resolved: 'Your organisation has marked this case resolved. Read the resolution in your timeline.',
  Closed: 'Your organisation has closed this case. Your updates and conversation remain available.',
};

// Existing encrypted status events contain “Status · priority · category\nNote”.
// Use recorded events, rather than assuming every earlier stage was completed.
export function caseProgress(status: string, created: string, history: ProgressEvent[]) {
  const recorded = new Map<string, string>([['Submitted', created]]);
  let latestUpdate: ProgressEvent | undefined;
  for (const event of history) {
    if (event.kind !== 'status') continue;
    const stage = event.content.split(' · ')[0];
    if (caseStages.includes(stage as CaseStage)) recorded.set(stage, event.created);
    if (event.actor === 'Organisation') latestUpdate = event;
  }
  return {
    description: stageDescriptions[status as CaseStage] ?? 'Read your timeline for the latest case updates.',
    stages: caseStages.map(label => ({ label, current: label === status, recordedAt: recorded.get(label) })),
    latestUpdate,
  };
}
