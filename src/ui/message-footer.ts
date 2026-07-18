/**
 * Message footer injection — renders Relational Lens analysis
 * into individual message footers (like WTracker's scene tracker).
 */

import type { AnalysisResult } from '../analyst/contracts.js';

const FOOTER_CLASS = 'relational-lens-footer';
const ANALYSIS_KEY = 'relationalLens';

/**
 * Inject analysis footer into a rendered message.
 * Call from CHARACTER_MESSAGE_RENDERED handler.
 */
export function injectMessageFooter(messageId: number, result: AnalysisResult): void {
  const mesBlock = document.querySelector(`.mes[mesid="${messageId}"]`);
  if (!mesBlock) return;

  // Remove existing footer if present
  const existing = mesBlock.querySelector(`.${FOOTER_CLASS}`);
  if (existing) existing.remove();

  const brief = result.sceneBrief;
  const turn = result.observedTurn;

  const footer = document.createElement('div');
  footer.className = FOOTER_CLASS;
  footer.style.cssText = 'margin-top:0.5rem;padding:0.4rem 0.6rem;border-top:1px solid rgba(255,255,255,0.1);font-size:0.85em;opacity:0.85';

  const items: string[] = [];
  if (brief.stance) items.push(`<span style="font-style:italic">${esc(brief.stance)}</span>`);
  if (brief.immediateAim) items.push(`🎯 ${esc(brief.immediateAim)}`);
  if (brief.relevantConstraints?.length) {
    items.push(`🚫 ${esc(brief.relevantConstraints.slice(0, 3).join(', '))}`);
  }
  if (brief.expressionGuidance?.length) {
    items.push(`💬 ${esc(brief.expressionGuidance.slice(0, 2).join('; '))}`);
  }

  footer.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:0.5rem 1rem;align-items:baseline">
      <span style="font-weight:600;opacity:0.6;font-size:0.8em">🔍 REL</span>
      ${items.map(i => `<span>${i}</span>`).join('')}
    </div>
  `;

  // Append to message content area
  const content = mesBlock.querySelector('.mes_text');
  if (content) {
    content.appendChild(footer);
  }
}

/**
 * Save analysis to the last assistant message's extra field.
 */
export function saveAnalysisToMessage(result: AnalysisResult): void {
  try {
    const st = (globalThis as any).SillyTavern;
    if (!st?.getContext) return;
    const ctx = st.getContext();
    const chat = ctx.chat as any[];
    if (!chat?.length) return;

    // Find last assistant message
    const lastAssistant = [...chat].reverse().find((m: any) => m?.role === 'assistant' || m?.is_user === false);
    if (!lastAssistant) return;

    // Store analysis in message extra
    if (!lastAssistant.extra) lastAssistant.extra = {};
    lastAssistant.extra[ANALYSIS_KEY] = result;

    // Trigger ST save
    ctx.saveChat?.();
  } catch (e) {
    console.warn('[Relational Lens] Could not save analysis to message', e);
  }
}

function esc(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
