import type {
  IHealthIndicator,
  HealthIndicatorResult,
} from "@interfaces/health-indicator.interface";

import { HealthService } from "./health.service";

const up = (name: string): HealthIndicatorResult => ({ name, status: "up" });
const down = (name: string, message = "error"): HealthIndicatorResult => ({
  name,
  status: "down",
  message,
});

const mockIndicator = (result: HealthIndicatorResult): IHealthIndicator => ({
  check: jest.fn().mockResolvedValue(result),
});

const throwingIndicator = (message: string): IHealthIndicator => ({
  check: jest.fn().mockRejectedValue(new Error(message)),
});

describe("HealthService", () => {
  // ── checkLiveness ─────────────────────────────────────────────────────────

  describe("checkLiveness()", () => {
    it("returns status 'ok' when all liveness indicators are up", async () => {
      const service = new HealthService([mockIndicator(up("proc"))], []);
      const result = await service.checkLiveness();

      expect(result.status).toBe("ok");
      expect(result.indicators).toEqual([up("proc")]);
    });

    it("returns status 'error' when any liveness indicator is down", async () => {
      const service = new HealthService(
        [mockIndicator(up("proc")), mockIndicator(down("memory"))],
        [],
      );
      const result = await service.checkLiveness();

      expect(result.status).toBe("error");
    });

    it("returns status 'ok' with empty indicators", async () => {
      const service = new HealthService([], []);
      const result = await service.checkLiveness();

      expect(result.status).toBe("ok");
      expect(result.indicators).toEqual([]);
    });
  });

  // ── checkReadiness ────────────────────────────────────────────────────────

  describe("checkReadiness()", () => {
    it("returns status 'ok' when all readiness indicators are up", async () => {
      const service = new HealthService(
        [],
        [mockIndicator(up("postgres")), mockIndicator(up("redis"))],
      );
      const result = await service.checkReadiness();

      expect(result.status).toBe("ok");
      expect(result.indicators).toHaveLength(2);
    });

    it("returns status 'error' when any readiness indicator is down", async () => {
      const service = new HealthService(
        [],
        [mockIndicator(up("redis")), mockIndicator(down("postgres"))],
      );
      const result = await service.checkReadiness();

      expect(result.status).toBe("error");
    });
  });

  // ── Concurrency (Promise.allSettled) ──────────────────────────────────────

  it("runs all indicators concurrently and catches thrown exceptions", async () => {
    const service = new HealthService(
      [],
      [mockIndicator(up("redis")), throwingIndicator("ECONNREFUSED"), mockIndicator(up("http"))],
    );
    const result = await service.checkReadiness();

    expect(result.status).toBe("error");
    const failed = result.indicators.find((r) => r.status === "down");
    expect(failed?.message).toBe("ECONNREFUSED");
  });

  it("does not short-circuit: all indicators run even if one throws", async () => {
    const slow = mockIndicator(up("slow"));
    const service = new HealthService([], [throwingIndicator("boom"), slow]);

    await service.checkReadiness();

    expect(slow.check).toHaveBeenCalledTimes(1);
  });
});
