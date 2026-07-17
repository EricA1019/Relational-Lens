import { turnCache } from '../lifecycle/turn-cache.js';
import { getStContext } from './context.js';
import { clearAllPrompts } from './prompt-injection.js';
import { createDebugLogger } from '../util/debug-logger.js';
import { getSettings } from './settings-repository.js';
import { removeChatHeader } from '../ui/chat-header.js';

const debug = createDebugLogger(getSettings);

let registered = false;

export function registerEventHandlers(): void {
  if (registered) {
    debug('event handlers already registered — skipping');
    return;
  }
  const context = getStContext();
  const events = context.eventTypes ?? context.event_types;

  context.eventSource.on(events.CHAT_CHANGED, () => {
    debug('CHAT_CHANGED — aborting and clearing prompts');
    turnCache.abortAll();
    clearAllPrompts();
    removeChatHeader();
  });
  context.eventSource.on(events.MESSAGE_EDITED, () => {
    debug('MESSAGE_EDITED — clearing cache');
    turnCache.clear();
  });
  context.eventSource.on(events.MESSAGE_DELETED, () => {
    debug('MESSAGE_DELETED — clearing cache');
    turnCache.clear();
  });
  context.eventSource.on(events.CHARACTER_EDITED, () => {
    debug('CHARACTER_EDITED — clearing cache and prompts');
    turnCache.clear();
    clearAllPrompts();
  });
  registered = true;
  debug('event handlers registered');
}

/** Reset the registered flag. Used in tests. */
export function _resetRegistered(): void {
  registered = false;
}
