export async function createTurnFingerprint(input: object): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  if (typeof crypto !== 'undefined' && typeof crypto.subtle?.digest === 'function') {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback: simple hash when crypto.subtle is unavailable (e.g., test environments)
  let hash = 0;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i] as number;
    hash = ((hash << 5) - hash + byte) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
