import { z } from 'zod';

const SceneBriefSchema = z.object({
  immediateAim: z.string().min(1),
  stance: z.string().min(1),
  relevantConstraints: z.array(z.string()),
  expressionGuidance: z.array(z.string()),
  activatedHistory: z.array(z.string()).optional(),
  internalConflict: z.array(z.string()).optional(),
  possibleMisreading: z.string().optional(),
  boundary: z.string().optional(),
  prohibitedResolution: z.array(z.string()).optional(),
});

const TurnObservationSchema = z.object({
  observableActions: z.array(z.string()),
  spokenClaims: z.array(z.string()),
  commitments: z.array(z.string()),
  boundaries: z.array(z.string()),
  ambiguities: z.array(z.string()),
});

const TimelineMetaSchema = z.object({
  turnNumber: z.number(),
  swipeId: z.number(),
  timestamp: z.number(),
  fingerprint: z.string(),
  previousFingerprint: z.string().optional(),
});

export const AnalysisResultSchema = z.object({
  observedTurn: TurnObservationSchema,
  durableChangeJustified: z.boolean(),
  patch: z.array(z.record(z.unknown())),
  sceneBrief: SceneBriefSchema,
  _meta: TimelineMetaSchema.optional(),
});
