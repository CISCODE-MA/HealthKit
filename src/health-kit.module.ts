import { createHealthController } from "@controllers/health.controller";
import type { IHealthIndicator } from "@interfaces/health-indicator.interface";
import { Module, DynamicModule, Provider } from "@nestjs/common";
import { HealthService } from "@services/health.service";

export const HEALTH_LIVENESS_INDICATORS = "HEALTH_LIVENESS_INDICATORS";
export const HEALTH_READINESS_INDICATORS = "HEALTH_READINESS_INDICATORS";

export interface HealthModuleOptions {
  /** URL path prefix for the health endpoints (e.g. `"health"` → `/health/live`, `/health/ready`). */
  path: string;
  /** Indicators checked by `GET /{path}/live`. */
  liveness: IHealthIndicator[];
  /** Indicators checked by `GET /{path}/ready`. */
  readiness: IHealthIndicator[];
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
    const providers: Provider[] = [
      {
        provide: HEALTH_LIVENESS_INDICATORS,
        useValue: options.liveness,
      },
      {
        provide: HEALTH_READINESS_INDICATORS,
        useValue: options.readiness,
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
