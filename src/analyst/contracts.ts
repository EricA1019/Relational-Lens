import type { RelationshipPatchOperation } from '../domain/relationship-patch.js';
import type { RelationshipState } from '../domain/relationship-state.js';
import type { SceneBrief } from '../domain/scene-brief.js';

export interface AnalysisRequest {
  characterContext: string;
  personaContext: string;
  recentMessages: Array<{
    index: number;
    name: string;
    content: string;
    isUser: boolean;
  }>;
  relationshipState: RelationshipState;
  responseSchema: Record<string, unknown>;
}

export interface TurnObservation {
  observableActions: string[];
  spokenClaims: string[];
  commitments: string[];
  boundaries: string[];
  ambiguities: string[];
}

export interface AnalysisResult {
  observedTurn: TurnObservation;
  durableChangeJustified: boolean;
  patch: RelationshipPatchOperation[];
  sceneBrief: SceneBrief;
  /** Timeline metadata — set by the coordinator, not by the analyst LLM */
  _meta?: {
    turnNumber: number;
    swipeId: number;
    timestamp: number; // Date.now()
    fingerprint: string;
    previousFingerprint?: string;
  };
}
