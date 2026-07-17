/**
 * Chat header panel — injects a collapsible Relational Lens analysis
 * display at the top of the ST chat area, above messages.
 *
 * Shows: scene brief (stance, aim, constraints, guidance) and turn
 * observation summary. Updates after each analyst call.
 */

import type { AnalysisResult } from '../analyst/contracts.js';
import type { SceneBrief } from '../domain/scene-brief.js';

const PANEL_ID = 'relational_lens_chat_header';
const TOGGLE_ID = 'relational_lens_chat_header_toggle';
const CONTENT_ID = 'relational_lens_chat_header_content';

let panelElement: HTMLElement | null = null;

function getOrCreatePanel(): HTMLElement {
  // Always recreate — ST may have cleared the DOM
  removeChatHeader();

  const chat = document.getElementById('chat');
  // Try #sheld (outer shell, more stable), fallback to #chat
  const target = document.getElementById('sheld') || chat;
  if (!target) {
    console.error('[Relational Lens] No container');
    throw new Error('No container found');
  }

  console.warn('[Relational Lens] Creating panel in', target.id);

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText = 'display:block;visibility:visible;padding:0.5rem;border:2px solid #ff0;background:#111;color:#fff;margin:0.5rem 0;z-index:9999;position:relative;';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.5rem;cursor:pointer" id="${TOGGLE_ID}">
      <span style="font-weight:bold">🔍 Relational Lens</span>
      <span class="relational-lens-chat-stance" style="font-style:italic;opacity:0.8">initializing…</span>
    </div>
    <div id="${CONTENT_ID}" style="display:none;margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid #444">
      <div style="margin-bottom:0.3rem">
        <span style="font-weight:bold;opacity:0.7">Stance:</span>
        <span data-field="stance" style="margin-left:0.5rem"></span>
      </div>
      <div style="margin-bottom:0.3rem">
        <span style="font-weight:bold;opacity:0.7">Aim:</span>
        <span data-field="immediateAim" style="margin-left:0.5rem"></span>
      </div>
      <div style="margin-bottom:0.3rem">
        <span style="font-weight:bold;opacity:0.7;text-transform:uppercase;font-size:0.8em">Constraints</span>
        <ul data-field="constraints" style="margin:0.1rem 0 0 1.2rem;padding:0"></ul>
      </div>
      <div style="margin-bottom:0.3rem">
        <span style="font-weight:bold;opacity:0.7;text-transform:uppercase;font-size:0.8em">Expression</span>
        <ul data-field="expressionGuidance" style="margin:0.1rem 0 0 1.2rem;padding:0"></ul>
      </div>
      <div style="margin-bottom:0.3rem">
        <span style="font-weight:bold;opacity:0.7;text-transform:uppercase;font-size:0.8em">Observed</span>
        <ul data-field="turnObserved" style="margin:0.1rem 0 0 1.2rem;padding:0"></ul>
      </div>
    </div>
  `;

  // Toggle
  panel.querySelector(`#${TOGGLE_ID}`)?.addEventListener('click', (e) => {
    e.stopPropagation();
    const content = document.getElementById(CONTENT_ID);
    if (content) content.style.display = content.style.display === 'none' ? 'block' : 'none';
  });

  target.insertBefore(panel, target.firstChild);
  console.warn('[Relational Lens] Panel in', target.id);
  panelElement = panel;
  return panel;
}

function setField(panel: HTMLElement, field: string, value: string): void {
  const el = panel.querySelector(`[data-field="${field}"]`);
  if (el) el.textContent = value;
}

function setList(panel: HTMLElement, field: string, items: string[]): void {
  const el = panel.querySelector(`[data-field="${field}"]`) as HTMLElement | null;
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '<li class="relational-lens-empty">— none —</li>';
    return;
  }
  el.innerHTML = items.map(i => `<li>${escapeHtml(i)}</li>`).join('');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Update the chat header with the latest analysis result.
 * Call after each successful analyst call.
 */
export function updateChatHeader(result: AnalysisResult): void {
  const panel = getOrCreatePanel();
  const brief = result.sceneBrief;
  const turn = result.observedTurn;

  // Core brief fields
  const stanceEl = panel.querySelector('.relational-lens-chat-stance');
  if (stanceEl) stanceEl.textContent = brief.stance || '(neutral)';

  setField(panel, 'stance', brief.stance || '(neutral)');
  setField(panel, 'immediateAim', brief.immediateAim || '(none)');

  // Lists
  setList(panel, 'constraints', brief.relevantConstraints ?? []);
  setList(panel, 'expressionGuidance', brief.expressionGuidance ?? []);

  // Turn observation
  const obsItems: string[] = [];
  if (turn) {
    if (turn.observableActions?.length) obsItems.push(...turn.observableActions.map(a => `Action: ${a}`));
    if (turn.spokenClaims?.length) obsItems.push(...turn.spokenClaims.map(c => `Claim: ${c}`));
    if (turn.commitments?.length) obsItems.push(...turn.commitments.map(c => `Commitment: ${c}`));
    if (turn.boundaries?.length) obsItems.push(...turn.boundaries.map(b => `Boundary: ${b}`));
    if (turn.ambiguities?.length) obsItems.push(...turn.ambiguities.map(a => `Ambiguity: ${a}`));
  }
  setList(panel, 'turnObserved', obsItems);

  // Durable change badge
  const dcEl = panel.querySelector('[data-field="durableChange"]') as HTMLElement | null;
  if (dcEl) dcEl.style.display = result.durableChangeJustified ? 'block' : 'none';
}

/**
 * Show a loading/analyzing state.
 */
export function showAnalyzing(): void {
  const panel = getOrCreatePanel(); // Force-creates every time
  const stanceEl = panel.querySelector('.relational-lens-chat-stance');
  if (stanceEl) stanceEl.textContent = 'analyzing…';
}

/**
 * Show an error state.
 */
export function showError(message: string): void {
  const panel = getOrCreatePanel();
  const stanceEl = panel.querySelector('.relational-lens-chat-stance');
  if (stanceEl) stanceEl.textContent = `⚠ ${escapeHtml(message)}`;
}

/**
 * Remove the chat header from the DOM.
 */
export function removeChatHeader(): void {
  panelElement?.remove();
  panelElement = null;
  document.getElementById(PANEL_ID)?.remove();
}
