import { jest } from '@jest/globals';
import { registerEventHandlers, _resetRegistered } from '../../src/st/event-handlers.js';

beforeEach(() => {
  _resetRegistered();
  const context = (globalThis as any).SillyTavern.getContext();
  context.eventSource.on = jest.fn();
});

test('registers CHAT_CHANGED handler', () => {
  registerEventHandlers();
  const mockOn = (globalThis as any).SillyTavern.getContext().eventSource.on;
  expect(mockOn).toHaveBeenCalledWith('chat_changed', expect.any(Function));
});

test('registers MESSAGE_EDITED handler', () => {
  registerEventHandlers();
  const mockOn = (globalThis as any).SillyTavern.getContext().eventSource.on;
  expect(mockOn).toHaveBeenCalledWith('message_edited', expect.any(Function));
});

test('registers MESSAGE_DELETED handler', () => {
  registerEventHandlers();
  const mockOn = (globalThis as any).SillyTavern.getContext().eventSource.on;
  expect(mockOn).toHaveBeenCalledWith('message_deleted', expect.any(Function));
});

test('registers CHARACTER_EDITED handler', () => {
  registerEventHandlers();
  const mockOn = (globalThis as any).SillyTavern.getContext().eventSource.on;
  expect(mockOn).toHaveBeenCalledWith('character_edited', expect.any(Function));
});

test('CHAT_CHANGED fires without crash', () => {
  registerEventHandlers();
  const mockOn = (globalThis as any).SillyTavern.getContext().eventSource.on;
  const calls: Array<[string, () => void]> = mockOn.mock.calls;
  const handler = calls.find(([event]) => event === 'chat_changed')?.[1];
  handler?.();
  expect(true).toBe(true);
});

test('MESSAGE_EDITED fires without crash', () => {
  registerEventHandlers();
  const mockOn = (globalThis as any).SillyTavern.getContext().eventSource.on;
  const calls: Array<[string, () => void]> = mockOn.mock.calls;
  const handler = calls.find(([event]) => event === 'message_edited')?.[1];
  handler?.();
  expect(true).toBe(true);
});

test('MESSAGE_DELETED fires without crash', () => {
  registerEventHandlers();
  const mockOn = (globalThis as any).SillyTavern.getContext().eventSource.on;
  const calls: Array<[string, () => void]> = mockOn.mock.calls;
  const handler = calls.find(([event]) => event === 'message_deleted')?.[1];
  handler?.();
  expect(true).toBe(true);
});

test('CHARACTER_EDITED fires without crash', () => {
  registerEventHandlers();
  const mockOn = (globalThis as any).SillyTavern.getContext().eventSource.on;
  const calls: Array<[string, () => void]> = mockOn.mock.calls;
  const handler = calls.find(([event]) => event === 'character_edited')?.[1];
  handler?.();
  expect(true).toBe(true);
});

test('idempotent — second call does not re-register', () => {
  registerEventHandlers();
  const mockOn = (globalThis as any).SillyTavern.getContext().eventSource.on;
  mockOn.mockClear();
  registerEventHandlers();
  expect(mockOn).not.toHaveBeenCalled();
});
