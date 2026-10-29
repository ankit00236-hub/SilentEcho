import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caseProgress } from '../lib/case-progress.ts';
const created = '2026-01-01T10:00:00.000Z';
const update = (status, when, note = 'We are working on this concern.') => ({ kind: 'status', actor: 'Organisation', content: `${status} · Moderate priority · Other\n${note}`, created: when });
test('new complaints start at Submitted with no invented progress', () => {
  const p = caseProgress('Submitted', created, []);
  assert.deepEqual(p.stages.filter(s => s.current).map(s => s.label), ['Submitted']);
  assert.deepEqual(p.stages.filter(s => s.recordedAt).map(s => s.label), ['Submitted']);
  assert.equal(p.latestUpdate, undefined);
});
test('a direct resolution never marks skipped stages as recorded', () => {
  const event = update('Resolved', '2026-01-03T10:00:00.000Z');
  const p = caseProgress('Resolved', created, [event]);
  assert.equal(p.stages.find(s => s.label === 'Under review').recordedAt, undefined);
  assert.equal(p.stages.find(s => s.label === 'In progress').recordedAt, undefined);
  assert.equal(p.stages.find(s => s.current).label, 'Resolved');
  assert.equal(p.latestUpdate, event);
});
test('reopened cases show their actual current stage and preserve earlier resolution history', () => {
  const reopen = update('Under review', '2026-01-05T10:00:00.000Z', 'Reopened after receiving new evidence.');
  const p = caseProgress('Under review', created, [update('Resolved', '2026-01-03T10:00:00.000Z'), reopen, { kind: 'message', actor: 'Reporter', content: 'Closed', created }]);
  assert.equal(p.stages.find(s => s.current).label, 'Under review');
  assert.equal(p.stages.find(s => s.label === 'Resolved').recordedAt, '2026-01-03T10:00:00.000Z');
  assert.equal(p.stages.find(s => s.label === 'Closed').recordedAt, undefined);
  assert.equal(p.latestUpdate, reopen);
});
