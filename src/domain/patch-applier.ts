import type { RelationshipPatchOperation } from './relationship-patch.js';
import type { RelationshipState } from './relationship-state.js';
import { validatePatch } from './patch-validator.js';

export function applyPatchTransactionally(
  state: RelationshipState,
  operations: RelationshipPatchOperation[],
): RelationshipState {
  const errors = validatePatch(state, operations);
  if (errors.length) throw new Error(`Patch rejected: ${errors.join('; ')}`);
  const next = structuredClone(state);

  for (const operation of operations) {
    switch (operation.operation) {
      case 'add_event':
        next.significantEvents.push(operation.event);
        break;
      case 'add_hypothesis':
        next.hypotheses.push(operation.hypothesis);
        break;
      case 'add_supporting_evidence':
        next.hypotheses
          .find((item) => item.id === operation.targetId)
          ?.supportingEvidence.push(operation.evidence);
        break;
      case 'add_conflicting_evidence':
        next.hypotheses
          .find((item) => item.id === operation.targetId)
          ?.conflictingEvidence.push(operation.evidence);
        break;
      case 'add_thread':
        next.unresolvedThreads.push(operation.thread);
        break;
      case 'add_boundary':
        next.boundaries.push(operation.boundary);
        break;
    }
  }

  next.revision += 1;
  next.hypotheses = next.hypotheses.slice(-20);
  next.unresolvedThreads = next.unresolvedThreads.slice(-12);
  next.boundaries = next.boundaries.slice(-12);
  next.significantEvents = next.significantEvents.slice(-30);
  return next;
}
