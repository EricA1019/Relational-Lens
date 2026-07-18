/**
 * Message footer injection — renders Relational Lens analysis
 * into individual message footers inside .mes_text.
 *
 * Correct ST lifecycle:
 * 1. generate_interceptor fires → analysis stored as "pending"
 * 2. CHARACTER_MESSAGE_RENDERED(messageId) fires →
 *    saveAnalysisToMessage(messageId, result) → renderAnalysisFooter(messageId)
 * 3. MESSAGE_SWIPED(mesId) fires → renderAnalysisFooter(mesId)
 *
 * ST DOM: .mes[mesid="X"] > .mes_block > .mes_text
 * Storage: chat[mesId].extra.relationalLens[swipeId] = result
 */

import type { AnalysisResult } from '../analyst/contracts.js';

const FOOTER_CLASS = 'relational-lens-footer';
const ANALYSIS_KEY = 'relationalLens';

/**
 * Render the analysis footer for a specific message.
 * Reads chat[mesId].extra.relationalLens[chat[mesId].swipe_id]
 * and injects into .mes[mesid="X"] .mes_text.
 */
export function renderAnalysisFooter(mesId: number): void {
  try {
    const st = (globalThis as any).SillyTavern;
    if (!st?.getContext) { console.warn('[RL] renderAnalysisFooter: no ST.getContext'); return; }
    const ctx = st.getContext();
    const chat = ctx.chat as any[];
    if (!chat?.length || mesId < 0 || mesId >= chat.length) {
      console.warn('[RL] renderAnalysisFooter: bad mesId', { mesId, chatLen: chat?.length });
      return;
    }

    const msg = chat[mesId];
    if (!msg) { console.warn('[RL] renderAnalysisFooter: no msg at index', mesId); return; }
    // ST uses is_user (boolean), not role — assistant messages have is_user: false/undefined
    if (msg.is_user !== false && msg.is_user !== undefined) {
      console.warn('[RL] renderAnalysisFooter: not assistant', { is_user: msg.is_user, mesId });
      return;
    }

    // Find the DOM element — ST uses lowercase "mesid" attribute
    const mesEl = document.querySelector(`.mes[mesid="${mesId}"]`);
    if (!mesEl) { console.warn('[RL] renderAnalysisFooter: .mes not found in DOM', { mesId }); return; }

    // Remove existing footer
    mesEl.querySelector(`.${FOOTER_CLASS}`)?.remove();

    // Read analysis for current swipe — fall back to any available
    const swipeId = msg.swipe_id ?? 0;
    const stored = msg.extra?.[ANALYSIS_KEY];
    const result: AnalysisResult | null =
      stored?.[String(swipeId)] ??
      (stored ? Object.values(stored)[0] as AnalysisResult : null) ??
      null;

    if (!result) { console.warn('[RL] renderAnalysisFooter: no analysis for swipe', { mesId, swipeId, keys: Object.keys(msg.extra?.[ANALYSIS_KEY] ?? {}) }); return; }

    console.warn('[RL] renderAnalysisFooter: RENDERING', { mesId, swipeId, stance: result.sceneBrief.stance });

    const brief = result.sceneBrief;
    const meta = result._meta;

    const footer = document.createElement('div');
    footer.className = FOOTER_CLASS;
    footer.style.cssText =
      'margin-top:0.5rem;padding:0.4rem 0.6rem;border-top:1px solid rgba(255,255,255,0.1);font-size:0.85em;opacity:0.85;line-height:1.5';

    const lines: string[] = [];
    const label = (icon: string, text: string) =>
      `<span style="opacity:0.6;font-size:0.8em;font-weight:600">${icon}</span> <span>${esc(text)}</span>`;

    if (meta) lines.push(`<span style="opacity:0.5;font-size:0.75em">#${meta.turnNumber}</span>`);
    if (brief.stance) lines.push(label('🎭', brief.stance));
    if (brief.immediateAim) lines.push(label('🎯', brief.immediateAim));
    if (brief.relevantConstraints?.length) {
      lines.push(label('🚫', brief.relevantConstraints.slice(0, 3).join('; ')));
    }
    if (brief.expressionGuidance?.length) {
      lines.push(label('💬', brief.expressionGuidance.slice(0, 2).join('; ')));
    }

    footer.innerHTML = `<div style="display:flex;flex-direction:column;gap:0.15rem">${lines.join('')}</div>`;

    // Inject into .mes_text (inside .mes_block, inside .mes)
    const mesText = mesEl.querySelector('.mes_text');
    if (mesText) {
      mesText.appendChild(footer);
      console.warn('[RL] renderAnalysisFooter: ✅ footer appended');
    } else {
      console.warn('[RL] renderAnalysisFooter: .mes_text not found in .mes', { mesId });
    }
  } catch (e) {
    console.warn('[RL] renderAnalysisFooter error', e);
  }
}

/**
 * Save analysis to chat[mesId].extra.relationalLens[swipeId].
 * Called from CHARACTER_MESSAGE_RENDERED handler.
 */
export function saveAnalysisToMessage(mesId: number, result: AnalysisResult): void {
  try {
    const st = (globalThis as any).SillyTavern;
    if (!st?.getContext) return;
    const ctx = st.getContext();
    const chat = ctx.chat as any[];
    if (!chat?.length || mesId < 0 || mesId >= chat.length) return;

    const msg = chat[mesId];
    if (!msg) return;

    const swipeId = msg.swipe_id ?? 0;

    if (!msg.extra) msg.extra = {};
    if (!msg.extra[ANALYSIS_KEY]) msg.extra[ANALYSIS_KEY] = {};
    msg.extra[ANALYSIS_KEY][String(swipeId)] = result;

    ctx.saveChat?.();
  } catch (e) {
    console.warn('[Relational Lens] save error', e);
  }
}

/**
 * Load analysis for a specific message and swipe.
 */
export function loadAnalysis(
  chat: any[],
  messageIndex: number,
  swipeId: number,
): AnalysisResult | null {
  try {
    const msg = chat[messageIndex];
    if (!msg?.extra?.[ANALYSIS_KEY]) return null;
    return msg.extra[ANALYSIS_KEY][String(swipeId)] ?? null;
  } catch {
    return null;
  }
}

function esc(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
