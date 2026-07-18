/**
 * Phase D v2 — Correct turn lifecycle (TDD)
 *
 * Models the actual SillyTavern message lifecycle:
 *
 * 1. generate_interceptor fires → analysis happens → result stored as "pending"
 * 2. CHARACTER_MESSAGE_RENDERED(messageId) fires → analysis saved to
 *    chat[messageId].extra.relationalLens[swipeId] → footer rendered
 * 3. MESSAGE_SWIPED(mesId) fires → footer re-reads from
 *    chat[mesId].extra.relationalLens[chat[mesId].swipe_id] → re-renders
 *
 * Key ST facts discovered:
 * - ST uses .mes[mesid="X"] (lowercase 'mesid')
 * - .mes_text is inside .mes > .mes_block
 * - CHARACTER_MESSAGE_RENDERED emits (messageId, type)
 * - MESSAGE_SWIPED emits (mesId)
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

const ANALYSIS_KEY = 'relationalLens';
const FOOTER_CLASS = 'relational-lens-footer';

// ── Simulated module state (what generation-interceptor would hold) ──
let pendingResult: any = null;

function setPendingResult(result: any) {
  pendingResult = result;
}

function consumePendingResult(): any {
  const r = pendingResult;
  pendingResult = null;
  return r;
}

// ── Helpers ──

interface SpyMessage {
  index: number;
  role: string;
  content: string;
  swipe_id: number;
  swipes: string[];
  extra: Record<string, any>;
}

function makeAssistantMsg(index: number, swipeId = 0): SpyMessage {
  return {
    index,
    role: 'assistant',
    content: `Response ${index} swipe ${swipeId}`,
    swipe_id: swipeId,
    swipes: [ `Response ${index} swipe 0`, `Response ${index} swipe 1` ],
    extra: {},
  };
}

function makeResult(stance: string, swipeId: number) {
  return {
    sceneBrief: { stance, immediateAim: 'test aim', relevantConstraints: [], expressionGuidance: [] },
    observedTurn: { observableActions: [], spokenClaims: [], commitments: [], boundaries: [], ambiguities: [] },
    durableChangeJustified: false,
    patch: [],
    _meta: { turnNumber: 1, swipeId, timestamp: Date.now(), fingerprint: `fp-${swipeId}`, messageIndex: -1 },
  };
}

// ── DOM helpers ──

function createStMessageDom(mesId: number, swipeId: number): HTMLDivElement {
  const mes = document.createElement('div');
  mes.className = 'mes';
  mes.setAttribute('mesid', String(mesId));
  mes.setAttribute('swipeid', String(swipeId));

  const mesBlock = document.createElement('div');
  mesBlock.className = 'mes_block';

  const mesText = document.createElement('div');
  mesText.className = 'mes_text';
  mesText.textContent = `Message ${mesId} content`;

  mesBlock.appendChild(mesText);
  mes.appendChild(mesBlock);
  return mes;
}

// ── The function under test (will be extracted from message-footer.ts) ──

function renderFooter(chat: SpyMessage[], mesId: number): void {
  // Remove existing footer
  const mesEl = document.querySelector(`.mes[mesid="${mesId}"]`);
  if (!mesEl) return;
  mesEl.querySelector(`.${FOOTER_CLASS}`)?.remove();

  const msg = chat[mesId];
  if (!msg) return;

  const swipeId = msg.swipe_id;
  const result = msg.extra?.[ANALYSIS_KEY]?.[String(swipeId)];
  if (!result) return;

  const footer = document.createElement('div');
  footer.className = FOOTER_CLASS;
  footer.textContent = `🔍 ${result.sceneBrief.stance}`;

  const mesText = mesEl.querySelector('.mes_text');
  if (mesText) mesText.appendChild(footer);
}

function saveAnalysis(chat: SpyMessage[], mesId: number, result: any): void {
  const msg = chat[mesId];
  if (!msg) return;
  const swipeId = msg.swipe_id;
  if (!msg.extra) msg.extra = {};
  if (!msg.extra[ANALYSIS_KEY]) msg.extra[ANALYSIS_KEY] = {};
  msg.extra[ANALYSIS_KEY][String(swipeId)] = result;
}

// ════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════

describe('Turn lifecycle: generate → render → swipe', () => {
  let chat: SpyMessage[];
  let container: HTMLDivElement;

  beforeEach(() => {
    chat = [];
    pendingResult = null;

    container = document.createElement('div');
    container.id = 'chat';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  // ── Phase 1: generate_interceptor completes analysis ──

  test('analysis result stored as pending during generate_interceptor', () => {
    // Simulate: coordinator finishes, stores result
    const result = makeResult('guarded', 0);
    setPendingResult(result);

    expect(pendingResult).not.toBeNull();
    expect(pendingResult.sceneBrief.stance).toBe('guarded');
  });

  // ── Phase 2: CHARACTER_MESSAGE_RENDERED saves + renders ──

  test('CHARACTER_MESSAGE_RENDERED saves pending result to correct message', () => {
    // Setup: chat has a new assistant message at index 3
    chat[0] = makeAssistantMsg(0);
    chat[1] = makeAssistantMsg(1);
    chat[2] = makeAssistantMsg(2);
    chat[3] = makeAssistantMsg(3, 0); // the new message

    // Simulate: analysis was done, stored as pending
    setPendingResult(makeResult('tense', 0));

    // Simulate: CHARACTER_MESSAGE_RENDERED fires with messageId=3
    const messageId = 3;
    const result = consumePendingResult();
    expect(result).not.toBeNull();

    saveAnalysis(chat, messageId, result);

    // Verify: analysis saved to chat[3]
    const msg = chat[messageId]!;
    expect(msg.extra[ANALYSIS_KEY]).toBeDefined();
    expect(msg.extra[ANALYSIS_KEY]['0'].sceneBrief.stance).toBe('tense');
    expect(pendingResult).toBeNull(); // consumed
  });

  test('CHARACTER_MESSAGE_RENDERED renders footer into .mes_text', () => {
    // Setup: message at index 3 with analysis stored
    chat[3] = makeAssistantMsg(3, 0);
    chat[3]!.extra = { [ANALYSIS_KEY]: { '0': makeResult('warm', 0) } };

    // Setup DOM
    const mesEl = createStMessageDom(3, 0);
    container.appendChild(mesEl);

    // Simulate: CHARACTER_MESSAGE_RENDERED fires
    renderFooter(chat, 3);

    // Verify: footer injected into .mes_text
    const footer = mesEl.querySelector(`.${FOOTER_CLASS}`);
    expect(footer).not.toBeNull();
    expect(footer!.textContent).toContain('warm');

    // Verify: footer is inside .mes_text, not .mes directly
    const mesText = mesEl.querySelector('.mes_text');
    expect(mesText).not.toBeNull();
    expect(mesText!.querySelector(`.${FOOTER_CLASS}`)).not.toBeNull();
  });

  test('footer is last child of .mes_text', () => {
    chat[1] = makeAssistantMsg(1, 0);
    chat[1]!.extra = { [ANALYSIS_KEY]: { '0': makeResult('neutral', 0) } };

    const mesEl = createStMessageDom(1, 0);
    container.appendChild(mesEl);

    renderFooter(chat, 1);

    const mesText = mesEl.querySelector('.mes_text')!;
    const children = Array.from(mesText.children);
    expect(children.length).toBeGreaterThanOrEqual(1);
    expect(children[children.length - 1]!.className).toBe(FOOTER_CLASS);
    // Original text is still present
    expect(mesText.textContent).toContain('Message 1 content');
  });

  // ── Phase 3: MESSAGE_SWIPED re-renders ──

  test('MESSAGE_SWIPED re-renders footer for new swipe', () => {
    // Setup: message at index 5 with two swipes' analyses stored
    const msg = makeAssistantMsg(5, 0);
    msg.extra = {
      [ANALYSIS_KEY]: {
        '0': makeResult('first-swipe', 0),
        '1': makeResult('second-swipe', 1),
      },
    };
    chat[5] = msg;

    // Initial DOM with swipe 0
    const mesEl = createStMessageDom(5, 0);
    container.appendChild(mesEl);

    // Render swipe 0 footer
    renderFooter(chat, 5);
    expect(mesEl.querySelector(`.${FOOTER_CLASS}`)!.textContent).toContain('first-swipe');

    // Simulate: user swipes to swipe 1
    chat[5]!.swipe_id = 1;
    mesEl.setAttribute('swipeid', '1');

    // MESSAGE_SWIPED fires → re-render
    renderFooter(chat, 5);

    // Verify: footer now shows swipe 1 analysis
    const footer = mesEl.querySelector(`.${FOOTER_CLASS}`);
    expect(footer).not.toBeNull();
    expect(footer!.textContent).toContain('second-swipe');

    // Verify: only ONE footer (old was removed)
    expect(mesEl.querySelectorAll(`.${FOOTER_CLASS}`).length).toBe(1);
  });

  test('MESSAGE_SWIPED with no stored analysis removes footer', () => {
    // Setup: message at index 2, no analysis stored
    chat[2] = makeAssistantMsg(2, 0);

    const mesEl = createStMessageDom(2, 0);
    container.appendChild(mesEl);

    // Render (no analysis available)
    renderFooter(chat, 2);

    // No footer present
    expect(mesEl.querySelector(`.${FOOTER_CLASS}`)).toBeNull();
  });

  test('MESSAGE_SWIPED for different message does not affect other messages', () => {
    // Two messages: index 1 has analysis, index 3 does not
    chat[1] = makeAssistantMsg(1, 0);
    chat[1]!.extra = { [ANALYSIS_KEY]: { '0': makeResult('message-one', 0) } };
    chat[3] = makeAssistantMsg(3, 0);

    // Render both messages' DOMs
    const mesEl1 = createStMessageDom(1, 0);
    const mesEl3 = createStMessageDom(3, 0);
    container.appendChild(mesEl1);
    container.appendChild(mesEl3);

    // Render message 1 footer
    renderFooter(chat, 1);
    expect(mesEl1.querySelector(`.${FOOTER_CLASS}`)).not.toBeNull();

    // Render message 3 (no analysis)
    renderFooter(chat, 3);
    expect(mesEl3.querySelector(`.${FOOTER_CLASS}`)).toBeNull();

    // Message 1 footer still intact
    expect(mesEl1.querySelector(`.${FOOTER_CLASS}`)).not.toBeNull();
  });

  test('CHARACTER_MESSAGE_RENDERED clears pending after consumption', () => {
    setPendingResult(makeResult('consumed', 0));

    const messageId = 7;
    chat[messageId] = makeAssistantMsg(messageId, 0);

    const result = consumePendingResult();
    saveAnalysis(chat, messageId, result);

    // Pending is cleared
    expect(pendingResult).toBeNull();

    // Second CHARACTER_MESSAGE_RENDERED without new analysis
    const mesEl = createStMessageDom(messageId, 0);
    container.appendChild(mesEl);
    renderFooter(chat, messageId);

    // Analysis still present from first save
    expect(chat[messageId]!.extra[ANALYSIS_KEY]['0'].sceneBrief.stance).toBe('consumed');
  });
});

describe('saveAnalysis: per-swipe coexistence', () => {
  test('multiple analyses for different swipes coexist on same message', () => {
    const chat: SpyMessage[] = [];
    chat[0] = makeAssistantMsg(0, 0);

    // Save swipe 0
    chat[0]!.swipe_id = 0;
    chat[0]!.extra = {};
    chat[0]!.extra[ANALYSIS_KEY] = {};
    chat[0]!.extra[ANALYSIS_KEY]['0'] = makeResult('stance-zero', 0);

    // User swipes → new swipe_id
    chat[0]!.swipe_id = 1;

    // Save swipe 1
    chat[0]!.extra[ANALYSIS_KEY]['1'] = makeResult('stance-one', 1);

    // Both coexist
    expect(chat[0]!.extra[ANALYSIS_KEY]['0']).toBeDefined();
    expect(chat[0]!.extra[ANALYSIS_KEY]['0']!.sceneBrief.stance).toBe('stance-zero');
    expect(chat[0]!.extra[ANALYSIS_KEY]['1']).toBeDefined();
    expect(chat[0]!.extra[ANALYSIS_KEY]['1']!.sceneBrief.stance).toBe('stance-one');
  });
});
