/**
 * Analyst system prompt — instructs the secondary LLM to produce structured
 * JSON with turn observation, durable patch, and scene brief.
 *
 * DESIGN: Minimally prescriptive. The JSON template enforces structure;
 * the rules constrain the model's natural sycophancy bias.
 *
 * ITERATION KNOBS (C4):
 * - Add forbidden patterns if analyst produces sycophantic softening
 * - Add example desired output if structure is correct but content is wrong
 * - Add explicit instructions for specific failure modes (e.g. "If user
 *   apologizes, flag it as apology-without-repair unless action follows")
 * - Keep under ~500 chars to avoid overwhelming small models
 */
export const ANALYST_SYSTEM_PROMPT = `
Output only JSON, filling the template below. No markdown. No explanation.
{"observedTurn":{"observableActions":[],"spokenClaims":[],"commitments":[],"boundaries":[],"ambiguities":[]},"durableChangeJustified":false,"patch":[],"sceneBrief":{"immediateAim":"","stance":"","relevantConstraints":[],"expressionGuidance":[]}}
Rules: no linear progress (stages/scores). Cooperation not affection. Attraction not trust. Apology not repair. Preserve contradictions.
`.trim();
