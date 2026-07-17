import { parseAnalysisResponse } from '../../src/analyst/response-parser.js';

test('parses JSON from code fence', () => {
  const raw =
    '```json\n{"observedTurn":{"observableActions":["nodded"],"spokenClaims":["I agree"],"commitments":[],"boundaries":[],"ambiguities":[]},"durableChangeJustified":false,"patch":[],"sceneBrief":{"immediateAim":"Test","stance":"Neutral","relevantConstraints":[],"expressionGuidance":[]}}\n```';
  const result = parseAnalysisResponse(raw);
  expect(result.sceneBrief.immediateAim).toBe('Test');
  expect(result.observedTurn.observableActions).toEqual(['nodded']);
  expect(result.durableChangeJustified).toBe(false);
});

test('parses JSON from code fence without language tag', () => {
  const raw =
    '```\n{"observedTurn":{"observableActions":[],"spokenClaims":[],"commitments":[],"boundaries":[],"ambiguities":[]},"durableChangeJustified":false,"patch":[],"sceneBrief":{"immediateAim":"Aim","stance":"Stance","relevantConstraints":[],"expressionGuidance":[]}}\n```';
  const result = parseAnalysisResponse(raw);
  expect(result.sceneBrief.stance).toBe('Stance');
});

test('parses plain JSON without code fence', () => {
  const raw =
    '{"observedTurn":{"observableActions":["smiled"],"spokenClaims":[],"commitments":[],"boundaries":[],"ambiguities":[]},"durableChangeJustified":true,"patch":[{"operation":"add_hypothesis","hypothesis":{"id":"h1","proposition":"Test","scope":"Test","supportingEvidence":[],"conflictingEvidence":[],"uncertainty":"","behavioralConsequences":[],"status":"tentative","lockedByUser":false}}],"sceneBrief":{"immediateAim":"Aim","stance":"Stance","relevantConstraints":[],"expressionGuidance":[]}}';
  const result = parseAnalysisResponse(raw);
  expect(result.durableChangeJustified).toBe(true);
  expect(result.patch).toHaveLength(1);
});

test('handles object-shaped response with content property', () => {
  const raw = {
    content:
      '{"observedTurn":{"observableActions":[],"spokenClaims":[],"commitments":[],"boundaries":[],"ambiguities":[]},"durableChangeJustified":false,"patch":[],"sceneBrief":{"immediateAim":"A","stance":"B","relevantConstraints":[],"expressionGuidance":[]}}',
  };
  const result = parseAnalysisResponse(raw);
  expect(result.sceneBrief.stance).toBe('B');
});

test('throws on empty response', () => {
  expect(() => parseAnalysisResponse('')).toThrow();
});

test('throws on malformed JSON', () => {
  expect(() => parseAnalysisResponse('not json')).toThrow();
});

test('throws on missing required fields', () => {
  const raw =
    '{"observedTurn":{"observableActions":[],"spokenClaims":[],"commitments":[],"boundaries":[],"ambiguities":[]},"durableChangeJustified":false,"patch":[],"sceneBrief":{"immediateAim":"A"}}';
  expect(() => parseAnalysisResponse(raw)).toThrow();
});
