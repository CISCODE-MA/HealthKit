import { RedisHealthIndicator } from "./redis.indicator";

describe("RedisHealthIndicator", () => {
  const mockClient = { ping: jest.fn() };

  // ── Success ───────────────────────────────────────────────────────────────

  it("returns 'up' when PING succeeds", async () => {
    mockClient.ping.mockResolvedValue("PONG");

    const indicator = new RedisHealthIndicator(mockClient);
    const result = await indicator.check();

    expect(result).toEqual({ name: "redis", status: "up" });
    expect(mockClient.ping).toHaveBeenCalledTimes(1);
  });

  // ── Error ─────────────────────────────────────────────────────────────────

  it("returns 'down' with message when PING throws", async () => {
    mockClient.ping.mockRejectedValue(new Error("ECONNREFUSED"));

    const indicator = new RedisHealthIndicator(mockClient);
    const result = await indicator.check();

    expect(result).toEqual({
      name: "redis",
      status: "down",
      message: "ECONNREFUSED",
    });
  });

  it("returns 'down' with 'Unknown error' for non-Error rejections", async () => {
    mockClient.ping.mockRejectedValue(42);

    const indicator = new RedisHealthIndicator(mockClient);
    const result = await indicator.check();

    expect(result).toEqual({
      name: "redis",
      status: "down",
      message: "Unknown error",
    });
  });

  // ── Timeout ───────────────────────────────────────────────────────────────

  it("returns 'down' when PING exceeds the configured timeout", async () => {
    jest.useFakeTimers();
    mockClient.ping.mockImplementation(() => new Promise(() => {}));

    const indicator = new RedisHealthIndicator(mockClient, 100);
    const checkPromise = indicator.check();

    jest.advanceTimersByTime(150);

    const result = await checkPromise;
    expect(result).toEqual({ name: "redis", status: "down", message: "Timeout" });

    jest.useRealTimers();
  });
});
