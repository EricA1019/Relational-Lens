export function getStContext(): any {
  const st = (globalThis as any).SillyTavern;
  if (!st?.getContext) throw new Error('SillyTavern.getContext() is unavailable.');
  return st.getContext();
}
