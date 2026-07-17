import { validatePatch } from '../../src/domain/patch-validator.js';
import { EMPTY_RELATIONSHIP_STATE } from '../../src/domain/relationship-state.js';
import type { RelationshipState } from '../../src/domain/relationship-state.js';

const stateWithManyHypotheses: RelationshipState = {
  ...EMPTY_RELATIONSHIP_STATE,
  hypotheses: Array.from({ length: 21 }, (_, i) => ({
    id: `h${i}`,
    proposition: `Hypothesis ${i}`,
    scope: 'Test',
    supportingEvidence: [],
    conflictingEvidence: [],
    uncertainty: '',
    behavioralConsequences: [],
    status: 'tentative' as const,
    lockedByUser: false,
  })),
};

test('rejects "trusts them more" linear phrase', () => {
  const errors = validatePatch(EMPTY_RELATIONSHIP_STATE, [
    { operation: 'add_hypothesis', hypothesis: { proposition: 'trusts them more' } } as any,
  ]);
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('Forbidden linear phrase');
});

test('rejects "growing closer" linear phrase', () => {
  const errors = validatePatch(EMPTY_RELATIONSHIP_STATE, [
    { operation: 'add_event', event: { description: 'growing closer event' } } as any,
  ]);
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('Forbidden linear phrase');
});

test('rejects "bond deepened" linear phrase', () => {
  const errors = validatePatch(EMPTY_RELATIONSHIP_STATE, [
    { operation: 'add_hypothesis', hypothesis: { proposition: 'their bond deepened' } } as any,
  ]);
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('Forbidden linear phrase');
});

test('rejects "feelings deepened" linear phrase', () => {
  const errors = validatePatch(EMPTY_RELATIONSHIP_STATE, [
    { operation: 'add_hypothesis', hypothesis: { proposition: 'feelings deepened' } } as any,
  ]);
  expect(errors).toHaveLength(1);
});

test('rejects "opening up more" linear phrase', () => {
  const errors = validatePatch(EMPTY_RELATIONSHIP_STATE, [
    { operation: 'add_hypothesis', hypothesis: { proposition: 'opening up more to them' } } as any,
  ]);
  expect(errors).toHaveLength(1);
});

test('rejects "relationship improved" linear phrase', () => {
  const errors = validatePatch(EMPTY_RELATIONSHIP_STATE, [
    { operation: 'add_hypothesis', hypothesis: { proposition: 'relationship improved' } } as any,
  ]);
  expect(errors).toHaveLength(1);
});

test('allows patch without forbidden phrases', () => {
  const errors = validatePatch(EMPTY_RELATIONSHIP_STATE, [
    {
      operation: 'add_hypothesis',
      hypothesis: { proposition: 'The character remains cautious around the user.' },
    } as any,
  ]);
  expect(errors).toHaveLength(0);
});

test('rejects empty patch with no issues', () => {
  const errors = validatePatch(EMPTY_RELATIONSHIP_STATE, []);
  expect(errors).toHaveLength(0);
});

test('rejects state with too many hypotheses', () => {
  const errors = validatePatch(stateWithManyHypotheses, []);
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('hypothesis limit');
});
