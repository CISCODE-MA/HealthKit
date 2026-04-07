# @ciscode/health-kit

A NestJS health-check module providing **liveness** and **readiness** probe endpoints with built-in PostgreSQL, Redis, and HTTP indicators, plus a simple API for custom indicators.

## 📦 Installation

```bash
npm install @ciscode/health-kit
```

**Peer dependencies** (install the ones you use):

```bash
npm install @nestjs/common @nestjs/core reflect-metadata rxjs
# Optional — only needed if you use @nestjs/terminus alongside this package
npm install @nestjs/terminus
```

---

## 🚀 Quick Start

### `HealthKitModule.register()`

```typescript
import { Module } from "@nestjs/common";
import {
  HealthKitModule,
  PostgresHealthIndicator,
  RedisHealthIndicator,
  HttpHealthIndicator,
} from "@ciscode/health-kit";
import { Pool } from "pg";
import Redis from "ioredis";

@Module({
  imports: [
    HealthKitModule.register({
      path: "health", // → GET /health/live  and  GET /health/ready
      liveness: [],
      readiness: [
        new PostgresHealthIndicator(
          new Pool({
            host: "localhost",
            port: 5432,
            user: "postgres",
            password: "",
            database: "mydb",
          }),
          3000, // timeout ms
        ),
        new RedisHealthIndicator(new Redis({ host: "localhost", port: 6379, lazyConnect: true })),
        new HttpHealthIndicator("https://api.example.com/health", 3000),
      ],
    }),
  ],
})
export class AppModule {}
```

---

## 🔌 Endpoints

| Endpoint            | Description                                       |
| ------------------- | ------------------------------------------------- |
| `GET /{path}/live`  | Liveness probe — is the process alive?            |
| `GET /{path}/ready` | Readiness probe — are all dependencies reachable? |

### 200 OK — all indicators up

```json
{
  "status": "ok",
  "results": [
    { "name": "postgres", "status": "up" },
    { "name": "redis", "status": "up" },
    { "name": "http", "status": "up" }
  ]
}
```

### 503 Service Unavailable — any indicator down

```json
{
  "status": "error",
  "results": [
    { "name": "postgres", "status": "down", "message": "connect ECONNREFUSED 127.0.0.1:5432" },
    { "name": "redis", "status": "up" },
    { "name": "http", "status": "down", "message": "HTTP 503 Service Unavailable" }
  ]
}
```

All indicators run **concurrently** via `Promise.allSettled` — one failure never blocks the others.

---

## 🛠 Built-in Indicators

### `PostgresHealthIndicator`

Runs `SELECT 1` against the pool. Supports a configurable timeout.

```typescript
import { Pool } from "pg";
new PostgresHealthIndicator(pool, 3000 /* timeout ms, default 3000 */);
```

### `RedisHealthIndicator`

Sends a `PING` command. Compatible with `ioredis`.

```typescript
import Redis from "ioredis";
new RedisHealthIndicator(new Redis({ host: "localhost", port: 6379, lazyConnect: true }));
```

### `HttpHealthIndicator`

Makes a `GET` request to the URL. Any **2xx** response is healthy; non-2xx, network errors, and timeouts are reported as `"down"`.

```typescript
new HttpHealthIndicator("https://api.example.com/health", 3000 /* timeout ms */);
```

---

## ✏️ Custom Indicators

### Way 1 — `createIndicator` (inline factory)

The simplest option. No class needed — just a name and an async function returning a boolean.

```typescript
import { createIndicator, HealthKitModule } from "@ciscode/health-kit";

const appVersionCheck = createIndicator("app-version", async () => {
  return !!process.env["npm_package_version"]; // true → up, false → down
});

HealthKitModule.register({
  liveness: [appVersionCheck],
  readiness: [],
});
```

### Way 2 — `BaseHealthIndicator` + `@HealthIndicator` decorator (DI-based)

For indicators that need NestJS dependency injection.

```typescript
import { Injectable } from "@nestjs/common";
import { BaseHealthIndicator, HealthIndicator, HealthIndicatorResult } from "@ciscode/health-kit";

@HealthIndicator("readiness") // auto-routes to readiness list
@Injectable()
export class EnvHealthIndicator extends BaseHealthIndicator {
  readonly name = "env";

  async check(): Promise<HealthIndicatorResult> {
    const missing = ["DB_HOST", "DB_USER"].filter((k) => !process.env[k]);
    if (missing.length) {
      return this.result("down", `Missing env vars: ${missing.join(", ")}`);
    }
    return this.result("up");
  }
}

// Register via the `indicators` array — NestJS handles DI automatically
HealthKitModule.register({
  liveness: [],
  readiness: [],
  indicators: [EnvHealthIndicator],
});
```

---

## ⚙️ Async Configuration — `registerAsync()`

Use this when your options depend on NestJS providers (e.g. `ConfigService`).

```typescript
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import Redis from "ioredis";

HealthKitModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    path: "health",
    liveness: [],
    readiness: [
      new PostgresHealthIndicator(
        new Pool({
          host: config.get("DB_HOST"),
          port: config.get<number>("DB_PORT"),
          user: config.get("DB_USER"),
          password: config.get("DB_PASSWORD"),
          database: config.get("DB_NAME"),
        }),
      ),
      new RedisHealthIndicator(
        new Redis({
          host: config.get("REDIS_HOST"),
          port: config.get<number>("REDIS_PORT"),
          lazyConnect: true,
        }),
      ),
    ],
  }),
});
```

---

## 📖 API Reference

### `HealthKitModule.register(options)`

| Option       | Type                          | Default    | Description                                                    |
| ------------ | ----------------------------- | ---------- | -------------------------------------------------------------- |
| `path`       | `string`                      | `"health"` | URL prefix for the probe endpoints                             |
| `liveness`   | `IHealthIndicator[]`          | `[]`       | Indicators for `GET /{path}/live`                              |
| `readiness`  | `IHealthIndicator[]`          | `[]`       | Indicators for `GET /{path}/ready`                             |
| `indicators` | `Type<BaseHealthIndicator>[]` | `[]`       | DI-based indicator classes (decorated with `@HealthIndicator`) |

### `HealthKitModule.registerAsync(options)`

| Option       | Type                                                               | Description                           |
| ------------ | ------------------------------------------------------------------ | ------------------------------------- |
| `imports`    | `ModuleMetadata['imports']`                                        | Modules to import for the factory     |
| `inject`     | `any[]`                                                            | Providers to inject into `useFactory` |
| `useFactory` | `(...args) => HealthModuleOptions \| Promise<HealthModuleOptions>` | Factory returning the module options  |
| `indicators` | `Type<BaseHealthIndicator>[]`                                      | DI-based indicator classes            |

### `HealthIndicatorResult`

```typescript
interface HealthIndicatorResult {
  name: string;
  status: "up" | "down";
  message?: string; // error message when down
  details?: unknown; // optional structured metadata
}
```

### `HealthCheckResult`

```typescript
interface HealthCheckResult {
  status: "ok" | "error";
  results: HealthIndicatorResult[];
}
```

---

## 📝 Scripts

```bash
npm run build        # Compile to dist/
npm run typecheck    # TypeScript type check only
npm test             # Run jest
npm run test:cov     # Run jest with coverage (≥ 85% required)
npm run lint         # ESLint
npm run format:write # Prettier fix
```

---

## 📄 License

MIT

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 🆘 Support

- [GitHub Issues](https://github.com/CISCODE-MA/HealthKit/issues)
