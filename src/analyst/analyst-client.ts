import type { AnalysisRequest, AnalysisResult } from './contracts.js';

export interface AnalystClient {
  analyze(request: AnalysisRequest, signal?: AbortSignal): Promise<AnalysisResult>;
}
