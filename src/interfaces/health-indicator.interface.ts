/**
 * The possible statuses for a health check result.
 */
export type HealthStatus = "up" | "down";

/**
 * The result returned by every health indicator's `check()` method.
 */
export interface HealthIndicatorResult {
  /** Unique name identifying this indicator (e.g. "postgres", "redis"). */
  name: string;
  /** Whether the dependency is healthy. */
  status: HealthStatus;
  /** Optional human-readable message (required when status is "down"). */
  message?: string;
}

/**
 * Contract that every health indicator must satisfy.
 *
 * Implement this interface for built-in indicators (Postgres, Redis, HTTP)
 * and for user-supplied custom indicators.
 *
 * @example
 * ```typescript
 * class MyIndicator implements IHealthIndicator {
 *   async check(): Promise<HealthIndicatorResult> {
 *     return { name: 'my-service', status: 'up' };
 *   }
 * }
 * ```
 */
export interface IHealthIndicator {
  check(): Promise<HealthIndicatorResult>;
}
