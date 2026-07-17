import type { EpistemicVisibility, EvidenceConfidence } from './epistemic-visibility.js';

export interface MessageReference {
  index: number;
  contentHash: string;
}

export interface Evidence {
  id: string;
  description: string;
  source: MessageReference;
  visibility: EpistemicVisibility;
  confidence: EvidenceConfidence;
}

export interface RelationalHypothesis {
  id: string;
  proposition: string;
  scope: string;
  supportingEvidence: Evidence[];
  conflictingEvidence: Evidence[];
  uncertainty: string;
  behavioralConsequences: string[];
  status: 'tentative' | 'established' | 'contested' | 'weakened';
  lockedByUser: boolean;
}

export interface UnresolvedThread {
  id: string;
  origin: string;
  interpretation: string;
  ongoingEffects: string[];
  attemptedRepairs: string[];
  remainingIssue: string;
  lockedByUser: boolean;
}

export interface Boundary {
  id: string;
  description: string;
  consequences: string[];
  lockedByUser: boolean;
}

export interface SignificantEvent {
  id: string;
  observableFacts: string[];
  spokenClaims: string[];
  interpretations: string[];
  evidence: Evidence[];
}

export interface RelationshipState {
  schemaVersion: 1;
  revision: number;
  hypotheses: RelationalHypothesis[];
  unresolvedThreads: UnresolvedThread[];
  boundaries: Boundary[];
  significantEvents: SignificantEvent[];
  staleReason?: string;
}

export const EMPTY_RELATIONSHIP_STATE: RelationshipState = {
  schemaVersion: 1,
  revision: 0,
  hypotheses: [],
  unresolvedThreads: [],
  boundaries: [],
  significantEvents: [],
};
