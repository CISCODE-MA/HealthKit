import { ServiceUnavailableException } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { HealthService } from "@services/health.service";
import type { HealthCheckResult } from "@services/health.service";

import { createHealthController } from "./health.controller";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeService = (liveness: "ok" | "error", readiness: "ok" | "error") =>
  ({
    checkLiveness: jest.fn().mockResolvedValue({ status: liveness, results: [] }),
    checkReadiness: jest.fn().mockResolvedValue({ status: readiness, results: [] }),
  }) as unknown as HealthService;

interface HealthControllerInstance {
  live(): Promise<HealthCheckResult>;
  ready(): Promise<HealthCheckResult>;
}

async function buildController(
  liveness: "ok" | "error",
  readiness: "ok" | "error",
): Promise<HealthControllerInstance> {
  const HealthController = createHealthController("health");
  const moduleRef: TestingModule = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [{ provide: HealthService, useValue: makeService(liveness, readiness) }],
  }).compile();
  return moduleRef.get<HealthControllerInstance>(HealthController as never);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("HealthController (factory)", () => {
  describe("GET /health/live", () => {
    it("returns result when all liveness indicators are up", async () => {
      const controller = await buildController("ok", "ok");
      const result = await controller.live();
      expect(result.status).toBe("ok");
    });

    it("throws ServiceUnavailableException (503) when any liveness indicator is down", async () => {
      const controller = await buildController("error", "ok");
      await expect(controller.live()).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe("GET /health/ready", () => {
    it("returns result when all readiness indicators are up", async () => {
      const controller = await buildController("ok", "ok");
      const result = await controller.ready();
      expect(result.status).toBe("ok");
    });

    it("throws ServiceUnavailableException (503) when any readiness indicator is down", async () => {
      const controller = await buildController("ok", "error");
      await expect(controller.ready()).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
