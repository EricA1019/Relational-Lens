import { createTurnFingerprint } from '../../src/lifecycle/turn-fingerprint.js';

test('fingerprint is stable for identical input', async () => {
  const input = { chatId: '1', stateRevision: 0, user: 'hello' };
  expect(await createTurnFingerprint(input)).toBe(await createTurnFingerprint(input));
});

test('different inputs produce different fingerprints', async () => {
  const a = { chatId: '1', stateRevision: 0, user: 'hello' };
  const b = { chatId: '2', stateRevision: 0, user: 'hello' };
  expect(await createTurnFingerprint(a)).not.toBe(await createTurnFingerprint(b));
});

test('different stateRevision produces different fingerprint', async () => {
  const a = { chatId: '1', stateRevision: 0, user: 'hello' };
  const b = { chatId: '1', stateRevision: 1, user: 'hello' };
  expect(await createTurnFingerprint(a)).not.toBe(await createTurnFingerprint(b));
});

test('different user content produces different fingerprint', async () => {
  const a = { chatId: '1', stateRevision: 0, user: 'hello' };
  const b = { chatId: '1', stateRevision: 0, user: 'goodbye' };
  expect(await createTurnFingerprint(a)).not.toBe(await createTurnFingerprint(b));
});

test('works with empty input object', async () => {
  const result = await createTurnFingerprint({});
  expect(typeof result).toBe('string');
  expect(result.length).toBeGreaterThan(0);
});
