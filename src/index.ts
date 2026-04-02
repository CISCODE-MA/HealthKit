import "reflect-metadata";

// ============================================================================
// PUBLIC API EXPORTS
// ============================================================================

// ============================================================================
// MODULE
// ============================================================================
export { HealthKitModule } from "./health-kit.module";
export type { HealthModuleOptions } from "./health-kit.module";

// ============================================================================
// SERVICE (Programmatic API)
// ============================================================================
export { HealthService } from "./services/health.service";
export type { HealthCheckResult } from "./services/health.service";

// ============================================================================
// BUILT-IN INDICATORS
// ============================================================================
export { PostgresHealthIndicator } from "./indicators/postgres.indicator";
export type { PostgresClient } from "./indicators/postgres.indicator";

export { RedisHealthIndicator } from "./indicators/redis.indicator";
export type { RedisClient } from "./indicators/redis.indicator";

export { HttpHealthIndicator } from "./indicators/http.indicator";

export { MongoHealthIndicator } from "./indicators/mongo.indicator";
export type { MongoDb } from "./indicators/mongo.indicator";

// ============================================================================
// CUSTOM INDICATOR API
// ============================================================================
export { createIndicator } from "./indicators/create-indicator";
export { BaseHealthIndicator } from "./indicators/base.indicator";
export {
  HealthIndicator,
  HEALTH_INDICATOR_METADATA,
} from "./decorators/health-indicator.decorator";
export type { HealthIndicatorScope } from "./decorators/health-indicator.decorator";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export type {
  IHealthIndicator,
  HealthIndicatorResult,
  HealthStatus,
} from "./interfaces/health-indicator.interface";

// ============================================================================
// TYPES & INTERFACES (For TypeScript Typing)
// ============================================================================
// Export types and interfaces for TypeScript consumers
// export type { YourCustomType } from './types';

// ============================================================================
// ❌ NEVER EXPORT (Internal Implementation)
// ============================================================================
// These should NEVER be exported from a module:
// - Entities (internal domain models)
// - Repositories (infrastructure details)
//
// Example of what NOT to export:
// ❌ export { Example } from './entities/example.entity';
// ❌ export { ExampleRepository } from './repositories/example.repository';
//
// Why? These are internal implementation details that can change.
// Consumers should only work with DTOs and Services.
