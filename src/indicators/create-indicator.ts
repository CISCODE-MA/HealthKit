import type {
  HealthIndicatorResult,
  IHealthIndicator,
} from "@interfaces/health-indicator.interface";

/**
 * Factory that creates an {@link IHealthIndicator} from an inline async function.
 *
 * The check function may return:
 * - `false` → indicator reports `"down"`
 * - `true` or `void` → indicator reports `"up"`
 * - throws → indicator reports `"down"` with the error message
 *
 * @example
 * ```typescript
 * const diskIndicator = createIndicator('disk', async () => {
 *   const free = await getDiskFreeSpace();
 *   return free > MIN_FREE_BYTES;
 * });
 * ```
 */
export function createIndicator(
  name: string,
  checkFn: () => Promise<boolean | void>,
  options?: { timeout?: number },
): IHealthIndicator {
  const timeout = options?.timeout ?? 3000;

  return {
    async check(): Promise<HealthIndicatorResult> {
      const run = async (): Promise<HealthIndicatorResult> => {
        const result = await checkFn();
        if (result === false) {
          return { name, status: "down" };
        }
        return { name, status: "up" };
      };

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${name} timed out after ${timeout}ms`)), timeout),
      );

      return Promise.race([run(), timeoutPromise]);
    },
  };
}
