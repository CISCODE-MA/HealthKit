import "reflect-metadata";
import { HEALTH_INDICATOR_METADATA, HealthIndicator } from "./health-indicator.decorator";

class SomeIndicator {}
class AnotherIndicator {}
class UndecotratedIndicator {}

@HealthIndicator("liveness")
class LivenessIndicator extends SomeIndicator {}

@HealthIndicator("readiness")
class ReadinessIndicator extends AnotherIndicator {}

describe("@HealthIndicator decorator", () => {
  it("attaches liveness metadata to the target class", () => {
    const scope = Reflect.getMetadata(HEALTH_INDICATOR_METADATA, LivenessIndicator);
    expect(scope).toBe("liveness");
  });

  it("attaches readiness metadata to the target class", () => {
    const scope = Reflect.getMetadata(HEALTH_INDICATOR_METADATA, ReadinessIndicator);
    expect(scope).toBe("readiness");
  });

  it("returns undefined for undecorated classes", () => {
    const scope = Reflect.getMetadata(HEALTH_INDICATOR_METADATA, UndecotratedIndicator);
    expect(scope).toBeUndefined();
  });

  it("does not affect other classes when decorating one", () => {
    const livScope = Reflect.getMetadata(HEALTH_INDICATOR_METADATA, LivenessIndicator);
    const readScope = Reflect.getMetadata(HEALTH_INDICATOR_METADATA, ReadinessIndicator);
    expect(livScope).toBe("liveness");
    expect(readScope).toBe("readiness");
  });
});
