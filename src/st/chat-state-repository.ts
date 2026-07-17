import { EXTENSION_KEY } from '../constants.js';
import { EMPTY_RELATIONSHIP_STATE, type RelationshipState } from '../domain/relationship-state.js';
import { getStContext } from './context.js';

interface RelationshipEnvelope {
  current: RelationshipState;
  previous?: RelationshipState;
}

export function getRelationshipState(): RelationshipState {
  const context = getStContext();
  const metadata = context.chatMetadata as Record<string, unknown>;
  metadata[EXTENSION_KEY] ??= { current: structuredClone(EMPTY_RELATIONSHIP_STATE) };
  return (metadata[EXTENSION_KEY] as RelationshipEnvelope).current;
}

export async function saveRelationshipState(next: RelationshipState): Promise<void> {
  const context = getStContext();
  const metadata = context.chatMetadata as Record<string, unknown>;
  metadata[EXTENSION_KEY] = {
    previous: structuredClone(getRelationshipState()),
    current: structuredClone(next),
  } satisfies RelationshipEnvelope;
  await context.saveMetadata();
}
