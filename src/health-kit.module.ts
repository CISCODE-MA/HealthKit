import { createHealthController } from "@controllers/health.controller";
import { HEALTH_INDICATOR_METADATA } from "@decorators/health-indicator.decorator";
import type { BaseHealthIndicator } from "@indicators/base.indicator";
import type { IHealthIndicator } from "@interfaces/health-indicator.interface";
import { Module, DynamicModule, Provider, Type } from "@nestjs/common";
import { HealthService } from "@services/health.service";

export const HEALTH_LIVENESS_INDICATORS = "HEALTH_LIVENESS_INDICATORS";
export const HEALTH_READINESS_INDICATORS = "HEALTH_READINESS_INDICATORS";
const HEALTH_MODULE_OPTIONS = "HEALTH_MODULE_OPTIONS";

export interface HealthModuleOptions {
  /** URL path prefix for the health endpoints. Defaults to `"health"` → `/health/live`, `/health/ready`. */
  path?: string;
  /** Explicit indicator instances checked by `GET /{path}/live`. */
  liveness?: IHealthIndicator[];
  /** Explicit indicator instances checked by `GET /{path}/ready`. */
  readiness?: IHealthIndicator[];
  /**
   * DI-based indicator classes decorated with `@HealthIndicator('liveness'|'readiness')`.
   * The module resolves them via NestJS DI and auto-registers them in the correct list.
   */
  indicators?: Type<BaseHealthIndicator>[];
}

export interface HealthModuleAsyncOptions {
  /** URL path prefix. Defaults to `"health"`. Provided upfront (needed for controller registration). */
  path?: string;
  /** NestJS modules to import (e.g. `ConfigModule`). */
  imports?: DynamicModule["imports"];
  /** Tokens to inject into `useFactory`. */
  inject?: unknown[];
  /** Factory that returns liveness/readiness/indicators options. */
  useFactory: (
    ...args: unknown[]
  ) => Promise<Omit<HealthModuleOptions, "path">> | Omit<HealthModuleOptions, "path">;
  /** DI-based indicator classes (must be known upfront for provider registration). */
  indicators?: Type<BaseHealthIndicator>[];
}

/**
 * `@ciscode/health-kit` — NestJS health-check module.
 *
 * @example
 * ```typescript
 * import { HealthModule } from '@ciscode/health-kit';
 * import { MongoHealthIndicator } from '@ciscode/health-kit';
 *
 * @Module({
 *   imports: [
 *     HealthModule.register({
 *       path: 'health',
 *       liveness: [],
 *       readiness: [new MongoHealthIndicator(dataSource)],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class HealthKitModule {
  static register(options: HealthModuleOptions = {}): DynamicModule {
    const { path = "health", liveness = [], readiness = [], indicators = [] } = options;
    const { indicatorProviders, livenessClasses, readinessClasses } =
      HealthKitModule._resolveIndicatorClasses(indicators);

    const providers: Provider[] = [
      ...indicatorProviders,
      {
        provide: HEALTH_LIVENESS_INDICATORS,
        useFactory: (...injected: BaseHealthIndicator[]) => [...liveness, ...injected],
        inject: livenessClasses,
      },
      {
        provide: HEALTH_READINESS_INDICATORS,
        useFactory: (...injected: BaseHealthIndicator[]) => [...readiness, ...injected],
        inject: readinessClasses,
      },
      ...HealthKitModule._healthServiceProvider(),
    ];

    return {
      module: HealthKitModule,
      controllers: [createHealthController(path)],
      providers,
      exports: [HealthService],
    };
  }

  static registerAsync(options: HealthModuleAsyncOptions): DynamicModule {
    const { path = "health", indicators = [], imports = [], inject = [] } = options;
    const { indicatorProviders, livenessClasses, readinessClasses } =
      HealthKitModule._resolveIndicatorClasses(indicators);

    const providers: Provider[] = [
      ...indicatorProviders,
      {
        provide: HEALTH_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: inject as never[],
      },
      {
        provide: HEALTH_LIVENESS_INDICATORS,
        useFactory: (opts: HealthModuleOptions, ...injected: BaseHealthIndicator[]) => [
          ...(opts.liveness ?? []),
          ...injected,
        ],
        inject: [HEALTH_MODULE_OPTIONS, ...livenessClasses],
      },
      {
        provide: HEALTH_READINESS_INDICATORS,
        useFactory: (opts: HealthModuleOptions, ...injected: BaseHealthIndicator[]) => [
          ...(opts.readiness ?? []),
          ...injected,
        ],
        inject: [HEALTH_MODULE_OPTIONS, ...readinessClasses],
      },
      ...HealthKitModule._healthServiceProvider(),
    ];

    return {
      module: HealthKitModule,
      imports,
      controllers: [createHealthController(path)],
      providers,
      exports: [HealthService],
    };
  }

  private static _resolveIndicatorClasses(indicators: Type<BaseHealthIndicator>[]) {
    const livenessClasses = indicators.filter(
      (cls) => Reflect.getMetadata(HEALTH_INDICATOR_METADATA, cls) === "liveness",
    );
    const readinessClasses = indicators.filter(
      (cls) => Reflect.getMetadata(HEALTH_INDICATOR_METADATA, cls) === "readiness",
    );
    const indicatorProviders: Provider[] = indicators.map((cls) => ({
      provide: cls,
      useClass: cls,
    }));
    return { livenessClasses, readinessClasses, indicatorProviders };
  }

  private static _healthServiceProvider(): Provider[] {
    return [
      {
        provide: HealthService,
        useFactory: (liveness: IHealthIndicator[], readiness: IHealthIndicator[]) =>
          new HealthService(liveness, readiness),
        inject: [HEALTH_LIVENESS_INDICATORS, HEALTH_READINESS_INDICATORS],
      },
    ];
  }
}
