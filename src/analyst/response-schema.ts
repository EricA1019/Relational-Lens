export const ANALYSIS_RESPONSE_SCHEMA = {
  name: 'relational_lens_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['observedTurn', 'durableChangeJustified', 'patch', 'sceneBrief'],
    properties: {
      observedTurn: {
        type: 'object',
        additionalProperties: false,
        required: ['observableActions', 'spokenClaims', 'commitments', 'boundaries', 'ambiguities'],
        properties: {
          observableActions: { type: 'array', items: { type: 'string' } },
          spokenClaims: { type: 'array', items: { type: 'string' } },
          commitments: { type: 'array', items: { type: 'string' } },
          boundaries: { type: 'array', items: { type: 'string' } },
          ambiguities: { type: 'array', items: { type: 'string' } },
        },
      },
      durableChangeJustified: { type: 'boolean' },
      patch: { type: 'array', items: { type: 'object' } },
      sceneBrief: {
        type: 'object',
        additionalProperties: false,
        required: ['immediateAim', 'stance', 'relevantConstraints', 'expressionGuidance'],
        properties: {
          immediateAim: { type: 'string' },
          stance: { type: 'string' },
          relevantConstraints: { type: 'array', items: { type: 'string' } },
          expressionGuidance: { type: 'array', items: { type: 'string' } },
          activatedHistory: { type: 'array', items: { type: 'string' } },
          internalConflict: { type: 'array', items: { type: 'string' } },
          possibleMisreading: { type: 'string' },
          boundary: { type: 'string' },
          prohibitedResolution: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
} as const;
