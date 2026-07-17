import { buildAnalystMessages } from '../../src/analyst/request-builder.js';
import { EMPTY_RELATIONSHIP_STATE } from '../../src/domain/relationship-state.js';
import { ANALYSIS_RESPONSE_SCHEMA } from '../../src/analyst/response-schema.js';

const MINIMAL_REQUEST = {
  characterContext: 'A guarded character.',
  personaContext: 'The user.',
  recentMessages: [
    {
      index: 0,
      name: 'User',
      content: 'Hello.',
      isUser: true,
    },
  ],
  relationshipState: EMPTY_RELATIONSHIP_STATE,
  responseSchema: ANALYSIS_RESPONSE_SCHEMA,
};

test('returns system and user messages', () => {
  const messages = buildAnalystMessages(MINIMAL_REQUEST);
  expect(messages).toHaveLength(2);
  expect(messages[0]!.role).toBe('system');
  expect(messages[1]!.role).toBe('user');
});

test('system message contains analyst prompt', () => {
  const messages = buildAnalystMessages(MINIMAL_REQUEST);
  expect(messages[0]!.content).toContain('Output only JSON');
  expect(messages[0]!.content).toContain('observedTurn');
  expect(messages[0]!.content).toContain('sceneBrief');
});

test('user message includes character context', () => {
  const messages = buildAnalystMessages(MINIMAL_REQUEST);
  expect(messages[1]!.content).toContain('guarded character');
});

test('user message includes persona context', () => {
  const messages = buildAnalystMessages(MINIMAL_REQUEST);
  expect(messages[1]!.content).toContain('The user');
});

test('user message includes recent messages', () => {
  const messages = buildAnalystMessages(MINIMAL_REQUEST);
  expect(messages[1]!.content).toContain('Hello');
});

test('user message serializes as valid JSON', () => {
  const messages = buildAnalystMessages(MINIMAL_REQUEST);
  expect(() => JSON.parse(messages[1]!.content)).not.toThrow();
});
