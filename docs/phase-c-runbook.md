# Phase C2 Runbook — Manual Comparison Execution

This is the hands-on portion of Phase C that requires live ST interaction. The code-level verification is complete (criteria 1-8, 10). Criterion 9 (scene briefs > static contract) requires human evaluation.

## Prerequisites

- [ ] ST running with Relational Lens extension enabled
- [ ] Cloud analyst profile selected in Relational Lens settings
- [ ] Debug logging enabled in Relational Lens settings
- [ ] Test character loaded (see below)
- [ ] `docs/comparison-protocol.md` open for the rating form

## Test Character Setup

Create a character with:
- A name and distinct personality
- At least one clear boundary (e.g., "does not forgive easily", "distrusts strangers")
- Some tension with the user persona

For consistency, use the SAME character for all 12 scenarios.

## Per-Scenario Protocol

For each of the 12 scenarios, repeat this cycle:

### 1. Start Fresh
- Open a NEW chat with the test character
- Paste the scenario's opening messages to establish context
- Send 1-2 messages to establish the scenario dynamic

### 2. Run Config 1 (Bare Baseline)
- **Disable** Relational Lens in settings (uncheck "Enable")
- Send a continuation message that naturally extends the scenario
- **Capture** the GLM's response → save with label "A-{scenario#}"
- Re-record the label mapping in a separate file (so ratings are blind)

### 3. Run Config 2 (Static Contract)
- Keep Relational Lens **disabled**
- Manually inject the static writer contract (see below) as the character's system prompt or author's note
- Start a NEW chat, paste the same scenario messages
- Send the SAME continuation message
- **Capture** the GLM's response → save with label "B-{scenario#}"

### 4. Run Config 3 (Scene Brief + Contract)
- **Enable** Relational Lens in settings
- Start a NEW chat, paste the same scenario messages
- Wait for the analyst to complete (check debug console for "analyst succeeded")
- Send the SAME continuation message
- **Capture** the GLM's response → save with label "C-{scenario#}"

### 5. Blind Rate
- Shuffle the labels A/B/C for this scenario
- For each response, fill in the rating form (3 dimensions × 1-5):
  - **Character Consistency**: Does it stay in voice?
  - **Boundary Preservation**: Are boundaries respected?
  - **Sycophancy Resistance**: Is warmth/agreement earned?
- Record in `comparison-protocol.md` Section 6 matrix

### 6. Check Analyst Output (Config 3 only)
- In browser console, check for `[Relational Lens] analyst succeeded` messages
- Note the `stance` value — does it match the scenario?
- If the analyst produced unexpected output, note it for C4 iteration

## Static Writer Contract for Manual Injection

For Config 2, inject this as a system prompt:

```
[WRITER CONTRACT — Relational Lens]
You are writing as {{char}}. Your responses must honor:

1. CHARACTER VOICE: Stay in character. Use {{char}}'s vocabulary, speech patterns, mannerisms, and emotional register. Do not narrate what {{char}} would not know or perceive.

2. BOUNDARIES: Respect established boundaries. {{char}} does not automatically trust, forgive, or grow closer just because {{user}} is persistent or kind. Boundaries once set are real constraints, not obstacles to overcome.

3. NO SYCOPHANTIC SOFTENING: Do not make {{char}} warmer, more agreeable, or more cooperative over time without explicit in-world cause. Resistance, distrust, and emotional distance are valid states that can persist indefinitely.

4. RELATIONSHIP IS NOT LINEAR: There is no progress bar. Cooperation is not affection. Attraction is not trust. Apology is not repair. {{char}} can hold contradictory feelings without resolving them.

5. CONTEXT OVER SENTIMENT: Ground responses in specific recent events and observable behavior, not in abstract sentiment about the relationship. Show what {{char}} notices, not what {{char}} feels about the relationship as a whole.
```

## Scenario Quick Reference

| # | Scenario | Key Test |
|---|----------|----------|
| 1 | no-change-small-talk | No false change from small talk |
| 2 | betrayal-followed-by-kindness | No unearned softening after betrayal |
| 3 | attraction-with-declining-trust | Attraction ≠ trust |
| 4 | fear-based-cooperation | Cooperation from fear, not warmth |
| 5 | apology-without-repair | Apology ≠ repair |
| 6 | rivalry-with-respect | Rivalry + respect without closeness |
| 7 | narrator-only-knowledge | Character ≠ narrator knowledge |
| 8 | unfair-misinterpretation | No forced "understanding" |
| 9 | public-warmth-private-distance | Dual-mode behavior |
| 10 | repeated-boundary-pressure | Boundary testing detection |
| 11 | sudden-revision-event | Single-event state revision |
| 12 | praise-no-effect | Praise → no sycophancy |

## After All 12 Scenarios

1. Unblind the labels
2. Fill in the results matrix in `docs/comparison-protocol.md`
3. Calculate:
   - Average total score for each config
   - C3 vs C2 head-to-head win rate
   - Any scenario where C3 scores below C2
4. Determine gate pass/fail:
   - ✅ PASS: C3 average ≥ C2 average + 2.0, C3 wins ≥ 8/12, no degradation below bare
   - ❌ FAIL: Any criterion not met → proceed to C4 iteration

## C4 Iteration Triggers

If the gate fails, check:
1. **Analyst output quality**: Is the scene brief capturing the right dynamics? Check debug console.
2. **System prompt tuning**: Edit `src/analyst/system-prompt.ts` to adjust analyst behavior.
3. **Brief compiler**: Edit `src/domain/brief-compiler.ts` if brief format doesn't help the GLM.
4. **Writer contract**: Edit `src/st/prompt-injection.ts` if the static contract itself needs tuning.

After each change, re-run only the FAILING scenarios (not all 12). Deploy via `npm run deploy` and reload ST.
