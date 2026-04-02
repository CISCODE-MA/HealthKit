import { createIndicator } from "./create-indicator";

describe("createIndicator", () => {
  it("returns status up when checkFn resolves true", async () => {
    const indicator = createIndicator("my-check", async () => true);
    const result = await indicator.check();
    expect(result).toEqual({ name: "my-check", status: "up" });
  });

  it("returns status up when checkFn resolves void/undefined", async () => {
    const indicator = createIndicator("my-check", async () => undefined);
    const result = await indicator.check();
    expect(result).toEqual({ name: "my-check", status: "up" });
  });

  it("returns status down when checkFn returns false", async () => {
    const indicator = createIndicator("my-check", async () => false);
    const result = await indicator.check();
    expect(result).toEqual({ name: "my-check", status: "down" });
  });

  it("propagates rejection from checkFn", async () => {
    const indicator = createIndicator("my-check", async () => {
      throw new Error("dependency failed");
    });
    await expect(indicator.check()).rejects.toThrow("dependency failed");
  });

  it("rejects with timeout error when checkFn exceeds timeout", async () => {
    jest.useFakeTimers();

    const slowFn = () => new Promise<void>((resolve) => setTimeout(resolve, 5000));
    const indicator = createIndicator("slow-check", slowFn, { timeout: 100 });

    const promise = indicator.check();
    jest.advanceTimersByTime(200);

    await expect(promise).rejects.toThrow("slow-check timed out after 100ms");

    jest.useRealTimers();
  });

  it("uses default timeout of 3000ms", async () => {
    jest.useFakeTimers();

    const slowFn = () => new Promise<void>((resolve) => setTimeout(resolve, 5000));
    const indicator = createIndicator("slow-check", slowFn);

    const promise = indicator.check();
    jest.advanceTimersByTime(3100);

    await expect(promise).rejects.toThrow("slow-check timed out after 3000ms");

    jest.useRealTimers();
  });
});
