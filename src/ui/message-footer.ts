/**
 * Message footer injection — renders Relational Lens analysis
 * into individual message footers (like WTracker's scene tracker).
 *
 * Storage: each assistant message's extra field stores a map of
 *   { [swipeId]: AnalysisResult & { _meta } }
 * so swipes preserve per-response analysis without overwriting.
 */

import type { AnalysisResult } from '../analyst/contracts.js';

const FOOTER_CLASS = 'relational-lens-footer';
const ANALYSIS_KEY = 'relationalLens';

/**
 * Inject analysis footer into a rendered message.
 */
export function injectMessageFooter(messageId: number, result: AnalysisResult, swipeId?: number): void {
  const mesBlock = document.querySelector(`.mes[mesid="${messageId}"]`);
  if (!mesBlock) return;

  const existing = mesBlock.querySelector(`.${FOOTER_CLASS}`);
  if (existing) existing.remove();

  const brief = result.sceneBrief;
  const meta = result._meta;

  const footer = document.createElement('div');
  footer.className = FOOTER_CLASS;
  footer.style.cssText = 'margin-top:0.5rem;padding:0.4rem 0.6rem;border-top:1px solid rgba(255,255,255,0.1);font-size:0.85em;opacity:0.85';

  const items: string[] = [];
  items.push(`<span style="font-weight:600;opacity:0.6;font-size:0.8em">🔍 REL</span>`);
  if (meta) items.push(`<span style="opacity:0.5">#${meta.turnNumber}</span>`);
  if (brief.stance) items.push(`<span style="font-style:italic">${esc(brief.stance)}</span>`);
  if (brief.immediateAim) items.push(`🎯 ${esc(brief.immediateAim)}`);
  if (brief.relevantConstraints?.length) {
    items.push(`🚫 ${esc(brief.relevantConstraints.slice(0, 3).join(', '))}`);
  }
  if (brief.expressionGuidance?.length) {
    items.push(`💬 ${esc(brief.expressionGuidance.slice(0, 2).join('; '))}`);
  }
  if (meta?.timestamp) {
    const ago = Math.round((Date.now() - meta.timestamp) / 1000);
    items.push(`<span style="opacity:0.4;font-size:0.8em">${ago}s ago</span>`);
  }

  footer.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:0.5rem 1rem;align-items:baseline">${items.join('')}</div>`;

  const content = mesBlock.querySelector('.mes_text');
  if (content) content.appendChild(footer);
}

/**
 * Save analysis to the last assistant message's extra field.
 * Uses swipe-aware storage: extra.relationalLens[swipeId] = result.
 */
export function saveAnalysisToMessage(result: AnalysisResult): void {
  try {
    const st = (globalThis as any).SillyTavern;
    if (!st?.getContext) return;
    const ctx = st.getContext();
    const chat = ctx.chat as any[];
    if (!chat?.length) return;

    const lastAssistant = [...chat].reverse().find((m: any) => m?.role === 'assistant' || m?.is_user === false);
    if (!lastAssistant) return;

    const swipeId = result._meta?.swipeId ?? lastAssistant.swipe_id ?? 0;

    if (!lastAssistant.extra) lastAssistant.extra = {};
    if (!lastAssistant.extra[ANALYSIS_KEY]) lastAssistant.extra[ANALYSIS_KEY] = {};
    lastAssistant.extra[ANALYSIS_KEY][String(swipeId)] = result;

    ctx.saveChat?.();
  } catch (e) {
    console.warn('[Relational Lens] save error', e);
  }
}

/**
 * Load analysis for a specific message and swipe.
 */
export function loadAnalysis(chat: any[], messageIndex: number, swipeId: number): AnalysisResult | null {
  try {
    const msg = chat[messageIndex];
    if (!msg?.extra?.[ANALYSIS_KEY]) return null;
    return msg.extra[ANALYSIS_KEY][String(swipeId)] ?? null;
  } catch { return null; }
}

function esc(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
