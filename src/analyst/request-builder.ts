import type { AnalysisRequest } from './contracts.js';
import { ANALYST_SYSTEM_PROMPT } from './system-prompt.js';

export function buildAnalystMessages(request: AnalysisRequest): Array<{
  role: 'system' | 'user';
  content: string;
}> {
  return [
    { role: 'system', content: ANALYST_SYSTEM_PROMPT },
    {
      role: 'user',
      content: JSON.stringify(
        {
          task: 'Produce a scene brief and a narrowly scoped durable patch.',
          characterContext: request.characterContext,
          personaContext: request.personaContext,
          relationshipState: request.relationshipState,
          recentMessages: request.recentMessages,
        },
        null,
        2,
      ),
    },
  ];
}
