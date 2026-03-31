import type {
  IHealthIndicator,
  HealthIndicatorResult,
} from "@interfaces/health-indicator.interface";
import { Injectable } from "@nestjs/common";

const DEFAULT_TIMEOUT_MS = 3_000;

/**
 * Built-in health indicator for an HTTP dependency.
 *
 * Performs a GET request to the provided URL using the native `fetch` API
 * (available on Node ≥ 20, which is this package's minimum engine requirement).
 * Any 2xx response is treated as healthy. Non-2xx, network errors, and timeouts
 * are all reported as `"down"`.
 *
 * @example
 * ```typescript
 * HealthModule.register({
 *   path: 'health',
 *   liveness: [],
 *   readiness: [
 *     new HttpHealthIndicator('https://api.example.com/health'),
 *   ],
 * });
 * ```
 */
@Injectable()
export class HttpHealthIndicator implements IHealthIndicator {
  constructor(
    private readonly url: string,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  async check(): Promise<HealthIndicatorResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.url, {
        method: "GET",
        signal: controller.signal,
      });

      if (response.ok) {
        return { name: "http", status: "up" };
      }

      return {
        name: "http",
        status: "down",
        message: `HTTP ${response.status} ${response.statusText}`,
      };
    } catch (error) {
      const isTimeout =
        error instanceof Error && (error.name === "AbortError" || error.message === "Timeout");

      return {
        name: "http",
        status: "down",
        message: isTimeout ? "Timeout" : error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
