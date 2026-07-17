import type { AnalysisResult } from './contracts.js';
import { AnalysisResultSchema } from '../domain/runtime-schemas.js';

type MessageObj = {
  content?: string;
  reasoning_content?: string;
};

function responseText(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) return raw;

  if (raw && typeof raw === 'object') {
    const obj = raw as { choices?: Array<{ message?: MessageObj }> };
    const msg = obj.choices?.[0]?.message;
    const content = msg?.content?.trim();
    const reasoning = msg?.reasoning_content?.trim();
    if (content) return content;
    if (reasoning) return reasoning;
    const m = raw as MessageObj;
    if (m.content?.trim()) return m.content;
    if (m.reasoning_content?.trim()) return m.reasoning_content;
  }

  throw new Error('Analyst response did not contain content.');
}

// Walk backwards through JSON-like text to find the last structural comma
// (a comma not inside a string, at depth 0 of braces/brackets).
// Handles incomplete trailing strings (dangling opening quotes).
function lastStructuralComma(s: string): number {
  let depthBrace = 0, depthBracket = 0;
  let i = s.length - 1;

  // Phase 1: skip any incomplete trailing string (dangling opening quote).
  // If the last meaningful char is an unescaped ", it starts a string that
  // never closes. Walk backwards past it so it doesn't trap us in string mode.
  if (i >= 0) {
    while (i >= 0 && (s[i] === ' ' || s[i] === '\n' || s[i] === '\r' || s[i] === '\t')) i--;
    if (i >= 0 && s[i] === '"') {
      let backslashes = 0;
      let j = i - 1;
      while (j >= 0 && s[j] === '\\') { backslashes++; j--; }
      if (backslashes % 2 === 0) i--; // unescaped — skip the dangling opening quote
    }
  }

  // Phase 2: walk backwards tracking structure
  let inString = false;
  for (; i >= 0; i--) {
    const ch = s[i]!;

    if (inString) {
      if (ch === '\\') { i--; continue; } // skip escaped char
      if (ch === '"') { inString = false; }
      continue;
    }

    if (ch === '"') { inString = true; continue; }
    if (ch === '}' || ch === ']') {
      if (ch === '}') depthBrace++; else depthBracket++;
      continue;
    }
    if (ch === '{') { depthBrace--; continue; }
    if (ch === '[') { depthBracket--; continue; }
    if (ch === ',' && depthBrace === 0 && depthBracket === 0) return i;
  }
  return -1;
}

// Close any open structures (braces, brackets, strings) in a JSON fragment.
function closeStructures(s: string): string {
  let depthBrace = 0, depthBracket = 0, inString = false, escaped = false;
  for (const ch of s) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depthBrace++;
    else if (ch === '}') depthBrace--;
    else if (ch === '[') depthBracket++;
    else if (ch === ']') depthBracket--;
  }
  if (inString) s += '"';
  for (let i = 0; i < depthBracket; i++) s += ']';
  for (let i = 0; i < depthBrace; i++) s += '}';
  return s;
}

function extractJSON(text: string): string {
  // 1. Try code fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = (fenced?.[1] ?? text).trim();

  // 2. Strip non-JSON prefix
  const firstBrace = candidate.indexOf('{');
  const firstBracket = candidate.indexOf('[');
  const startIdx = firstBrace >= 0 && firstBracket >= 0
    ? Math.min(firstBrace, firstBracket)
    : Math.max(firstBrace, firstBracket);
  if (startIdx > 0) candidate = candidate.slice(startIdx);

  // 3. Try parsing as-is
  try { JSON.parse(candidate); return candidate; } catch {}

  // 4. Repair: find last structural comma, check for dangling key after it
  const lastComma = lastStructuralComma(candidate);
  if (lastComma > 0) {
    const afterComma = candidate.slice(lastComma + 1).trim();
    // Dangling key: starts with " but has no : (e.g. "sceneBrief without value)
    if (afterComma.startsWith('"') && afterComma.indexOf(':') < 0) {
      candidate = candidate.slice(0, lastComma);
    }
  }

  // 5. Close open structures
  candidate = closeStructures(candidate);
  try { JSON.parse(candidate); return candidate; } catch {}

  // 6. Last resort: try progressively shorter prefixes
  for (let i = candidate.length - 1; i > 1; i--) {
    try {
      JSON.parse(candidate.slice(0, i));
      return candidate.slice(0, i);
    } catch {}
  }

  return candidate;
}

export function parseAnalysisResponse(raw: unknown): AnalysisResult {
  const text = responseText(raw);
  const extracted = extractJSON(text);

  const parse = (json: string): AnalysisResult => {
    const parsed = JSON.parse(json);
    // Coerce: model sometimes returns strings where arrays are expected
    return AnalysisResultSchema.parse(coerceAnalysis(parsed)) as AnalysisResult;
  };

  try {
    return parse(extracted);
  } catch (firstError) {
    if (raw && typeof raw === 'object') {
      const obj = raw as { choices?: Array<{ message?: MessageObj }> };
      const reasoning = obj.choices?.[0]?.message?.reasoning_content?.trim();
      if (reasoning && reasoning !== text) {
        const extracted2 = extractJSON(reasoning);
        return parse(extracted2);
      }
    }
    throw firstError;
  }
}

/** Coerce model output: turn objects/strings in arrays into plain strings. */
function coerceAnalysis(raw: Record<string, unknown>): Record<string, unknown> {
  // Coerce sceneBrief array fields
  const sb = raw.sceneBrief as Record<string, unknown> | undefined;
  if (sb) {
    for (const field of ['relevantConstraints', 'expressionGuidance']) {
      if (typeof sb[field] === 'string') sb[field] = [sb[field]];
    }
  }
  // Coerce observedTurn: ensure array fields contain only strings
  const ot = raw.observedTurn as Record<string, unknown> | undefined;
  if (ot) {
    for (const field of ['observableActions', 'spokenClaims', 'commitments', 'boundaries', 'ambiguities']) {
      const val = ot[field];
      if (typeof val === 'string') {
        ot[field] = [val];
      } else if (Array.isArray(val)) {
        ot[field] = val.map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            // Flatten object to string: pick first meaningful value
            const entries = Object.entries(item as Record<string, unknown>);
            return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
          }
          return String(item);
        });
      }
    }
  }
  // Coerce patch
  if (!Array.isArray(raw.patch)) {
    raw.patch = [];
  }
  return raw;
}
