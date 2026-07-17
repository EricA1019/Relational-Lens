import { EXTENSION_NAME, EXTENSION_TEMPLATE_PATH } from '../constants.js';
import { EMPTY_RELATIONSHIP_STATE } from '../domain/relationship-state.js';
import { turnCache } from '../lifecycle/turn-cache.js';
import { ANALYSIS_RESPONSE_SCHEMA } from '../analyst/response-schema.js';
import { StConnectionProfileAnalystClient } from '../st/connection-profile-client.js';
import { getStContext } from '../st/context.js';
import { clearAllPrompts } from '../st/prompt-injection.js';
import { getSettings, updateSettings } from '../st/settings-repository.js';
import { updateStatusView } from './status-view.js';

export async function initializeSettingsUi(): Promise<void> {
  const context = getStContext();
  const html = await context.renderExtensionTemplateAsync(EXTENSION_NAME, EXTENSION_TEMPLATE_PATH);
  const host =
    document.querySelector('#extensions_settings2') ?? document.querySelector('#extensions_settings');
  if (!host) throw new Error('Extension settings container not found.');
  host.insertAdjacentHTML('beforeend', html);

  const settings = getSettings();
  const enabled = document.querySelector<HTMLInputElement>('#relational_lens_enabled');
  const recent = document.querySelector<HTMLInputElement>('#relational_lens_recent_messages');
  const output = document.querySelector<HTMLInputElement>('#relational_lens_output_tokens');
  if (enabled) enabled.checked = settings.enabled;
  if (recent) recent.value = String(settings.recentMessageCount);
  if (output) output.value = String(settings.maxOutputTokens);

  enabled?.addEventListener('change', () => {
    updateSettings({ enabled: enabled.checked });
    if (!enabled.checked) clearAllPrompts();
  });
  recent?.addEventListener('change', () => updateSettings({ recentMessageCount: Number(recent.value) }));
  output?.addEventListener('change', () => updateSettings({ maxOutputTokens: Number(output.value) }));

  context.ConnectionManagerRequestService.handleDropdown(
    '#relational_lens_profile',
    settings.analystProfileId,
    (profile?: { id?: string }) => updateSettings({ analystProfileId: profile?.id ?? '' }),
  );

  document.querySelector('#relational_lens_clear_cache')?.addEventListener('click', () => {
    turnCache.clear();
    updateStatusView('Turn cache cleared.');
  });
  document.querySelector('#relational_lens_clear_prompt')?.addEventListener('click', () => {
    clearAllPrompts();
    updateStatusView('Injected prompt cleared.');
  });
  document.querySelector('#relational_lens_test')?.addEventListener('click', async () => {
    updateStatusView('Testing analyst profile…');
    try {
      const result = await new StConnectionProfileAnalystClient().analyze({
        characterContext: 'A guarded character who values independence.',
        personaContext: 'The user has offered practical help.',
        recentMessages: [
          {
            index: 0,
            name: 'User',
            content: 'I can help, but only if you want me to.',
            isUser: true,
          },
        ],
        relationshipState: EMPTY_RELATIONSHIP_STATE,
        responseSchema: ANALYSIS_RESPONSE_SCHEMA,
      });
      updateStatusView(`Success: ${result.sceneBrief.stance}`);
    } catch (error: unknown) {
      updateStatusView(`Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  updateStatusView('Ready.');
}
