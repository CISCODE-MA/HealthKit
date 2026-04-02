import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
  Type,
} from "@nestjs/common";
import { HealthService } from "@services/health.service";
import type { HealthCheckResult } from "@services/health.service";

/**
 * Factory that returns a NestJS controller class configured with the
 * caller-supplied `path` prefix (e.g. `"health"`).
 *
 * Platform-agnostic — works with Express and Fastify.
 * Returns 200 when all indicators are "up",
 * throws ServiceUnavailableException (503) when any indicator is "down".
 */
export function createHealthController(path: string): Type<unknown> {
  @Controller(path)
  class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get("live")
    @HttpCode(HttpStatus.OK)
    async live(): Promise<HealthCheckResult> {
      const result = await this.healthService.checkLiveness();
      if (result.status === "error") throw new ServiceUnavailableException(result);
      return result;
    }

    @Get("ready")
    @HttpCode(HttpStatus.OK)
    async ready(): Promise<HealthCheckResult> {
      const result = await this.healthService.checkReadiness();
      if (result.status === "error") throw new ServiceUnavailableException(result);
      return result;
    }
  }

  return HealthController;
}
