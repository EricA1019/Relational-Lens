import { TurnCoordinator } from '../lifecycle/turn-coordinator.js';
import { StConnectionProfileAnalystClient } from './connection-profile-client.js';
import { clearAllPrompts, injectSceneBrief } from './prompt-injection.js';
import { getSettings } from './settings-repository.js';
import { createDebugLogger } from '../util/debug-logger.js';
import { saveAnalysisToMessage, renderAnalysisFooter } from '../ui/message-footer.js';
import { getStContext } from './context.js';
import type { AnalysisResult } from '../analyst/contracts.js';

const debug = createDebugLogger(getSettings);

let coordinator: TurnCoordinator | null = null;

/**
 * Pending analysis result — set during generate_interceptor,
 * consumed and cleared by CHARACTER_MESSAGE_RENDERED.
 * This bridges the gap between "analysis completes before message exists"
 * and "footer can only be rendered after message is in DOM."
 */
let pendingResult: AnalysisResult | null = null;

function getCoordinator(): TurnCoordinator {
  if (!coordinator) {
    coordinator = new TurnCoordinator(
      new StConnectionProfileAnalystClient(),
      injectSceneBrief,
      (result: AnalysisResult) => {
        // Store for CHARACTER_MESSAGE_RENDERED to consume
        pendingResult = result;
      },
    );
  }
  return coordinator;
}

globalThis.relationalLensGenerateInterceptor = async (
  chat: unknown[],
  contextSize: number,
  _abort: unknown,
  generationType?: string,
): Promise<void> => {
  try {
    if (!getSettings().enabled) {
      clearAllPrompts();
      return;
    }
    await getCoordinator().handleGeneration({
      chat,
      contextSize,
      ...(generationType !== undefined ? { generationType } : {}),
    });
  } catch (error: unknown) {
    console.error('[Relational Lens] FAILED', error);
    clearAllPrompts();
  }
};

console.log('[Relational Lens] ✅ Interceptor registered');

export function installGenerationInterceptor(): void {
  debug('generation interceptor ready');

  try {
    const ctx = getStContext();
    const events = ctx.eventTypes ?? ctx.event_types;

    if (events?.CHARACTER_MESSAGE_RENDERED) {
      // CHARACTER_MESSAGE_RENDERED fires AFTER the message is in the DOM.
      // This is where we consume the pending analysis and render the footer.
      ctx.eventSource.on(events.CHARACTER_MESSAGE_RENDERED, (messageId: number) => {
        console.warn('[RL] CHARACTER_MESSAGE_RENDERED', { messageId, hasPending: !!pendingResult });
        if (!getSettings().enabled) return;

        const result = pendingResult;
        pendingResult = null;

        if (result) {
          console.warn('[RL] saving analysis to message', messageId);
          saveAnalysisToMessage(messageId, result);
        }

        // Always render — may be restoring cached analysis on reload
        setTimeout(() => renderAnalysisFooter(messageId), 100);
      });

      // MESSAGE_SWIPED fires when user swipes to a different response.
      // Re-read analysis from chat[mesId].extra and re-render footer.
      if (events.MESSAGE_SWIPED) {
        ctx.eventSource.on(events.MESSAGE_SWIPED, (mesId: number) => {
          console.warn('[RL] MESSAGE_SWIPED', { mesId });
          if (!getSettings().enabled) return;
          setTimeout(() => renderAnalysisFooter(mesId), 100);
        });
      }

      console.warn('[Relational Lens] 📡 Event hooks registered');
    } else {
      console.warn('[RL] CHARACTER_MESSAGE_RENDERED not found in events', { keys: Object.keys(events ?? {}) });
    }
  } catch (e) {
    console.warn('[Relational Lens] Could not register event hooks', e);
  }
}

