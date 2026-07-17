import { DEFAULT_MAX_OUTPUT_TOKENS, DEFAULT_RECENT_MESSAGE_COUNT, EXTENSION_KEY } from '../constants.js';
import { getStContext } from './context.js';

export interface RelationalLensSettings {
  schemaVersion: number;
  enabled: boolean;
  analystProfileId: string;
  maxOutputTokens: number;
  recentMessageCount: number;
  debugLogging: boolean;
  persistentStateEnabled: boolean;
}

const CURRENT_SCHEMA = 2;

const DEFAULTS: RelationalLensSettings = {
  schemaVersion: CURRENT_SCHEMA,
  enabled: false,
  analystProfileId: '',
  maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
  recentMessageCount: DEFAULT_RECENT_MESSAGE_COUNT,
  debugLogging: false,
  persistentStateEnabled: false,
};

export async function initializeSettings(): Promise<void> {
  const context = getStContext();
  const existing = (context.extensionSettings[EXTENSION_KEY] ?? {}) as Partial<RelationalLensSettings>;

  // If schema version is outdated, force critical defaults (token budget migration)
  if (!existing.schemaVersion || existing.schemaVersion < CURRENT_SCHEMA) {
    context.extensionSettings[EXTENSION_KEY] = {
      ...DEFAULTS,
      ...existing,
      schemaVersion: CURRENT_SCHEMA,
      maxOutputTokens: DEFAULTS.maxOutputTokens, // force new default
    };
  } else {
    context.extensionSettings[EXTENSION_KEY] = { ...DEFAULTS, ...existing, schemaVersion: CURRENT_SCHEMA };
  }
  context.saveSettingsDebounced();
}

export function getSettings(): RelationalLensSettings {
  const existing = getStContext().extensionSettings[EXTENSION_KEY] as RelationalLensSettings | undefined;
  return existing ?? DEFAULTS;
}

export function updateSettings(patch: Partial<RelationalLensSettings>): void {
  const context = getStContext();
  context.extensionSettings[EXTENSION_KEY] = {
    ...getSettings(),
    ...patch,
    schemaVersion: 1,
  };
  context.saveSettingsDebounced();
}
