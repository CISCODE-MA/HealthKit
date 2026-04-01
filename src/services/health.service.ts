import type {
  IHealthIndicator,
  HealthIndicatorResult,
} from "@interfaces/health-indicator.interface";
import { Injectable } from "@nestjs/common";

export interface HealthCheckResult {
  status: "ok" | "error";
  indicators: HealthIndicatorResult[];
}

/**
 * Orchestrates health indicator execution.
 *
 * Runs all registered indicators concurrently via `Promise.allSettled` so a
 * single slow/failing dependency never blocks the others.
 * Returns `status: "ok"` only when every indicator reports `"up"`.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly livenessIndicators: IHealthIndicator[],
    private readonly readinessIndicators: IHealthIndicator[],
  ) {}

  async checkLiveness(): Promise<HealthCheckResult> {
    return this._run(this.livenessIndicators);
  }

  async checkReadiness(): Promise<HealthCheckResult> {
    return this._run(this.readinessIndicators);
  }

  private async _run(indicators: IHealthIndicator[]): Promise<HealthCheckResult> {
    const settled = await Promise.allSettled(indicators.map((i) => i.check()));

    const results: HealthIndicatorResult[] = settled.map((outcome, idx) => {
      if (outcome.status === "fulfilled") return outcome.value;
      // A thrown exception counts as "down"
      return {
        name: indicators[idx]?.constructor.name ?? `indicator-${idx}`,
        status: "down" as const,
        message: outcome.reason instanceof Error ? outcome.reason.message : "Unknown error",
      };
    });

    const allUp = results.every((r) => r.status === "up");
    return { status: allUp ? "ok" : "error", indicators: results };
  }
}
