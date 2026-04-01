import { MongoHealthIndicator } from "./mongo.indicator";

describe("MongoHealthIndicator", () => {
  const mockDb = { command: jest.fn() };

  // ── Success ───────────────────────────────────────────────────────────────

  it("returns 'up' when ping command succeeds", async () => {
    mockDb.command.mockResolvedValue({ ok: 1 });

    const indicator = new MongoHealthIndicator(mockDb);
    const result = await indicator.check();

    expect(result).toEqual({ name: "mongo", status: "up" });
    expect(mockDb.command).toHaveBeenCalledWith({ ping: 1 });
  });

  // ── Error ─────────────────────────────────────────────────────────────────

  it("returns 'down' with message when command throws", async () => {
    mockDb.command.mockRejectedValue(new Error("MongoNetworkError"));

    const indicator = new MongoHealthIndicator(mockDb);
    const result = await indicator.check();

    expect(result).toEqual({
      name: "mongo",
      status: "down",
      message: "MongoNetworkError",
    });
  });

  it("returns 'down' with 'Unknown error' for non-Error rejections", async () => {
    mockDb.command.mockRejectedValue("raw error");

    const indicator = new MongoHealthIndicator(mockDb);
    const result = await indicator.check();

    expect(result).toEqual({
      name: "mongo",
      status: "down",
      message: "Unknown error",
    });
  });

  // ── Timeout ───────────────────────────────────────────────────────────────

  it("returns 'down' when command exceeds the configured timeout", async () => {
    jest.useFakeTimers();
    mockDb.command.mockImplementation(() => new Promise(() => {}));

    const indicator = new MongoHealthIndicator(mockDb, 100);
    const checkPromise = indicator.check();

    jest.advanceTimersByTime(150);

    const result = await checkPromise;
    expect(result).toEqual({ name: "mongo", status: "down", message: "Timeout" });

    jest.useRealTimers();
  });
});
