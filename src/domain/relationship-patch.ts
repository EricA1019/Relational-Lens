import type {
  Boundary,
  Evidence,
  RelationalHypothesis,
  SignificantEvent,
  UnresolvedThread,
} from './relationship-state.js';

export type RelationshipPatchOperation =
  | { operation: 'add_event'; event: SignificantEvent }
  | { operation: 'add_hypothesis'; hypothesis: RelationalHypothesis }
  | { operation: 'add_supporting_evidence'; targetId: string; evidence: Evidence }
  | { operation: 'add_conflicting_evidence'; targetId: string; evidence: Evidence }
  | { operation: 'add_thread'; thread: UnresolvedThread }
  | { operation: 'add_boundary'; boundary: Boundary };
