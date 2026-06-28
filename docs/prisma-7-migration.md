# Prisma 6 → 7 migration plan (deferred)

**Status:** not started. Staying on Prisma 6.19.x for now — it builds clean and has no
known advisories. Prisma 7 is a breaking upgrade that needs a dedicated session where the
**Docker image build can actually be tested**, because it introduces a native module.

Source: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7

## Why it's bigger than a version bump

Prisma 7 makes **driver adapters mandatory for every database, including SQLite**, and
moves the generated client out of `node_modules`. That ripples through the schema, the
client setup, every `@prisma/client` import, the `.env` loading, and the Dockerfile.

## Prerequisites

- Node **≥ 20.19** (recommended 22.x). Check local Node and bump the Docker base image
  from `node:20-alpine` if it resolves below 20.19 (`node:22-alpine` is safest).
- TypeScript ≥ 5.4 — already on 5.8.3, fine.

## Steps

1. **Dependencies**
   - Bump `prisma` and `@prisma/client` to `^7`.
   - Add runtime deps: `@prisma/adapter-better-sqlite3` and `better-sqlite3` (native C++ addon).
   - Add `dotenv` (Prisma 7 no longer auto-loads `.env`).

2. **`prisma.config.ts`** (new, at repo root) — replaces the `package.json#prisma` block:
   ```ts
   import 'dotenv/config';
   import { defineConfig } from 'prisma/config';

   export default defineConfig({
     schema: 'prisma/schema.prisma',
     migrations: { seed: 'tsx prisma/seed.ts' },
   });
   ```
   Then **remove** the `"prisma": { "seed": ... }` block from `package.json`.

3. **schema.prisma generator** — switch provider + add required `output`:
   ```prisma
   generator client {
     provider = "prisma-client"
     output   = "../src/generated/prisma"
   }
   ```
   Put the output dir in `.gitignore`. (`prisma generate` recreates it.)

4. **`src/lib/prisma.ts`** — import from the generated path and pass a driver adapter:
   ```ts
   import { PrismaClient } from '@/generated/prisma/client';
   import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

   const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
   export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter, log: [...] });
   ```

5. **Repoint every `@prisma/client` import** to the generated client. Currently that's the
   `import type { User } from '@prisma/client'` in `src/lib/auth.ts`, plus `PrismaClient` in
   `prisma/seed.ts`. Grep before finishing: `rg "@prisma/client" src prisma`.

6. **`next.config.ts`** — add `better-sqlite3` to `serverExternalPackages` so the native
   module isn't bundled.

7. **Dockerfile** (the risky part — test this build):
   - `deps` stage: add `python3 make g++` (node-gyp toolchain) so `better-sqlite3` compiles.
   - Bump the globally-installed `prisma@6.19.3` to `prisma@7` (used for `migrate deploy`).
   - The generated client now lives at `src/generated/prisma` (built into `.next/standalone`),
     so the `COPY ... node_modules/.prisma` / `@prisma/client` lines change — verify what the
     standalone trace actually includes.
   - Copy the compiled `better-sqlite3` native binary into the runner stage (it won't be in
     the standalone trace as a plain module — confirm with a test `docker build` + run).

8. **`docker-entrypoint.sh`** — the inline `import('@prisma/client')` user-count check must
   point at the generated client (or be rewritten to call `prisma` from the app). `migrate
   deploy` now reads `prisma.config.ts`, so confirm `.env`/dotenv loads in the container.

## Verification (no test suite exists — do these manually)

- `npm run build` locally.
- `npm run db:migrate` + `npm run db:seed` against a scratch DB.
- Smoke test: login, list registrations, upload + download a file (exercises real queries).
- **`docker compose up --build`** end to end — this is the step that can't be verified
  without actually building the image; budget time for native-module build failures.
