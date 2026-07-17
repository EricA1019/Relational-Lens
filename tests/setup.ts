// Polyfill TextEncoder/TextDecoder for jsdom test environment
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// Polyfill structuredClone for Node.js < 17
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = function structuredClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  };
}
