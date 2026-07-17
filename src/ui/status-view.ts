export function updateStatusView(text: string): void {
  const element = document.querySelector('#relational_lens_status');
  if (element) {
    element.textContent = text;
    console.debug('[Relational Lens] status:', text);
  }
}
