---
"@ciscode/health-kit": minor
---

Initial release of `@ciscode/health-kit` v0.1.0.

### Features

- `HealthKitModule.register()` and `registerAsync()` — dynamic NestJS module with configurable liveness and readiness probes
- Built-in `PostgresHealthIndicator` (`SELECT 1`), `RedisHealthIndicator` (`PING`), `HttpHealthIndicator` (GET 2xx check) — all with configurable timeout
- `createIndicator(name, fn)` — inline factory for simple custom indicators
- `BaseHealthIndicator` abstract class + `@HealthIndicator('liveness' | 'readiness')` decorator for DI-based custom indicators
- `GET /{path}/live` and `GET /{path}/ready` endpoints — 200 OK / 503 with `{ status, results[] }` body
- All indicators run concurrently via `Promise.allSettled`
- `path` option defaults to `"health"`
