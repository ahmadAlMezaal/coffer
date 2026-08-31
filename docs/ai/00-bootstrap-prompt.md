# Coffer, stage one: bootstrap

Everything up to a working repository with a schema ready to migrate. Stop at
the end and hand back. Do not start on the provider, the worker, the API or the
dashboard, those are in `BUILD.md`.

## Stop condition

You are done when the repository is on GitHub, `make up` brings Postgres and
Temporal up, `make db-build` succeeds, and `schema.prisma` is complete and
committed. The human runs `make migrate` and confirms before stage two starts.

## Prerequisites to check first

Node 24, pnpm 11, Docker, and the Temporal CLI. If the Temporal CLI is missing,
`brew install temporal`. Report anything absent rather than working around it.

## 1. Repository

Working directory is a new folder named `coffer`.

```
git init -b main
```

Write `.gitignore` before the first commit. It must cover `node_modules`,
`.next`, `dist`, `src/generated`, `.turbo`, `.env`, `.env.*`, `.DS_Store` and
`.claude/settings.local.json`.

The `.env` entries matter more than the rest. The Plaid client id and secret
live there and must never reach a commit. Write `.env.example` with the keys and
empty values, commit that instead.

Remote is `https://github.com/ahmadAlMezaal/coffer`. It may not exist yet, so
check with `gh repo view ahmadAlMezaal/coffer`. If it does not exist, create it
with `gh repo create ahmadAlMezaal/coffer --private --source=. --remote=origin`.
If it does, `git remote add origin` and push. Push after each numbered section
below rather than once at the end, so the history shows the scaffold being
built rather than arriving in one commit.

Commits read as a sentence about the product, lower case after the type, as in
`chore: set up the workspace` or `feat: add the schema`.

## 2. Workspace

pnpm workspaces. `pnpm-workspace.yaml` listing `apps/*` and `packages/*`.

```
apps/web            Next.js 16 App Router, Tailwind v4, port 3000
apps/api            NestJS 11, port 3001
apps/worker         Temporal worker
packages/database   schema.prisma, migrations, the built Prisma client
packages/contracts  request and response types shared by web, api and worker
packages/provider   Plaid client and normalisation
```

Scaffold all six with a `package.json` and a `tsconfig.json` each, scoped
`@coffer/*`. The apps can stay empty beyond a placeholder entry point, stage two
fills them.

Packages are source-only, `main` points at `src/index.ts`, and Next transpiles
them through `transpilePackages`. There is no per-package build step and no
build ordering to maintain.

`packages/database` is the one exception. Prisma 7 generates TypeScript rather
than compiled JavaScript, and both `apps/api` and `apps/worker` run on swc,
which compiles only its own sources. So that package compiles itself to
CommonJS `dist`, `make db-build` runs ahead of typecheck, build and dev, and
`postinstall` runs it so a fresh clone works.

Neither app may import a runtime value from a source-only workspace package,
only types. It dies at boot while the typecheck stays green. `@coffer/database`
is exempt because it ships built `dist`.

Root `package.json` needs `engines` matching `.nvmrc`, which pins Node 24.

ESLint config comes from the file the human is supplying. Copy it in as
`eslint.config.mjs` and make three changes. Rename the `@cursus/**` path group
to `@coffer/**`. Drop the `NO_UNCACHED_ACCOUNT_READ` selector, it belongs to a
different codebase. Add a block restricting the `fetch` global everywhere except
`packages/provider`, with the message that outbound calls belong in the provider
package.

Prettier alongside it, and `eslint-config-prettier` last in the config array.

Vitest, not Jest, across the workspace.

## 3. CLAUDE.md and skills

Root `CLAUDE.md` covering, in this order:

What Coffer is, in two sentences. A dashboard showing a customer's linked bank
accounts, balances, transactions and the stats derived from them, backed by a
Temporal sync against Plaid.

Non-negotiable conventions. Zero comments anywhere in the repo, no `//`, no
`/* */`, no JSDoc, no TODOs. Arrow functions only. British English in all prose
and UI copy, American spelling only where an API demands it. No em-dashes
anywhere, including commit messages and PR descriptions. Types in their own
`import type` statement, never mixed with value imports. Guard clauses, never
nested ternaries. Repositories hold queries, services hold rules, controllers
parse HTTP.

The layering, and the note that ESLint enforces it rather than trusting anyone
to remember. `fetch` is banned everywhere except `packages/provider`, which is
what turns "nothing but the worker touches the open banking layer" from a
convention into a lint error.

The layout block from section 2, the Makefile targets from section 5, and a
table pointing at the three skills.

Then `.claude/skills/` with three skills:

**`temporal-workflows`.** Determinism. No `Date.now()`, no `Math.random()`, no
HTTP and no Prisma inside a workflow function. Use `workflow.now()` and
`workflow.sleep()`. All side effects go in activities. `continueAsNew` before
history grows unbounded. The sync cursor is persisted only after a full
pagination loop completes, because a cursor saved mid-pages followed by a crash
silently skips transactions and nothing reports it. This skill exists because
non-deterministic workflow code does not fail loudly, it fails on replay.

**`open-banking-provider`.** `/transactions/sync` is a diff API returning
`added`, `modified` and `removed` against a cursor, not a window you re-receive
each call, so dedupe is a unique constraint plus an upsert. Plaid returns
positive amounts for money leaving the account, so normalise to an unsigned
`amount` plus a `direction` at the persistence boundary, once. Skip anything
with `pending: true` on write. Apply `modified` and `removed` regardless,
because posted transactions are not immutable. Write the raw response before
parsing anything. `fetch` is allowed here and nowhere else.

**`database-package`.** A schema change is not visible to `apps/api` or
`apps/worker` until `make db-build` runs. Until it does, both typecheck against
the previous client and a new model reads as a property that does not exist.

## 4. Schema

`packages/database/prisma/schema.prisma`. The full model, with a companion
`SCHEMA.md` at the root explaining the shape.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ConsentStatus {
  processing
  active
  reauth_required
  revoked
}

enum Direction {
  in
  out
}

enum SyncRunStatus {
  running
  succeeded
  failed
}

model User {
  id        String          @id @default(uuid()) @db.Uuid
  email     String          @unique
  createdAt DateTime        @default(now())
  consents  AccessConsent[]
  stats     StatsSnapshot[]

  @@map("users")
}

model AccessConsent {
  id              String              @id @default(uuid()) @db.Uuid
  userId          String              @db.Uuid
  user            User                @relation(fields: [userId], references: [id])
  provider        String              @default("plaid")
  providerItemId  String              @unique
  accessToken     String
  institutionId   String?
  institutionName String?
  status          ConsentStatus       @default(processing)
  syncCursor      String?
  consentedAt     DateTime            @default(now())
  expiresAt       DateTime?
  lastSyncedAt    DateTime?
  createdAt       DateTime            @default(now())
  accounts        Account[]
  syncRuns        SyncRun[]
  rawPayloads     RawProviderPayload[]

  @@index([userId])
  @@map("access_consents")
}

model Account {
  id                String        @id @default(uuid()) @db.Uuid
  accessConsentId   String        @db.Uuid
  accessConsent     AccessConsent @relation(fields: [accessConsentId], references: [id])
  providerAccountId String        @unique
  name              String
  mask              String?
  type              String
  subtype           String?
  currency          String        @default("GBP")
  currentBalance    Decimal       @db.Decimal(14, 2)
  availableBalance  Decimal?      @db.Decimal(14, 2)
  balanceAsOf       DateTime      @default(now())
  createdAt         DateTime      @default(now())
  transactions      Transaction[]

  @@index([accessConsentId])
  @@map("accounts")
}

model Transaction {
  id                    String        @id @default(uuid()) @db.Uuid
  accountId             String        @db.Uuid
  account               Account       @relation(fields: [accountId], references: [id])
  providerTransactionId String        @unique
  amount                Decimal       @db.Decimal(14, 2)
  direction             Direction
  currency              String        @default("GBP")
  bookedAt              DateTime      @db.Date
  description           String
  merchantName          String?
  category              String?
  paymentMethod         String?
  isInternalTransfer    Boolean       @default(false)
  internalTransferPairId String?      @db.Uuid
  internalTransferPair  Transaction?  @relation("InternalTransfer", fields: [internalTransferPairId], references: [id], onDelete: SetNull)
  pairedWith            Transaction[] @relation("InternalTransfer")
  removedAt             DateTime?
  createdAt             DateTime      @default(now())

  @@index([accountId, bookedAt(sort: Desc)])
  @@index([accountId, amount, bookedAt])
  @@map("transactions")
}

model RawProviderPayload {
  id              String        @id @default(uuid()) @db.Uuid
  accessConsentId String        @db.Uuid
  accessConsent   AccessConsent @relation(fields: [accessConsentId], references: [id])
  syncRunId       String?       @db.Uuid
  syncRun         SyncRun?      @relation(fields: [syncRunId], references: [id])
  provider        String        @default("plaid")
  endpoint        String
  requestCursor   String?
  responseBody    Json
  responseHash    String
  httpStatus      Int
  receivedAt      DateTime      @default(now())

  @@index([accessConsentId, receivedAt(sort: Desc)])
  @@index([responseHash])
  @@map("raw_provider_payloads")
}

model StatsSnapshot {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @db.Uuid
  user           User     @relation(fields: [userId], references: [id])
  periodStart    DateTime @db.Date
  periodEnd      DateTime @db.Date
  totalBalance   Decimal  @db.Decimal(14, 2)
  monthlyInflow  Decimal  @db.Decimal(14, 2)
  monthlyOutflow Decimal  @db.Decimal(14, 2)
  netBurn        Decimal  @db.Decimal(14, 2)
  runwayDays     Int?
  cashZeroAt     DateTime? @db.Date
  computedAt     DateTime @default(now())

  @@index([userId, periodStart])
  @@map("stats_snapshots")
}

model SyncRun {
  id                    String               @id @default(uuid()) @db.Uuid
  accessConsentId       String               @db.Uuid
  accessConsent         AccessConsent        @relation(fields: [accessConsentId], references: [id])
  workflowId            String
  status                SyncRunStatus        @default(running)
  transactionsAdded     Int                  @default(0)
  transactionsModified  Int                  @default(0)
  transactionsRemoved   Int                  @default(0)
  error                 String?
  startedAt             DateTime             @default(now())
  finishedAt            DateTime?
  rawPayloads           RawProviderPayload[]

  @@index([accessConsentId])
  @@map("sync_runs")
}
```

Two things about this schema worth carrying into the write-up. Accounts hang off
the consent rather than the user, because one connection to a bank yields
several accounts sharing one token, one cursor and one expiry, and pointing them
at the user means you cannot resync or revoke a single bank in isolation.
Transactions are soft deleted through `removedAt`, because removed transactions
still have to leave the stats and a soft delete keeps the sync idempotent.

Money is `Decimal`, never float.

## 5. Makefile

```
make up            postgres and the temporal dev server
make down          stop both
make install       pnpm install
make db-build      prisma generate and compile the database package
make migrate       author and apply a migration
make deploy        apply pending migrations without authoring one
make seed          seed the user and a sandbox consent
make dev           web, api and worker together
make worker        worker only
make sync          trigger the sync workflow manually for a consent
make check         lint, typecheck and test
make replay        stretch, rebuild normalised tables from raw
```

`make migrate` authors a migration from a schema change and applies it.
`make deploy` applies migrations that already exist and authors nothing, which
is what a checkout that has fallen behind wants. After any schema change,
`make db-build` is what makes the new model visible to the API and the worker.

Targets that are not implementable yet, `seed`, `sync` and `replay`, should
exist and print a message saying stage two fills them. A missing target is worse
than a stubbed one.

## 6. Local services

`docker-compose.yml` with Postgres 16 on 5432, a named volume, and a healthcheck.

Temporal is not in compose. `temporal server start-dev` is a single binary with
gRPC on 7233 and a web UI on 8233, which is less to run and gives a UI worth
showing in the demo. `make up` starts compose and then backgrounds the Temporal
dev server.

`.env.example` needs `DATABASE_URL`, `PLAID_CLIENT_ID`, `PLAID_SECRET`,
`PLAID_ENV=sandbox`, `TEMPORAL_ADDRESS=localhost:7233` and `NEXT_PUBLIC_API_URL`.

## 7. Verify, then stop

Run in order and report the result of each.

```
make install
make up
make db-build
pnpm lint
pnpm typecheck
```

Then commit and push. Then stop and say the schema is ready to migrate.

Do not run `make migrate` yourself. The human runs it, checks the generated SQL,
and confirms before stage two begins.
