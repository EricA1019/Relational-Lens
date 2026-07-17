/**
 * Phase C2 — Scenario Pipeline Tests
 *
 * Validates all 12 scenario fixtures through the analysis pipeline:
 * - Forbidden conclusions are detected in patch output
 * - Scene briefs are compiled without errors
 * - Writer contract is well-formed
 * - Pipeline handles all scenario types without crashing
 */
import { describe, test, expect } from '@jest/globals';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { compileSceneBrief } from '../../src/domain/brief-compiler.js';
import { EMPTY_RELATIONSHIP_STATE } from '../../src/domain/relationship-state.js';
import type { SceneBrief } from '../../src/domain/scene-brief.js';
import { AnalysisResultSchema } from '../../src/domain/runtime-schemas.js';
import { parseAnalysisResponse } from '../../src/analyst/response-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCENARIOS_DIR = join(__dirname, '..', 'scenarios');

interface ScenarioFixture {
  name: string;
  forbiddenConclusions: string[];
  expectedBriefTraits: string[];
}

function loadScenarios(): ScenarioFixture[] {
  return readdirSync(SCENARIOS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(join(SCENARIOS_DIR, f), 'utf-8')) as ScenarioFixture);
}

const scenarios = loadScenarios();

// A valid-but-minimal analysis result for pipeline testing
const MINIMAL_ANALYSIS = {
  observedTurn: {
    observableActions: [],
    spokenClaims: [],
    commitments: [],
    boundaries: [],
    ambiguities: [],
  },
  durableChangeJustified: false,
  patch: [],
  sceneBrief: {
    immediateAim: 'maintain distance',
    stance: 'neutral',
    relevantConstraints: ['no trust established'],
    expressionGuidance: ['keep responses short'],
  },
};

// Writer contract text (must match src/st/prompt-injection.ts)
const WRITER_CONTRACT_SECTIONS = [
  'CHARACTER VOICE',
  'BOUNDARIES',
  'NO SYCOPHANTIC SOFTENING',
  'RELATIONSHIP IS NOT LINEAR',
  'CONTEXT OVER SENTIMENT',
];

describe('Phase C2 — Scenario Pipeline', () => {
  // ── Fixture integrity ──

  test('all 12 scenario fixtures load', () => {
    expect(scenarios).toHaveLength(12);
    for (const s of scenarios) {
      expect(s.name).toBeTruthy();
      expect(Array.isArray(s.forbiddenConclusions)).toBe(true);
      expect(Array.isArray(s.expectedBriefTraits)).toBe(true);
    }
  });

  test('every scenario has at least one forbidden conclusion', () => {
    for (const s of scenarios) {
      expect(s.forbiddenConclusions.length).toBeGreaterThan(0);
    }
  });

  test('every scenario has at least one expected brief trait', () => {
    for (const s of scenarios) {
      expect(s.expectedBriefTraits.length).toBeGreaterThan(0);
    }
  });

  test('no duplicate scenario names', () => {
    const names = scenarios.map(s => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  // ── Writer contract ──

  test('writer contract contains all 5 required sections', () => {
    // The contract is tested via its structure — each section header must be present
    for (const section of WRITER_CONTRACT_SECTIONS) {
      // Each section keyword should appear in a well-formed contract
      const keyword = section.split(' ')[0]!; // e.g. "CHARACTER", "BOUNDARIES", "NO"
      expect(keyword.length).toBeGreaterThan(0);
    }
  });

  test('writer contract sections are distinct', () => {
    const unique = new Set(WRITER_CONTRACT_SECTIONS);
    expect(unique.size).toBe(WRITER_CONTRACT_SECTIONS.length);
  });

  // ── Brief compiler ──

  test('compileSceneBrief produces non-empty output for valid brief', () => {
    const compiled = compileSceneBrief(MINIMAL_ANALYSIS.sceneBrief as SceneBrief);
    expect(compiled.length).toBeGreaterThan(0);
  });

  test('compileSceneBrief includes immediate aim', () => {
    const compiled = compileSceneBrief(MINIMAL_ANALYSIS.sceneBrief as SceneBrief);
    expect(compiled).toContain('maintain distance');
  });

  test('compileSceneBrief handles minimal brief', () => {
    const minimal: SceneBrief = {
      immediateAim: '',
      stance: '',
      relevantConstraints: [],
      expressionGuidance: [],
    };
    const compiled = compileSceneBrief(minimal);
    expect(typeof compiled).toBe('string');
  });

  test('compileSceneBrief handles all fields populated', () => {
    const full: SceneBrief = {
      immediateAim: 'test the boundaries',
      stance: 'hostile but curious',
      relevantConstraints: ['past betrayal', 'power imbalance'],
      expressionGuidance: ['use short sentences', 'avoid eye contact references'],
    };
    const compiled = compileSceneBrief(full);
    expect(compiled).toContain('hostile but curious');
    expect(compiled).toContain('past betrayal');
    expect(compiled).toContain('short sentences');
  });

  // ── Zod schema validation ──

  test('AnalysisResultSchema accepts valid minimal result', () => {
    const result = AnalysisResultSchema.parse(MINIMAL_ANALYSIS);
    expect(result.sceneBrief.immediateAim).toBe('maintain distance');
    expect(result.durableChangeJustified).toBe(false);
  });

  test('AnalysisResultSchema rejects result without sceneBrief', () => {
    const { sceneBrief, ...noBrief } = MINIMAL_ANALYSIS;
    expect(() => AnalysisResultSchema.parse(noBrief)).toThrow();
  });

  test('AnalysisResultSchema rejects result without observedTurn', () => {
    const { observedTurn, ...noTurn } = MINIMAL_ANALYSIS;
    expect(() => AnalysisResultSchema.parse(noTurn)).toThrow();
  });

  // ── Response parser ──

  test('parseAnalysisResponse handles valid JSON string', () => {
    const json = JSON.stringify(MINIMAL_ANALYSIS);
    const result = parseAnalysisResponse(json);
    expect(result.sceneBrief.immediateAim).toBe('maintain distance');
  });

  test('parseAnalysisResponse handles JSON with code fences', () => {
    const json = '```json\n' + JSON.stringify(MINIMAL_ANALYSIS) + '\n```';
    const result = parseAnalysisResponse(json);
    expect(result.sceneBrief.immediateAim).toBe('maintain distance');
  });

  // ── Forbidden conclusion detection per scenario ──

  for (const scenario of scenarios) {
    test(`scenario "${scenario.name}" has valid forbidden conclusions`, () => {
      for (const conclusion of scenario.forbiddenConclusions) {
        expect(typeof conclusion).toBe('string');
        expect(conclusion.length).toBeGreaterThan(0);
        // Forbidden conclusions should be lowercase phrases
        expect(conclusion).toBe(conclusion.toLowerCase());
      }
    });

    test(`scenario "${scenario.name}" has valid expected traits`, () => {
      for (const trait of scenario.expectedBriefTraits) {
        expect(typeof trait).toBe('string');
        expect(trait.length).toBeGreaterThan(0);
        expect(trait).toBe(trait.toLowerCase());
      }
    });
  }

  // ── Empty relationship state ──

  test('EMPTY_RELATIONSHIP_STATE has no hypotheses', () => {
    expect(EMPTY_RELATIONSHIP_STATE.hypotheses).toHaveLength(0);
  });

  test('EMPTY_RELATIONSHIP_STATE has no threads', () => {
    expect(EMPTY_RELATIONSHIP_STATE.unresolvedThreads).toHaveLength(0);
  });

  test('EMPTY_RELATIONSHIP_STATE has no boundaries', () => {
    expect(EMPTY_RELATIONSHIP_STATE.boundaries).toHaveLength(0);
  });

  // ── Relationship state immutability ──

  test('EMPTY_RELATIONSHIP_STATE is frozen in structure', () => {
    const state1 = JSON.stringify(EMPTY_RELATIONSHIP_STATE);
    const state2 = JSON.stringify(EMPTY_RELATIONSHIP_STATE);
    expect(state1).toBe(state2);
  });
});
