import { installGenerationInterceptor } from './st/generation-interceptor.js';
import { registerEventHandlers } from './st/event-handlers.js';
import { clearAllPrompts } from './st/prompt-injection.js';
import { initializeSettings } from './st/settings-repository.js';
import { initializeSettingsUi } from './ui/settings-controller.js';
import { turnCache } from './lifecycle/turn-cache.js';
import { removeChatHeader } from './ui/chat-header.js';

// Interceptor is registered by generation-interceptor.ts at module load.

(async function bootstrap(): Promise<void> {
  try {
    await initializeSettings();
    await initializeSettingsUi();
    registerEventHandlers();

    // Defer event hook registration until ST context is ready
    installGenerationInterceptor();

    console.log('[Relational Lens] Bootstrap complete');
  } catch (error: unknown) {
    console.error('[Relational Lens] Bootstrap failed', error);
  }
})();

export async function onActivate(): Promise<void> {
  // Connection Manager check — required for analyst API
}

export function onDisable(): void {
  clearAllPrompts();
  turnCache.abortAll();
  removeChatHeader();
}
