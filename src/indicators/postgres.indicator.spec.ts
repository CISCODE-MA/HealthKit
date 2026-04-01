import { PostgresHealthIndicator } from "./postgres.indicator";

describe("PostgresHealthIndicator", () => {
  const mockClient = { query: jest.fn() };

  // ── Success ──────────────────────────────────────────────────────────────

  it("returns 'up' when SELECT 1 succeeds", async () => {
    mockClient.query.mockResolvedValue({});

    const indicator = new PostgresHealthIndicator(mockClient);
    const result = await indicator.check();

    expect(result).toEqual({ name: "postgres", status: "up" });
    expect(mockClient.query).toHaveBeenCalledWith("SELECT 1");
  });

  // ── Error ─────────────────────────────────────────────────────────────────

  it("returns 'down' with message when query throws", async () => {
    mockClient.query.mockRejectedValue(new Error("Connection refused"));

    const indicator = new PostgresHealthIndicator(mockClient);
    const result = await indicator.check();

    expect(result).toEqual({
      name: "postgres",
      status: "down",
      message: "Connection refused",
    });
  });

  it("returns 'down' with 'Unknown error' for non-Error rejections", async () => {
    mockClient.query.mockRejectedValue("raw string error");

    const indicator = new PostgresHealthIndicator(mockClient);
    const result = await indicator.check();

    expect(result).toEqual({
      name: "postgres",
      status: "down",
      message: "Unknown error",
    });
  });

  // ── Timeout ───────────────────────────────────────────────────────────────

  it("returns 'down' when query exceeds the configured timeout", async () => {
    jest.useFakeTimers();
    // Simulate a query that never resolves
    mockClient.query.mockImplementation(() => new Promise(() => {}));

    const indicator = new PostgresHealthIndicator(mockClient, 100);
    const checkPromise = indicator.check();

    jest.advanceTimersByTime(150);

    const result = await checkPromise;
    expect(result).toEqual({ name: "postgres", status: "down", message: "Timeout" });

    jest.useRealTimers();
  });
});
