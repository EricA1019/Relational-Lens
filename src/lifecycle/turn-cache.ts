import type { AnalysisResult } from '../analyst/contracts.js';

class TurnCache {
  private readonly completed = new Map<string, AnalysisResult>();
  private readonly inFlight = new Map<string, Promise<AnalysisResult>>();
  private readonly controllers = new Set<AbortController>();

  getCompleted(key: string): AnalysisResult | undefined {
    return this.completed.get(key);
  }

  getInFlight(key: string): Promise<AnalysisResult> | undefined {
    return this.inFlight.get(key);
  }

  track(key: string, controller: AbortController, promise: Promise<AnalysisResult>): Promise<AnalysisResult> {
    this.controllers.add(controller);
    this.inFlight.set(key, promise);
    const cleanup = promise
      .then((result) => {
        this.completed.set(key, result);
      })
      .finally(() => {
        this.controllers.delete(controller);
        this.inFlight.delete(key);
      });
    return cleanup.then(() => promise);
  }

  clear(): void {
    this.completed.clear();
  }

  abortAll(): void {
    for (const controller of this.controllers) controller.abort();
    this.controllers.clear();
    this.inFlight.clear();
  }
}

export const turnCache = new TurnCache();
