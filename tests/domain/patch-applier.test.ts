import { applyPatchTransactionally } from '../../src/domain/patch-applier.js';
import { EMPTY_RELATIONSHIP_STATE } from '../../src/domain/relationship-state.js';

test('adds a scoped hypothesis', () => {
  const next = applyPatchTransactionally(EMPTY_RELATIONSHIP_STATE, [
    {
      operation: 'add_hypothesis',
      hypothesis: {
        id: 'h1',
        proposition: 'The subject is reliable during immediate physical danger.',
        scope: 'Immediate crises only',
        supportingEvidence: [],
        conflictingEvidence: [],
        uncertainty: 'Long-term political loyalty remains unknown.',
        behavioralConsequences: ['Accept emergency assistance.'],
        status: 'tentative',
        lockedByUser: false,
      },
    },
  ]);
  expect(next.revision).toBe(1);
  expect(next.hypotheses).toHaveLength(1);
});
