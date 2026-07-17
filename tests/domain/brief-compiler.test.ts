import { compileSceneBrief } from '../../src/domain/brief-compiler.js';

test('omits unused optional sections', () => {
  const output = compileSceneBrief({
    immediateAim: 'Retain control.',
    stance: 'Cautiously receptive.',
    relevantConstraints: ['Do not disclose.'],
    expressionGuidance: ['Accept help without reconciliation.'],
  });
  expect(output).toContain('Immediate aim');
  expect(output).not.toContain('Possible misreading');
  expect(output).not.toContain('Internal conflict');
  expect(output).not.toContain('Boundary');
  expect(output).not.toContain('Activated history');
  expect(output).not.toContain('Do not resolve');
});

test('includes all optional sections when provided', () => {
  const output = compileSceneBrief({
    immediateAim: 'Aim.',
    stance: 'Stance.',
    relevantConstraints: ['Constraint.'],
    expressionGuidance: ['Guidance.'],
    activatedHistory: ['Past event.'],
    internalConflict: ['Inner doubt.'],
    possibleMisreading: 'Might be seen as hostile.',
    boundary: 'Will not lie.',
    prohibitedResolution: ['Do not reconcile.'],
  });
  expect(output).toContain('Activated history:');
  expect(output).toContain('Past event.');
  expect(output).toContain('Internal conflict:');
  expect(output).toContain('Inner doubt.');
  expect(output).toContain('Possible misreading:');
  expect(output).toContain('Might be seen as hostile.');
  expect(output).toContain('Boundary:');
  expect(output).toContain('Will not lie.');
  expect(output).toContain('Do not resolve:');
  expect(output).toContain('Do not reconcile.');
});

test('handles empty arrays for optional sections', () => {
  const output = compileSceneBrief({
    immediateAim: 'Aim.',
    stance: 'Stance.',
    relevantConstraints: [],
    expressionGuidance: [],
    activatedHistory: [],
    internalConflict: [],
    prohibitedResolution: [],
  });
  expect(output).toContain('Immediate aim');
  expect(output).not.toContain('Activated history');
  expect(output).not.toContain('Internal conflict');
});

test('includes content proportionally to input size', () => {
  const output = compileSceneBrief({
    immediateAim: 'Aim.',
    stance: 'Stance.',
    relevantConstraints: ['C1', 'C2', 'C3'],
    expressionGuidance: ['G1', 'G2'],
    activatedHistory: ['H1'],
    internalConflict: ['IC1'],
    possibleMisreading: 'Misreading.',
    boundary: 'Boundary.',
    prohibitedResolution: ['PR1'],
  });
  expect(output).toContain('Activated history:');
  expect(output).toContain('Internal conflict:');
  expect(output).toContain('Possible misreading:');
  expect(output).toContain('Boundary:');
  expect(output).toContain('Do not resolve:');
});
