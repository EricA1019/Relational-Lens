import type { SceneBrief } from './scene-brief.js';

function section(label: string, values?: string[]): string[] {
  if (!values?.length) return [];
  return [label, ...values.map((value) => `- ${value}`), ''];
}

export function compileSceneBrief(brief: SceneBrief): string {
  return [
    '[Private relational guidance. Do not quote or explain this analysis.]',
    '',
    'Immediate aim:',
    brief.immediateAim,
    '',
    'Present stance:',
    brief.stance,
    '',
    ...section('Relevant constraints:', brief.relevantConstraints),
    ...section('Activated history:', brief.activatedHistory),
    ...section('Internal conflict:', brief.internalConflict),
    brief.possibleMisreading
      ? `Possible misreading:
${brief.possibleMisreading}
`
      : '',
    brief.boundary
      ? `Boundary:
${brief.boundary}
`
      : '',
    ...section('Expression guidance:', brief.expressionGuidance),
    ...section('Do not resolve:', brief.prohibitedResolution),
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}
