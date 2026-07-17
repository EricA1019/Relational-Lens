import { TurnCoordinator } from '../lifecycle/turn-coordinator.js';
import { StConnectionProfileAnalystClient } from './connection-profile-client.js';
import { clearAllPrompts, injectSceneBrief } from './prompt-injection.js';
import { getSettings } from './settings-repository.js';
import { createDebugLogger } from '../util/debug-logger.js';
import { updateChatHeader, showAnalyzing, showError, removeChatHeader } from '../ui/chat-header.js';
import { getStContext } from './context.js';
import type { AnalysisResult } from '../analyst/contracts.js';

const debug = createDebugLogger(getSettings);

let coordinator: TurnCoordinator | null = null;

function getCoordinator(): TurnCoordinator {
  if (!coordinator) {
    coordinator = new TurnCoordinator(
      new StConnectionProfileAnalystClient(),
      injectSceneBrief,
      (result: AnalysisResult) => updateChatHeader(result),
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
  console.warn('[Relational Lens] 🔥 FIRED', { generationType, enabled: getSettings().enabled });
  try {
    if (!getSettings().enabled) {
      console.warn('[Relational Lens] DISABLED — skipping');
      clearAllPrompts();
      removeChatHeader();
      return;
    }
    console.warn('[Relational Lens] → showAnalyzing...');
    showAnalyzing();
    console.warn('[Relational Lens] → calling coordinator...');
    await getCoordinator().handleGeneration({
      chat,
      contextSize,
      ...(generationType !== undefined ? { generationType } : {}),
    });
    console.warn('[Relational Lens] ✅ done');
  } catch (error: unknown) {
    console.error('[Relational Lens] FAILED', error);
    showError(error instanceof Error ? error.message : String(error));
    clearAllPrompts();
  }
};

console.log('[Relational Lens] ✅ Interceptor registered');

export function installGenerationInterceptor(): void {
  debug('generation interceptor ready');

  // Hook via ST event system — fires reliably before every generation
  try {
    const ctx = getStContext();
    const events = ctx.eventTypes ?? ctx.event_types;
    if (events?.CHARACTER_MESSAGE_RENDERED) {
      ctx.eventSource.on(events.CHARACTER_MESSAGE_RENDERED, async () => {
        // Delay to let ST finish DOM manipulation
        await new Promise(r => setTimeout(r, 500));
        console.warn('[Relational Lens] 📡 Update after render');
        if (!getSettings().enabled) return;
        const chat = ctx.chat as unknown[];
        if (!chat || !chat.length) return;
        showAnalyzing();
        try {
          await getCoordinator().handleGeneration({
            chat,
            contextSize: 8000,
          });
        } catch (e: unknown) {
          console.error('[Relational Lens] message render hook failed', e);
          clearAllPrompts();
        }
      });
      console.warn('[Relational Lens] 📡 Message render hook registered');
    }
  } catch (e) {
    console.warn('[Relational Lens] Could not register event hook', e);
  }
}

