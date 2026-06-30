# Akadian Showcase Backend

## Stack

- **NestJS 11** + TypeScript, **TypeORM** (migrations, `synchronize: false`), **PostgreSQL**, **Redis**
- **JWT** via httpOnly cookies (not Authorization header). Access: 15m, Refresh: 7d (SHA256-hashed in Redis).
- **Stripe** for payments, **Discord webhook** for error alerts.
- **class-validator** + `whitelist: true`, `forbidNonWhitelisted: true` on the global ValidationPipe.
- Rate limiting via `@nestjs/throttler` backed by Redis.

## Commands

| Action | Command |
|--------|---------|
| Dev server (watch) | `npm run start:dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Unit tests | `npm test` |
| Unit test (coverage) | `npm run test:cov` |
| E2E tests | `npm run test:e2e` |
| Generate migration | `npm run migration:generate -- src/database/migrations/MigrationName` |
| Run migrations | `npm run migration:run` |
| Revert migration | `npm run migration:revert` |
| Seed DB | `npm run seed` |

**Setup order:** `npm install` → configure `.env` → start PostgreSQL + Redis `docker-compose up`→ `npm run migration:run` → `npm run seed` → `npm run start:dev`.


## Architecture

- Global prefix: `/api/v1`
- Swagger UI at `/docs` (non-production only)
- All responses wrapped: `{ success, data }`, errors: `{ success: false, error: { code, message } }`
- Paginated: `{ success, data, meta: { total, page, limit, totalPages } }`
- `CorrelationIdMiddleware` (X-Correlation-ID) runs globally

## Auth & RBAC

| Decorator | Purpose |
|-----------|---------|
| `@Public()` | Route bypasses JWT auth |
| `@CurrentUser()` | Injects JWT payload into handler param |
| `@Roles(Role.ADMIN)` | Guards with RBAC (ADMIN / COORDINATOR / TUTOR / STUDENT) |

Login lockout after 5 failed attempts in 15 min (Redis counter).

## Modules

| Module | Path | Key |
|--------|------|-----|
| IAM | `src/modules/iam/` | Auth (login/refresh/logout), user profile |
| Programs | `src/modules/programs/` | Program → Unit → UnitClass hierarchy |
| Payments | `src/modules/payments/` | Stripe checkout sessions + webhooks |
| Notifications | `src/modules/notifications/` | Discord error alerts |
| Shared | `src/shared/` | `@Global()` module (logger, error filter, transform interceptor, correlation middleware) |
| Common | `src/common/` | Decorators, enums, guards (no module) |

## Database

- UUID PKs (Postgres `uuid-ossp`), `snake_case` columns, `camelCase` entity properties
- Soft deletes on `User`, `Program` (`deleted_at`)
- Many-to-many join tables: `user_roles`, `role_permissions`
- Named migrations in `src/database/migrations/` (run by `typeorm-ts-node-commonjs`)

## Errors

Custom `DomainError` classes in `*/errors/` with `code: string` + `status: number`. The `AllExceptionsFilter` catches everything, formats it, and emits `system.error` events (monitored by Discord listener).

## Testing

- **Unit tests** (`*.spec.ts` co-located next to source in `src/`): Jest + `@nestjs/testing`, all dependencies mocked (no real DB connection). 

## Seed

`src/seed.ts` (standalone entrypoint) populates: permissions, 4 roles, 4 demo users (admin/coord/tutor/student), 2 demo programs.
