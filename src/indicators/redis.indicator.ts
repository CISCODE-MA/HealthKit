import type {
  IHealthIndicator,
  HealthIndicatorResult,
} from "@interfaces/health-indicator.interface";
import { Injectable } from "@nestjs/common";

/**
 * A minimal duck-typed interface for any Redis-compatible client.
 * Accepts `ioredis` Redis/Cluster instances or any client that exposes `ping()`.
 */
export interface RedisClient {
  ping(): Promise<string>;
}

const DEFAULT_TIMEOUT_MS = 3_000;

/**
 * Built-in health indicator for a Redis dependency.
 *
 * Sends a `PING` command and expects a `"PONG"` response.
 * Returns `"down"` if the command fails or exceeds the configured timeout.
 *
 * @example
 * ```typescript
 * import Redis from 'ioredis';
 *
 * const redis = new Redis({ host: 'localhost', port: 6379 });
 *
 * HealthModule.register({
 *   path: 'health',
 *   liveness: [],
 *   readiness: [new RedisHealthIndicator(redis)],
 * });
 * ```
 */
@Injectable()
export class RedisHealthIndicator implements IHealthIndicator {
  constructor(
    private readonly client: RedisClient,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  async check(): Promise<HealthIndicatorResult> {
    try {
      await Promise.race([this.client.ping(), this._timeout()]);
      return { name: "redis", status: "up" };
    } catch (error) {
      return {
        name: "redis",
        status: "down",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private _timeout(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), this.timeoutMs),
    );
  }
}
