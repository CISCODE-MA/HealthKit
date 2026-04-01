import type {
  IHealthIndicator,
  HealthIndicatorResult,
} from "@interfaces/health-indicator.interface";
import { Injectable } from "@nestjs/common";

/**
 * Minimal duck-typed interface for a MongoDB database handle.
 * Accepts `mongoose.connection.db` (a Mongoose `Db` object) or any
 * object that exposes a `command()` method (native `mongodb` driver `Db`).
 *
 * @example
 * ```typescript
 * // mongoose
 * new MongoHealthIndicator(mongoose.connection.db);
 *
 * // native driver
 * const client = new MongoClient(uri);
 * new MongoHealthIndicator(client.db());
 * ```
 */
export interface MongoDb {
  command(command: Record<string, unknown>): Promise<unknown>;
}

const DEFAULT_TIMEOUT_MS = 3_000;

/**
 * Built-in health indicator for a MongoDB dependency.
 *
 * Runs `{ ping: 1 }` — the standard MongoDB server-health command.
 * Returns `"down"` if the command fails or exceeds the configured timeout.
 *
 * @example
 * ```typescript
 * import mongoose from 'mongoose';
 *
 * HealthModule.register({
 *   path: 'health',
 *   liveness: [],
 *   readiness: [new MongoHealthIndicator(mongoose.connection.db)],
 * });
 * ```
 */
@Injectable()
export class MongoHealthIndicator implements IHealthIndicator {
  constructor(
    private readonly db: MongoDb,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  async check(): Promise<HealthIndicatorResult> {
    try {
      await Promise.race([this.db.command({ ping: 1 }), this._timeout()]);
      return { name: "mongo", status: "up" };
    } catch (error) {
      return {
        name: "mongo",
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
