import type {
  IHealthIndicator,
  HealthIndicatorResult,
} from "@interfaces/health-indicator.interface";
import { Injectable } from "@nestjs/common";

/**
 * A minimal duck-typed interface for any postgres-compatible query client.
 * Accepts `pg.Pool`, TypeORM `DataSource`, or any object that exposes `query()`.
 */
export interface PostgresClient {
  query(sql: string): Promise<unknown>;
}

const DEFAULT_TIMEOUT_MS = 3_000;

/**
 * Built-in health indicator for a PostgreSQL dependency.
 *
 * Executes `SELECT 1` to verify the database connection is alive.
 * Returns `"down"` if the query fails or exceeds the configured timeout.
 *
 * @example
 * ```typescript
 * // With a pg.Pool
 * const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 *
 * HealthModule.register({
 *   path: 'health',
 *   liveness: [],
 *   readiness: [new PostgresHealthIndicator(pool)],
 * });
 * ```
 */
@Injectable()
export class PostgresHealthIndicator implements IHealthIndicator {
  constructor(
    private readonly client: PostgresClient,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  async check(): Promise<HealthIndicatorResult> {
    try {
      await Promise.race([this.client.query("SELECT 1"), this._timeout()]);
      return { name: "postgres", status: "up" };
    } catch (error) {
      return {
        name: "postgres",
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
