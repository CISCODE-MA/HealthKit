import "reflect-metadata";

import { HealthIndicator } from "@decorators/health-indicator.decorator";
import { BaseHealthIndicator } from "@indicators/base.indicator";
import { createIndicator } from "@indicators/create-indicator";
import type { HealthIndicatorResult } from "@interfaces/health-indicator.interface";
import { Injectable } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import {
  HEALTH_LIVENESS_INDICATORS,
  HEALTH_READINESS_INDICATORS,
  HealthKitModule,
} from "./health-kit.module";
import { HealthService } from "./services/health.service";

// ÔöÇÔöÇ Fixtures ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

@HealthIndicator("liveness")
@Injectable()
class LivenessIndicator extends BaseHealthIndicator {
  readonly name = "custom-live";
  async check(): Promise<HealthIndicatorResult> {
    return this.result("up");
  }
}

@HealthIndicator("readiness")
@Injectable()
class ReadinessIndicator extends BaseHealthIndicator {
  readonly name = "custom-ready";
  async check(): Promise<HealthIndicatorResult> {
    return this.result("up");
  }
}

@Injectable()
class UndecoratedIndicator extends BaseHealthIndicator {
  readonly name = "no-scope";
  async check(): Promise<HealthIndicatorResult> {
    return this.result("up");
  }
}

// ÔöÇÔöÇ Helpers ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

async function compile(options: Parameters<typeof HealthKitModule.register>[0]) {
  const module = await Test.createTestingModule({
    imports: [HealthKitModule.register(options)],
  }).compile();
  return module;
}

// ÔöÇÔöÇ Tests ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

describe("HealthKitModule.register()", () => {
  it("returns a DynamicModule with the correct module reference", () => {
    const dyn = HealthKitModule.register({ path: "health" });
    expect(dyn.module).toBe(HealthKitModule);
  });

  it("exports HealthService", () => {
    const dyn = HealthKitModule.register({ path: "health" });
    expect(dyn.exports).toContain(HealthService);
  });

  it("compiles with no indicators", async () => {
    const module = await compile({ path: "health" });
    const service = module.get(HealthService);
    expect(service).toBeInstanceOf(HealthService);
  });

  it("liveness result is ok when all liveness indicators pass", async () => {
    const indicator = createIndicator("ping", async () => true);
    const module = await compile({ path: "health", liveness: [indicator] });

    const service = module.get(HealthService);
    const result = await service.checkLiveness();

    expect(result.status).toBe("ok");
    expect(result.results[0]?.name).toBe("ping");
  });

  it("readiness result is ok when all readiness indicators pass", async () => {
    const indicator = createIndicator("db", async () => true);
    const module = await compile({ path: "health", readiness: [indicator] });

    const service = module.get(HealthService);
    const result = await service.checkReadiness();

    expect(result.status).toBe("ok");
    expect(result.results[0]?.name).toBe("db");
  });

  it("auto-routes @HealthIndicator('liveness') class to liveness list", async () => {
    const module = await compile({
      path: "health",
      indicators: [LivenessIndicator],
    });

    const liveness = module.get<HealthIndicatorResult[]>(HEALTH_LIVENESS_INDICATORS);
    expect(liveness).toHaveLength(1);

    const readiness = module.get<HealthIndicatorResult[]>(HEALTH_READINESS_INDICATORS);
    expect(readiness).toHaveLength(0);
  });

  it("auto-routes @HealthIndicator('readiness') class to readiness list", async () => {
    const module = await compile({
      path: "health",
      indicators: [ReadinessIndicator],
    });

    const readiness = module.get<HealthIndicatorResult[]>(HEALTH_READINESS_INDICATORS);
    expect(readiness).toHaveLength(1);

    const liveness = module.get<HealthIndicatorResult[]>(HEALTH_LIVENESS_INDICATORS);
    expect(liveness).toHaveLength(0);
  });

  it("merges explicit instances with DI-based indicators", async () => {
    const explicitReady = createIndicator("http", async () => true);
    const module = await compile({
      path: "health",
      readiness: [explicitReady],
      indicators: [ReadinessIndicator],
    });

    const readiness = module.get<HealthIndicatorResult[]>(HEALTH_READINESS_INDICATORS);
    expect(readiness).toHaveLength(2);
  });

  it("undecorated indicator class is not added to either list", async () => {
    const module = await compile({
      path: "health",
      indicators: [UndecoratedIndicator],
    });

    const liveness = module.get<HealthIndicatorResult[]>(HEALTH_LIVENESS_INDICATORS);
    const readiness = module.get<HealthIndicatorResult[]>(HEALTH_READINESS_INDICATORS);

    expect(liveness).toHaveLength(0);
    expect(readiness).toHaveLength(0);
  });

  it("handles both liveness and readiness DI indicators simultaneously", async () => {
    const module = await compile({
      path: "health",
      indicators: [LivenessIndicator, ReadinessIndicator],
    });

    const liveness = module.get<HealthIndicatorResult[]>(HEALTH_LIVENESS_INDICATORS);
    const readiness = module.get<HealthIndicatorResult[]>(HEALTH_READINESS_INDICATORS);

    expect(liveness).toHaveLength(1);
    expect(readiness).toHaveLength(1);

    const service = module.get(HealthService);
    const liveResult = await service.checkLiveness();
    const readyResult = await service.checkReadiness();

    expect(liveResult.status).toBe("ok");
    expect(readyResult.status).toBe("ok");
  });

  it("path defaults to 'health' when not provided", () => {
    const dyn = HealthKitModule.register({});
    expect(dyn.controllers).toBeDefined();
    expect(dyn.module).toBe(HealthKitModule);
  });

  it("registerAsync resolves options from factory", async () => {
    const indicator = createIndicator("async-ping", async () => true);
    const module = await Test.createTestingModule({
      imports: [
        HealthKitModule.registerAsync({
          useFactory: () => ({ liveness: [indicator] }),
        }),
      ],
    }).compile();

    const service = module.get(HealthService);
    const result = await service.checkLiveness();
    expect(result.status).toBe("ok");
    expect(result.results[0]?.name).toBe("async-ping");
  });
});
