import type {
  HealthIndicatorResult,
  HealthStatus,
  IHealthIndicator,
} from "@interfaces/health-indicator.interface";

/**
 * Abstract base class for DI-based custom health indicators.
 *
 * Extend this class and inject it into `HealthKitModule.register({ indicators: [...] })`
 * alongside the `@HealthIndicator` decorator to auto-register it into liveness or readiness.
 *
 * @example
 * ```typescript
 * @HealthIndicator('readiness')
 * @Injectable()
 * export class DatabaseIndicator extends BaseHealthIndicator {
 *   readonly name = 'database';
 *
 *   constructor(private readonly orm: TypeOrmModule) { super(); }
 *
 *   async check(): Promise<HealthIndicatorResult> {
 *     try {
 *       await this.orm.query('SELECT 1');
 *       return this.result('up');
 *     } catch (err) {
 *       return this.result('down', (err as Error).message);
 *     }
 *   }
 * }
 * ```
 */
export abstract class BaseHealthIndicator implements IHealthIndicator {
  /** Unique display name used in health-check responses. */
  abstract readonly name: string;

  abstract check(): Promise<HealthIndicatorResult>;

  /**
   * Helper to build a {@link HealthIndicatorResult} using this indicator's name.
   */
  protected result(status: HealthStatus, message?: string): HealthIndicatorResult {
    return {
      name: this.name,
      status,
      ...(message !== undefined ? { message } : {}),
    };
  }
}
