import type { RelationshipPatchOperation } from './relationship-patch.js';
import type { RelationshipState } from './relationship-state.js';

const FORBIDDEN = [
  'trusts them more',
  'growing closer',
  'bond deepened',
  'feelings deepened',
  'opening up more',
  'relationship improved',
];

export function validatePatch(state: RelationshipState, operations: RelationshipPatchOperation[]): string[] {
  const errors: string[] = [];
  const serialized = JSON.stringify(operations).toLowerCase();
  for (const phrase of FORBIDDEN) {
    if (serialized.includes(phrase)) errors.push(`Forbidden linear phrase: ${phrase}`);
  }
  if (state.hypotheses.length > 20) errors.push('State already exceeds hypothesis limit.');
  return errors;
}
