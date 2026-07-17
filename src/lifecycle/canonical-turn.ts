export interface CanonicalTurn {
  previousAssistantContent: string;
  currentUserContent: string;
}

export function resolveCanonicalTurn(chat: unknown[]): CanonicalTurn | null {
  const messages = chat as Array<{ role?: string; content?: string; mes?: string; is_user?: boolean; name?: string }>;
  
  // ST chat format varies: try role field first, then is_user, then mes
  const indexed = messages.map((message, index) => ({ message, index }));
  
  // Find last user message — try multiple detection strategies
  const currentUser = [...indexed].reverse().find(({ message }) => {
    if (message.role === 'user') return true;
    if (message.is_user === true) return true;
    // WTracker injects synthetic user messages with specific content patterns
    if (message.role === undefined && typeof message.content === 'string' && message.content.trim()) return true;
    return false;
  });
  
  if (!currentUser) {
    console.warn('[Relational Lens] resolveCanonicalTurn: no user message in chat', 
      messages.slice(-3).map(m => ({ role: m.role, is_user: m.is_user, content: String(m.content ?? m.mes ?? '').slice(0, 40) })));
    return null;
  }
  
  const previousAssistant = [...messages.slice(0, currentUser.index)]
    .reverse()
    .find((message) => message.role === 'assistant');
  
  const currentUserContent = String(currentUser.message.content ?? currentUser.message.mes ?? '');
  if (!currentUserContent.trim()) return null;
  
  return {
    previousAssistantContent: String(previousAssistant?.content ?? previousAssistant?.mes ?? ''),
    currentUserContent,
  };
}
