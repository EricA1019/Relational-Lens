import { resolveCanonicalTurn } from '../../src/lifecycle/canonical-turn.js';

test('extracts canonical turn from user message and preceding assistant', () => {
  const chat = [
    { role: 'assistant', content: 'Hello there.' },
    { role: 'user', content: 'Hi back.' },
  ];
  const turn = resolveCanonicalTurn(chat);
  expect(turn).not.toBeNull();
  expect(turn!.previousAssistantContent).toBe('Hello there.');
  expect(turn!.currentUserContent).toBe('Hi back.');
});

test('returns null for empty chat', () => {
  expect(resolveCanonicalTurn([])).toBeNull();
});

test('returns null when no user message', () => {
  const chat = [
    { role: 'assistant', content: 'Hello.' },
    { role: 'assistant', content: 'Still me.' },
  ];
  expect(resolveCanonicalTurn(chat)).toBeNull();
});

test('returns null when user content is empty', () => {
  const chat = [
    { role: 'assistant', content: 'Hello.' },
    { role: 'user', content: '' },
  ];
  expect(resolveCanonicalTurn(chat)).toBeNull();
});

test('returns null when user content is whitespace only', () => {
  const chat = [
    { role: 'assistant', content: 'Hello.' },
    { role: 'user', content: '   ' },
  ];
  expect(resolveCanonicalTurn(chat)).toBeNull();
});

test('finds most recent user message', () => {
  const chat = [
    { role: 'user', content: 'Old message.' },
    { role: 'assistant', content: 'Reply.' },
    { role: 'user', content: 'New message.' },
  ];
  const turn = resolveCanonicalTurn(chat);
  expect(turn!.currentUserContent).toBe('New message.');
});

test('previous assistant is empty if none found before user', () => {
  const chat = [
    { role: 'system', content: 'You are a helper.' },
    { role: 'user', content: 'First user message.' },
  ];
  const turn = resolveCanonicalTurn(chat);
  expect(turn!.currentUserContent).toBe('First user message.');
  expect(turn!.previousAssistantContent).toBe('');
});

test('finds closest assistant before the latest user message', () => {
  const chat = [
    { role: 'assistant', content: 'Older response.' },
    { role: 'user', content: 'Old query.' },
    { role: 'assistant', content: 'Recent response.' },
    { role: 'user', content: 'Latest query.' },
  ];
  const turn = resolveCanonicalTurn(chat);
  expect(turn!.previousAssistantContent).toBe('Recent response.');
  expect(turn!.currentUserContent).toBe('Latest query.');
});

// ── Phase D: message index tracking ──

test('returns assistantMessageIndex for preceding assistant', () => {
  const chat = [
    { role: 'assistant', content: 'Reply.' },    // index 0
    { role: 'user', content: 'Query.' },          // index 1
  ];
  const turn = resolveCanonicalTurn(chat);
  expect(turn).not.toBeNull();
  expect(turn!.assistantMessageIndex).toBe(0);
});

test('assistantMessageIndex is -1 when no preceding assistant', () => {
  const chat = [
    { role: 'system', content: 'Setup.' },
    { role: 'user', content: 'First message.' },
  ];
  const turn = resolveCanonicalTurn(chat);
  expect(turn).not.toBeNull();
  expect(turn!.assistantMessageIndex).toBe(-1);
});

test('assistantMessageIndex points to correct message in multi-turn chat', () => {
  const chat = [
    { role: 'user', content: 'Hello.' },           // 0
    { role: 'assistant', content: 'Hi.' },          // 1
    { role: 'user', content: 'How are you?' },      // 2
    { role: 'assistant', content: 'Good, thanks.' },// 3
    { role: 'user', content: 'Latest query.' },     // 4
  ];
  const turn = resolveCanonicalTurn(chat);
  expect(turn).not.toBeNull();
  expect(turn!.assistantMessageIndex).toBe(3);
  expect(turn!.previousAssistantContent).toBe('Good, thanks.');
  expect(turn!.currentUserContent).toBe('Latest query.');
});
