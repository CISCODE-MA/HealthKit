import { createHealthController } from "@controllers/health.controller";
import { HEALTH_INDICATOR_METADATA } from "@decorators/health-indicator.decorator";
import type { BaseHealthIndicator } from "@indicators/base.indicator";
import type { IHealthIndicator } from "@interfaces/health-indicator.interface";
import { Module, DynamicModule, Provider, Type } from "@nestjs/common";
import { HealthService } from "@services/health.service";

export const HEALTH_LIVENESS_INDICATORS = "HEALTH_LIVENESS_INDICATORS";
export const HEALTH_READINESS_INDICATORS = "HEALTH_READINESS_INDICATORS";

export interface HealthModuleOptions {
  /** URL path prefix for the health endpoints (e.g. `"health"` → `/health/live`, `/health/ready`). */
  path: string;
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
  static register(options: HealthModuleOptions): DynamicModule {
    const indicatorClasses = options.indicators ?? [];

    // Separate DI-based indicator classes by scope using decorator metadata
    const livenessClasses = indicatorClasses.filter(
      (cls) => Reflect.getMetadata(HEALTH_INDICATOR_METADATA, cls) === "liveness",
    );
    const readinessClasses = indicatorClasses.filter(
      (cls) => Reflect.getMetadata(HEALTH_INDICATOR_METADATA, cls) === "readiness",
    );

    // Create a NestJS provider for each indicator class (enables DI injection)
    const indicatorProviders: Provider[] = indicatorClasses.map((cls) => ({
      provide: cls,
      useClass: cls,
    }));

    const providers: Provider[] = [
      ...indicatorProviders,
      {
        provide: HEALTH_LIVENESS_INDICATORS,
        useFactory: (...injected: BaseHealthIndicator[]) => [
          ...(options.liveness ?? []),
          ...injected,
        ],
        inject: livenessClasses,
      },
      {
        provide: HEALTH_READINESS_INDICATORS,
        useFactory: (...injected: BaseHealthIndicator[]) => [
          ...(options.readiness ?? []),
          ...injected,
        ],
        inject: readinessClasses,
      },
      {
        provide: HealthService,
        useFactory: (liveness: IHealthIndicator[], readiness: IHealthIndicator[]) =>
          new HealthService(liveness, readiness),
        inject: [HEALTH_LIVENESS_INDICATORS, HEALTH_READINESS_INDICATORS],
      },
    ];

    const HealthController = createHealthController(options.path);

    return {
      module: HealthKitModule,
      controllers: [HealthController],
      providers,
      exports: [HealthService],
    };
  }
}
