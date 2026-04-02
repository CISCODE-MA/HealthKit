import "reflect-metadata";

export const HEALTH_INDICATOR_METADATA = "ciscode:health-indicator:scope";

export type HealthIndicatorScope = "liveness" | "readiness";

/**
 * Class decorator that marks a {@link BaseHealthIndicator} subclass for
 * auto-registration into `HealthKitModule`.
 *
 * Pass the decorated class to `HealthKitModule.register({ indicators: [...] })` and
 * the module will automatically inject it into the correct liveness or readiness list.
 *
 * @example
 * ```typescript
 * @HealthIndicator('readiness')
 * @Injectable()
 * export class DatabaseIndicator extends BaseHealthIndicator {
 *   readonly name = 'database';
 *   async check() { ... }
 * }
 *
 * // In AppModule:
 * HealthKitModule.register({
 *   path: 'health',
 *   indicators: [DatabaseIndicator],
 * })
 * ```
 */
export function HealthIndicator(scope: HealthIndicatorScope): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(HEALTH_INDICATOR_METADATA, scope, target);
  };
}
