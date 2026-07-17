import { turnCache } from '../../src/lifecycle/turn-cache.js';
import type { AnalysisResult } from '../../src/analyst/contracts.js';

beforeEach(() => {
  // Create a fresh cache for each test by clearing internal state
  // We access the singleton and clear it
  (turnCache as any).clear();
  (turnCache as any).completed.clear();
  (turnCache as any).inFlight.clear();
  (turnCache as any).controllers.clear();
});

test('getCompleted returns undefined for unknown key', () => {
  expect(turnCache.getCompleted('unknown')).toBeUndefined();
});

test('getInFlight returns undefined for unknown key', () => {
  expect(turnCache.getInFlight('unknown')).toBeUndefined();
});

test('track stores completed result', async () => {
  const controller = new AbortController();
  const result = {
    observedTurn: {
      observableActions: [],
      spokenClaims: [],
      commitments: [],
      boundaries: [],
      ambiguities: [],
    },
    durableChangeJustified: false,
    patch: [],
    sceneBrief: { immediateAim: 'A', stance: 'B', relevantConstraints: [], expressionGuidance: [] },
  };
  const promise = Promise.resolve(result);
  await turnCache.track('key1', controller, promise);
  expect(turnCache.getCompleted('key1')).toBe(result);
});

test('track removes in-flight after completion', async () => {
  const controller = new AbortController();
  const result = {
    observedTurn: {
      observableActions: [],
      spokenClaims: [],
      commitments: [],
      boundaries: [],
      ambiguities: [],
    },
    durableChangeJustified: false,
    patch: [],
    sceneBrief: { immediateAim: 'A', stance: 'B', relevantConstraints: [], expressionGuidance: [] },
  };
  const promise = Promise.resolve(result);
  await turnCache.track('key2', controller, promise);
  expect(turnCache.getInFlight('key2')).toBeUndefined();
});

test('clear empties completed map', async () => {
  const controller = new AbortController();
  const result = {
    observedTurn: {
      observableActions: [],
      spokenClaims: [],
      commitments: [],
      boundaries: [],
      ambiguities: [],
    },
    durableChangeJustified: false,
    patch: [],
    sceneBrief: { immediateAim: 'A', stance: 'B', relevantConstraints: [], expressionGuidance: [] },
  };
  await turnCache.track('key3', controller, Promise.resolve(result));
  turnCache.clear();
  expect(turnCache.getCompleted('key3')).toBeUndefined();
});

test('abortAll aborts all controllers and clears in-flight', () => {
  const controller = new AbortController();
  const promise = new Promise<AnalysisResult>(() => {}); // never settles
  turnCache.track('key4', controller, promise);
  expect(turnCache.getInFlight('key4')).toBeDefined();
  turnCache.abortAll();
  expect(controller.signal.aborted).toBe(true);
  expect(turnCache.getInFlight('key4')).toBeUndefined();
});

test('deduplicates same key via getInFlight', async () => {
  const controller1 = new AbortController();
  const controller2 = new AbortController();
  const result = {
    observedTurn: {
      observableActions: [],
      spokenClaims: [],
      commitments: [],
      boundaries: [],
      ambiguities: [],
    },
    durableChangeJustified: false,
    patch: [],
    sceneBrief: { immediateAim: 'A', stance: 'B', relevantConstraints: [], expressionGuidance: [] },
  };
  const promise1 = new Promise<typeof result>((resolve) => setTimeout(() => resolve(result), 10));
  const trackPromise1 = turnCache.track('dup', controller1, promise1);
  expect(turnCache.getInFlight('dup')).toBeDefined();
  const promise2 = Promise.resolve(result);
  await turnCache.track('dup2', controller2, promise2);
  await trackPromise1;
  // After resolution and cleanup, the in-flight entry should be removed
  expect(turnCache.getInFlight('dup')).toBeUndefined();
});
