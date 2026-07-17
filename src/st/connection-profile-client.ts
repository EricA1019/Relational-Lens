import type { AnalystClient } from '../analyst/analyst-client.js';
import type { AnalysisRequest, AnalysisResult } from '../analyst/contracts.js';
import { buildAnalystMessages } from '../analyst/request-builder.js';
import { parseAnalysisResponse } from '../analyst/response-parser.js';
import { getStContext } from './context.js';
import { getSettings } from './settings-repository.js';
import { createDebugLogger } from '../util/debug-logger.js';

const debug = createDebugLogger(getSettings);

export class StConnectionProfileAnalystClient implements AnalystClient {
  async analyze(request: AnalysisRequest, signal?: AbortSignal): Promise<AnalysisResult> {
    const context = getStContext();
    const settings = getSettings();
    if (!settings.analystProfileId) throw new Error('No analyst profile selected.');
    debug('analyze called', {
      profileId: settings.analystProfileId,
      messageCount: request.recentMessages.length,
    });

    const startTime = performance.now();
    const raw = await context.ConnectionManagerRequestService.sendRequest(
      settings.analystProfileId,
      buildAnalystMessages(request),
      settings.maxOutputTokens,
      {
        stream: false,
        signal,
        extractData: false,
        includePreset: false,
        includeInstruct: true,
      },
      {
        temperature: 0.25,
        top_p: 0.9,
        response_format: {
          type: 'json_object',
        },
      },
    );
    debug('analyst request completed', { durationMs: Math.round(performance.now() - startTime) });

    return parseAnalysisResponse(raw);
  }
}
