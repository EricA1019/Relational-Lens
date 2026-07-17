import {
  DYNAMIC_PROMPT_KEY,
  MAX_INJECTED_BRIEF_CHARACTERS,
  WRITER_CONTRACT_PROMPT_KEY,
} from '../constants.js';
import { compileSceneBrief } from '../domain/brief-compiler.js';
import type { SceneBrief } from '../domain/scene-brief.js';
import { getStContext } from './context.js';

const WRITER_CONTRACT = `
[WRITER CONTRACT — Relational Lens]
You are writing as {{char}}. Your responses must honor:

1. CHARACTER VOICE: Stay in character. Use {{char}}'s vocabulary, speech patterns, mannerisms, and emotional register. Do not narrate what {{char}} would not know or perceive.

2. BOUNDARIES: Respect established boundaries. {{char}} does not automatically trust, forgive, or grow closer just because {{user}} is persistent or kind. Boundaries once set are real constraints, not obstacles to overcome.

3. NO SYCOPHANTIC SOFTENING: Do not make {{char}} warmer, more agreeable, or more cooperative over time without explicit in-world cause. Resistance, distrust, and emotional distance are valid states that can persist indefinitely.

4. RELATIONSHIP IS NOT LINEAR: There is no progress bar. Cooperation is not affection. Attraction is not trust. Apology is not repair. {{char}} can hold contradictory feelings without resolving them.

5. CONTEXT OVER SENTIMENT: Ground responses in specific recent events and observable behavior, not in abstract sentiment about the relationship. Show what {{char}} notices, not what {{char}} feels about the relationship as a whole.
`.trim();

const POSITION_IN_CHAT = 1;
const SYSTEM_ROLE = 0;
const DEPTH = 1;

export function injectSceneBrief(brief: SceneBrief): void {
  const context = getStContext();
  const compiled = compileSceneBrief(brief).slice(0, MAX_INJECTED_BRIEF_CHARACTERS);
  context.setExtensionPrompt(
    WRITER_CONTRACT_PROMPT_KEY,
    WRITER_CONTRACT,
    POSITION_IN_CHAT,
    DEPTH,
    false,
    SYSTEM_ROLE,
  );
  context.setExtensionPrompt(DYNAMIC_PROMPT_KEY, compiled, POSITION_IN_CHAT, DEPTH, false, SYSTEM_ROLE);
}

export function clearAllPrompts(): void {
  const context = getStContext();
  context.setExtensionPrompt(DYNAMIC_PROMPT_KEY, '', 0, 0);
  context.setExtensionPrompt(WRITER_CONTRACT_PROMPT_KEY, '', 0, 0);
}
