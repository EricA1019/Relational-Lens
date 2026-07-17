import { installGenerationInterceptor } from './st/generation-interceptor.js';
import { registerEventHandlers } from './st/event-handlers.js';
import { clearAllPrompts } from './st/prompt-injection.js';
import { initializeSettings } from './st/settings-repository.js';
import { initializeSettingsUi } from './ui/settings-controller.js';
import { turnCache } from './lifecycle/turn-cache.js';
import { updateStatusView } from './ui/status-view.js';
import { removeChatHeader } from './ui/chat-header.js';
import { getStContext } from './st/context.js';

// Interceptor is registered by generation-interceptor.ts at module load.
// Bootstrap async chain for settings/UI (WTracker-style self-init).
installGenerationInterceptor();

(async function bootstrap(): Promise<void> {
  try {
    await initializeSettings();
    await initializeSettingsUi();
    registerEventHandlers();
    console.log('[Relational Lens] Bootstrap complete');
  } catch (error: unknown) {
    console.error('[Relational Lens] Bootstrap failed', error);
    updateStatusView('Relational Lens initialization failed.');
  }
})();

export async function onActivate(): Promise<void> {
  const context = getStContext();
  if (!context.ConnectionManagerRequestService) {
    updateStatusView('Connection Manager required — Relational Lens disabled.');
  }
}

export function onDisable(): void {
  clearAllPrompts();
  turnCache.abortAll();
  removeChatHeader();
  updateStatusView('Relational Lens disabled.');
}
