import type { AnalystClient } from '../analyst/analyst-client.js';
import type { AnalysisResult } from '../analyst/contracts.js';
import { ANALYSIS_RESPONSE_SCHEMA } from '../analyst/response-schema.js';
import { applyPatchTransactionally } from '../domain/patch-applier.js';
import type { SceneBrief } from '../domain/scene-brief.js';
import { getRelationshipState, saveRelationshipState } from '../st/chat-state-repository.js';
import { getStContext } from '../st/context.js';
import { getSettings } from '../st/settings-repository.js';
import { resolveCanonicalTurn } from './canonical-turn.js';
import { turnCache } from './turn-cache.js';
import { createTurnFingerprint } from './turn-fingerprint.js';
import { createDebugLogger } from '../util/debug-logger.js';
import { updateStatusView } from '../ui/status-view.js';

const debug = createDebugLogger(getSettings);

export class TurnCoordinator {
  constructor(
    private readonly analyst: AnalystClient,
    private readonly injectBrief: (brief: SceneBrief) => void,
    private readonly onAnalysisComplete?: (result: AnalysisResult) => void,
  ) {}

  async handleGeneration(input: {
    chat: unknown[];
    contextSize: number;
    generationType?: string;
  }): Promise<void> {
    console.warn('[Relational Lens] handleGeneration', { genType: input.generationType, chatLen: input.chat?.length });
    if (input.generationType && input.generationType !== 'normal') {
      console.warn('[Relational Lens] skipped: non-normal type', input.generationType);
      return;
    }
    const context = getStContext();
    if (context.groupId) {
      console.warn('[Relational Lens] skipped: group chat');
      updateStatusView('Relational Lens is not available in group chats.');
      return;
    }
    const turn = resolveCanonicalTurn(input.chat);
    if (!turn) {
      console.warn('[Relational Lens] skipped: no canonical turn found');
      return;
    }
    console.warn('[Relational Lens] turn resolved, calling analyst...');

    const state = getRelationshipState();
    const fingerprint = await createTurnFingerprint({
      chatId: String(context.chatId ?? ''),
      stateRevision: state.revision,
      ...turn,
    });

    const cached = turnCache.getCompleted(fingerprint);
    if (cached) {
      debug('cache hit — reusing brief');
      this.injectBrief(cached.sceneBrief);
      this.onAnalysisComplete?.(cached);
      return;
    }

    const running = turnCache.getInFlight(fingerprint);
    if (running) {
      debug('in-flight dedup — awaiting existing analysis');
      const result = await running;
      this.injectBrief(result.sceneBrief);
      this.onAnalysisComplete?.(result);
      return;
    }

    const card = context.getCharacterCardFields?.() ?? {};
    const settings = getSettings();
    const controller = new AbortController();
    const promise = this.analyst.analyze(
      {
        characterContext: [card.description, card.personality, card.scenario, card.mesExamples]
          .filter(Boolean)
          .join('\n\n'),
        personaContext: String(card.persona ?? ''),
        recentMessages: (context.chat as Array<any>)
          .slice(-settings.recentMessageCount)
          .map((message, index) => ({
            index,
            name: String(message.name ?? ''),
            content: String(message.mes ?? ''),
            isUser: Boolean(message.is_user),
          })),
        relationshipState: state,
        responseSchema: ANALYSIS_RESPONSE_SCHEMA,
      },
      controller.signal,
    );

    const result = await turnCache.track(fingerprint, controller, promise);
    debug('analyst succeeded', { stance: result.sceneBrief.stance });
    if (settings.persistentStateEnabled && result.durableChangeJustified && result.patch.length) {
      await saveRelationshipState(applyPatchTransactionally(state, result.patch));
    }
    this.injectBrief(result.sceneBrief);
    this.onAnalysisComplete?.(result);
    updateStatusView('Ready.');
  }
}
