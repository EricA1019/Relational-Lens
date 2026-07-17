import type { RelationalLensSettings } from '../st/settings-repository.js';

type DebugLogFn = (message: string, ...args: unknown[]) => void;

export function createDebugLogger(getSettings: () => RelationalLensSettings): DebugLogFn {
  return (message: string, ...args: unknown[]) => {
    if (getSettings().debugLogging) {
      console.debug(`[Relational Lens] ${message}`, ...args);
    }
  };
}
