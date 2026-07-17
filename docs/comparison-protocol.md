# Relational Lens — Alpha 0 Comparison Protocol

**Purpose**: Prove that scene briefs (config 3) materially improve character consistency over a static writer contract alone (config 2), as measured by blind human preference ratings across 12 narrative scenarios.

**Gate**: If config 3 does NOT outperform config 2, iterate on prompts/compiler until it does. Do NOT proceed to Alpha 1 until the gate passes.

---

## 1. Test Configurations

| Config | Name | Analyst | Prompt Injection | Description |
|--------|------|---------|-----------------|-------------|
| **1** | Bare baseline | None | None | GLM generates responses with no relational guidance at all |
| **2** | Static contract | None | Writer contract only | A static, hand-written writer contract injected as a system prompt. No per-turn analysis. |
| **3** | Scene brief | Cloud API (live) | Scene brief + contract | Full Relational Lens pipeline: analyst produces per-turn scene brief, compiled with static contract |
| **4** | Persistent state | Cloud API (live) | Scene brief + contract + durable state | *(Alpha 1 only — deferred)* Analyst produces both scene brief and durable patches |

Configs 1-3 are tested in Alpha 0. Config 4 is deferred to Alpha 1.

---

## 2. Static Writer Contract (Config 2 Baseline)

The static writer contract is a hand-crafted system prompt injected at `system` position with `before` placement. It describes the character's voice, boundaries, and relationship dynamics without any per-turn adaptation:

```text
[WRITER CONTRACT — Relational Lens]
You are writing as {character}. Your responses must honor:

1. CHARACTER VOICE: Stay in character. Use {character}'s vocabulary, speech patterns, mannerisms, and emotional register. Do not narrate what {character} would not know or perceive.

2. BOUNDARIES: Respect established boundaries. {character} does not automatically trust, forgive, or grow closer just because the user is persistent or kind. Boundaries once set are real constraints, not obstacles to overcome.

3. NO SYCOPHANTIC SOFTENING: Do not make {character} warmer, more agreeable, or more cooperative over time without explicit in-world cause. Resistance, distrust, and emotional distance are valid states that can persist indefinitely.

4. RELATIONSHIP IS NOT LINEAR: There is no progress bar. Cooperation is not affection. Attraction is not trust. Apology is not repair. {character} can hold contradictory feelings without resolving them.

5. CONTEXT OVER SENTIMENT: Ground responses in specific recent events and observable behavior, not in abstract sentiment about the relationship. Show what {character} notices, not what {character} feels about the relationship as a whole.
```

For config 2, this contract is injected via `setExtensionPrompt()` and never updated. It serves as the static baseline that scene briefs must outperform.

---

## 3. Blind Preference Rating Form

For each scenario × config pair, the evaluator rates the GLM's response on three dimensions using a 1-5 Likert scale:

### Dimension 1: Character Consistency
> "Does the response stay true to the character's established voice, mannerisms, and knowledge boundaries?"

| Score | Label | Description |
|-------|-------|-------------|
| 1 | Broken | Character is unrecognizable, wildly out of voice, or knows things they shouldn't |
| 2 | Weak | Character voice is inconsistent or drifts noticeably within the response |
| 3 | Adequate | Character is recognizable but generic; could be any character in this genre |
| 4 | Strong | Character voice is distinct and consistent; only minor quibbles |
| 5 | Perfect | Response is unmistakably this character; voice, knowledge, and mannerisms are precise |

### Dimension 2: Boundary Preservation
> "Does the response respect established boundaries, or does it soften/erode them?"

| Score | Label | Description |
|-------|-------|-------------|
| 1 | Erased | Previously established boundaries are ignored or contradicted |
| 2 | Leaky | Boundaries are acknowledged but softened without cause |
| 3 | Neutral | Boundaries neither reinforced nor violated; neutral stance |
| 4 | Respected | Boundaries are visibly maintained; character acts consistently with constraints |
| 5 | Reinforced | Boundaries are actively upheld; character enforces them when tested |

### Dimension 3: Sycophancy Resistance
> "Does the response avoid unearned warmth, agreement, or cooperation?"

| Score | Label | Description |
|-------|-------|-------------|
| 1 | Sycophantic | Character is warm/agreeable/cooperative without in-world cause; response reads as people-pleasing |
| 2 | Softened | Slight unearned softening; edges rounded off |
| 3 | Neutral | Neither sycophantic nor resistant; even tone |
| 4 | Resistant | Character maintains appropriate distance; cooperation requires cause |
| 5 | Steadfast | Character is unmoved by user persistence/kindness without in-world justification |

### Composite Score
Sum of three dimensions (range 3-15). The scenario is rated for each config independently. Ratings are blind — the evaluator should not know which config produced which response.

---

## 4. Scenario Corpus (12 Scenarios)

Each scenario is a short narrative script with ~6-12 messages. Scenarios are designed to probe specific failure modes:

| # | Fixture | Tests |
|---|---------|-------|
| 1 | `no-change-small-talk` | Does the analyst correctly produce "no change needed" when nothing happens? |
| 2 | `betrayal-followed-by-kindness` | Does {character} resist unearned softening after betrayal? |
| 3 | `attraction-with-declining-trust` | Can attraction and trust move in opposite directions? |
| 4 | `fear-based-cooperation` | Is cooperation correctly attributed to fear, not affection? |
| 5 | `apology-without-repair` | Does the analyst flag that apology ≠ repair? |
| 6 | `rivalry-with-respect` | Can rivalry and respect coexist without "growing closer"? |
| 7 | `narrator-only-knowledge` | Does the brief filter narrator-knowledge from character-knowledge? |
| 8 | `unfair-misinterpretation` | Can the analyst flag misinterpretation without making {character} "understand"? |
| 9 | `public-warmth-private-distance` | Does the brief capture dual-mode behavior? |
| 10 | `repeated-boundary-pressure` | Does the analyst flag repeated boundary testing? |
| 11 | `sudden-revision-event` | How does the analyst handle a single event that should revise durable state? |
| 12 | `praise-no-effect` | Does praise produce sycophantic softening? |

Fixtures live in `tests/scenarios/`. Each fixture has:
```json
{
  "name": "scenario-name",
  "description": "What this scenario tests",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "expectedQualities": ["boundary-respected", "no-sycophantic-softening"],
  "forbiddenConclusions": ["trust improved", "growing closer", "bond deepened"]
}
```

---

## 5. Execution Procedure

### 5.1 Setup
1. Ensure Relational Lens extension is installed and enabled in ST
2. Select a cloud Chat Completion profile as the analyst (Settings → Analyst profile)
3. Enable debug logging in Relational Lens settings
4. Have the static writer contract text ready for config 2 injection

### 5.2 Per-Scenario Protocol
For each of the 12 scenarios, run all 3 configs:

1. **Load scenario**: Paste the scenario messages into a fresh ST chat with a test character
2. **Apply config**:
   - Config 1: Disable Relational Lens extension entirely. No prompts injected.
   - Config 2: Use `setExtensionPrompt()` to inject the static writer contract. Disable analysis.
   - Config 3: Enable Relational Lens. Let the full pipeline run.
3. **Generate**: Send a new user message that continues the scenario naturally. Capture the GLM's response.
4. **Blind-label**: Assign each response a random label (A, B, C) so the evaluator doesn't know which config produced it
5. **Rate**: Evaluator fills in the rating form for each blind-labeled response
6. **Record**: Enter scores into the results matrix (Section 6)

### 5.3 Output Capture
For each config per scenario, capture:
- The GLM's generated response text
- (Config 3 only) The compiled scene brief text (from debug log)
- (Config 3 only) The raw analyst JSON response (from debug log)
- Any errors or warnings

---

## 6. Results Matrix

| Scenario | Config 1 (Bare) | Config 2 (Static) | Config 3 (Brief) | Winner |
|----------|-----------------|-------------------|------------------|--------|
| | C / B / S = T | C / B / S = T | C / B / S = T | |
| 1. no-change-small-talk | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 2. betrayal+kindness | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 3. attraction-distrust | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 4. fear-cooperation | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 5. apology-no-repair | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 6. rivalry-respect | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 7. narrator-knowledge | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 8. unfair-misinterpret | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 9. public-private | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 10. boundary-pressure | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 11. sudden-revision | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| 12. praise-no-effect | _ / _ / _ = __ | _ / _ / _ = __ | _ / _ / _ = __ | |
| **AVERAGE** | __ | __ | __ | |

*C = Character Consistency, B = Boundary Preservation, S = Sycophancy Resistance, T = Total (sum)*

---

## 7. Pass/Fail Criteria

### Gate: Config 3 MUST outperform Config 2 by ≥2 points average total score

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Average total score (C3 > C2) | ≥ 2.0 point advantage | Mean of 12 scenario totals |
| Scenario win rate | C3 wins ≥ 8/12 scenarios | Head-to-head per scenario |
| Worst-case scenario | C3 never scores below C2 by >1 point | Max deficit in any single scenario |
| Degradation check | C3 ≥ C1 in all 12 scenarios | No scenario where briefs make things worse than bare |

### If Gate Fails
1. Review the 3 lowest-scoring scenarios for config 3
2. Check raw analyst JSON output — is the scene brief capturing the right dynamics?
3. Tune the system prompt (`src/analyst/system-prompt.ts`) — adjust instructions, add forbidden patterns
4. Tune the brief compiler (`src/domain/brief-compiler.ts`) — adjust how `TurnObservation` maps to brief text
5. Re-run affected scenarios, not the full corpus
6. Repeat until gate passes

---

## 8. Alpha 0 Acceptance Criteria (Design Doc Section 18)

| # | Criterion | Status | Verification |
|---|-----------|--------|-------------|
| 1 | Extension installs and loads in ST extension format | ☐ | `manifest.json` valid, extension appears in ST Extensions panel |
| 2 | User can select a Chat Completion Connection Profile | ☐ | Dropdown populated, profile selectable in settings |
| 3 | Analyst runs without changing active GLM connection | ☐ | Active model unchanged after analysis completes |
| 4 | Exactly one analyst call per new canonical user turn | ☐ | Debug log shows 1 API call per user message (not per swipe) |
| 5 | Swipes and regenerations reuse cached result | ☐ | Debug log shows cache hit on swipe/regenerate |
| 6 | All analyst failures fail open | ☐ | Generation continues normally when analyst errors |
| 7 | Compiled brief hidden from visible chat | ☐ | Brief injected as system prompt, not visible to user |
| 8 | Debug identifies failure origin | ☐ | Error messages name: assembly / model / parsing / injection |
| 9 | **Scene briefs > static contract** | ☐ | **Comparison protocol results (Section 6-7)** |
| 10 | Group chat shows UX indication | ☐ | Status text: "not available in group chats" |

---

## 9. Test Character

Use a character with:
- Distinct voice and mannerisms (not generic)
- Established boundaries (not instantly trusting/warm)
- Some history/tension with the user persona
- Enough depth that sycophantic softening would be noticeable

Recommended: Create a simple test character with a clear boundary (e.g., "does not trust easily after being betrayed") and run all 12 scenarios against it. Consistency of character across scenarios is more important than scenario-specific tuning.

---

## 10. Appendix: Quick-Run Checklist

```
[ ] 1. Relational Lens installed and enabled
[ ] 2. Cloud analyst profile selected
[ ] 3. Debug logging enabled
[ ] 4. Test character loaded in ST
[ ] 5. Static writer contract text saved for config 2
[ ] 6. For each scenario (1-12):
  [ ] a. Load scenario messages into fresh chat
  [ ] b. Run config 1 (bare): capture response → label blindly
  [ ] c. Run config 2 (static contract): capture response → label blindly
  [ ] d. Run config 3 (scene brief): capture response → label blindly
  [ ] e. Rate all 3 blind-labeled responses
  [ ] f. Record scores in results matrix
[ ] 7. Calculate averages, determine gate pass/fail
[ ] 8. Document findings, iterate if needed
```
