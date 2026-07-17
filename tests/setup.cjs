// Polyfill TextEncoder/TextDecoder for jsdom test environment
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// Polyfill structuredClone for Node.js < 17
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = function structuredClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Polyfill crypto.subtle for jsdom (uses Node's Web Crypto API)
if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle === 'undefined') {
  const { webcrypto } = require('crypto');
  globalThis.crypto = webcrypto;
}

// Mock SillyTavern global for test environment
if (typeof globalThis.SillyTavern === 'undefined') {
  const createContext = () => ({
    chat: [],
    characters: [],
    characterId: 0,
    groupId: null,
    chatId: 'test-chat',
    personaId: 'test-persona',
    extensionSettings: {
      relational_lens: {
        schemaVersion: 1,
        enabled: true,
        analystProfileId: 'test-profile',
        maxOutputTokens: 768,
        recentMessageCount: 12,
        debugLogging: false,
        persistentStateEnabled: false,
      },
    },
    chatMetadata: {},
    eventTypes: {
      CHAT_CHANGED: 'chat_changed',
      MESSAGE_EDITED: 'message_edited',
      MESSAGE_DELETED: 'message_deleted',
      CHARACTER_EDITED: 'character_edited',
      GENERATION_AFTER_COMMANDS: 'generation_after_commands',
      GENERATION_STARTED: 'generation_started',
      GENERATION_STOPPED: 'generation_stopped',
      GENERATION_ENDED: 'generation_ended',
      APP_READY: 'app_ready',
      APP_INITIALIZED: 'app_initialized',
    },
    eventSource: {
      on: () => {},
      emit: () => {},
      removeListener: () => {},
    },
    saveSettingsDebounced: () => {},
    saveMetadata: () => {},
    setExtensionPrompt: () => {},
    getCharacterCardFields: () => ({}),
    renderExtensionTemplateAsync: async () => '<div></div>',
    ConnectionManagerRequestService: {
      sendRequest: async () => '{}',
      handleDropdown: () => {},
    },
  });

  let currentContext = createContext();
  globalThis.SillyTavern = {
    getContext: () => currentContext,
  };
}
