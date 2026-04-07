import { HttpHealthIndicator } from "./http.indicator";

// Spy on globalThis.fetch so every test in this file uses a Jest mock.
// globalThis is correctly typed via "DOM" in tsconfig lib, so no cast needed.
let fetchSpy: jest.SpyInstance;

beforeAll(() => {
  fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(jest.fn());
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  fetchSpy.mockRestore();
});

describe("HttpHealthIndicator", () => {
  // ── Success (2xx) ─────────────────────────────────────────────────────────

  it("returns 'up' when the endpoint responds with 200", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200, statusText: "OK" });

    const indicator = new HttpHealthIndicator("https://example.com/health");
    const result = await indicator.check();

    expect(result).toEqual({ name: "http", status: "up" });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.com/health",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns 'up' for any 2xx status code", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 204, statusText: "No Content" });

    const result = await new HttpHealthIndicator("https://example.com/health").check();

    expect(result).toEqual({ name: "http", status: "up" });
  });

  // ── Non-2xx ───────────────────────────────────────────────────────────────

  it("returns 'down' with HTTP status when endpoint responds with 503", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 503, statusText: "Service Unavailable" });

    const result = await new HttpHealthIndicator("https://example.com/health").check();

    expect(result).toEqual({
      name: "http",
      status: "down",
      message: "HTTP 503 Service Unavailable",
    });
  });

  it("returns 'down' with HTTP status when endpoint responds with 404", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" });

    const result = await new HttpHealthIndicator("https://example.com/health").check();

    expect(result).toEqual({
      name: "http",
      status: "down",
      message: "HTTP 404 Not Found",
    });
  });

  // ── Network error ─────────────────────────────────────────────────────────

  it("returns 'down' with message when fetch throws a network error", async () => {
    fetchSpy.mockRejectedValue(new Error("Network failure"));

    const result = await new HttpHealthIndicator("https://example.com/health").check();

    expect(result).toEqual({
      name: "http",
      status: "down",
      message: "Network failure",
    });
  });

  it("returns 'down' with 'Unknown error' for non-Error rejections", async () => {
    fetchSpy.mockRejectedValue("string error");

    const result = await new HttpHealthIndicator("https://example.com/health").check();

    expect(result).toEqual({ name: "http", status: "down", message: "Unknown error" });
  });

  // ── Timeout ───────────────────────────────────────────────────────────────

  it("returns 'down' with 'Timeout' when fetch is aborted due to timeout", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    fetchSpy.mockRejectedValue(abortError);

    const result = await new HttpHealthIndicator("https://example.com/health", 100).check();

    expect(result).toEqual({ name: "http", status: "down", message: "Timeout" });
  });
});
