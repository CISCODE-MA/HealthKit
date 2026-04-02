import type { HealthIndicatorResult } from "@interfaces/health-indicator.interface";

import { BaseHealthIndicator } from "./base.indicator";

// Concrete implementation for testing
class ConcreteIndicator extends BaseHealthIndicator {
  readonly name = "test-service";

  async check(): Promise<HealthIndicatorResult> {
    return this.result("up");
  }
}

class ConcreteIndicatorWithMessage extends BaseHealthIndicator {
  readonly name = "test-service";

  async check(): Promise<HealthIndicatorResult> {
    return this.result("down", "connection refused");
  }
}

describe("BaseHealthIndicator", () => {
  it("can be instantiated via a concrete subclass", () => {
    const indicator = new ConcreteIndicator();
    expect(indicator).toBeInstanceOf(BaseHealthIndicator);
    expect(indicator.name).toBe("test-service");
  });

  it("result() returns up result with name and status", async () => {
    const indicator = new ConcreteIndicator();
    const result = await indicator.check();
    expect(result).toEqual({ name: "test-service", status: "up" });
  });

  it("result() includes message when provided", async () => {
    const indicator = new ConcreteIndicatorWithMessage();
    const result = await indicator.check();
    expect(result).toEqual({
      name: "test-service",
      status: "down",
      message: "connection refused",
    });
  });

  it("result() omits message property when not provided", async () => {
    const indicator = new ConcreteIndicator();
    const result = await indicator.check();
    expect(result).not.toHaveProperty("message");
  });
});
