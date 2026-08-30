# Coffer

Coffer is a dashboard showing a customer's linked bank accounts, their balances,
their transactions and the stats derived from them. Behind it sits a Temporal
workflow that syncs against Plaid, writes every provider response to a raw
append only table, and only then normalises and aggregates.

## Non-negotiable conventions

**Zero comments anywhere in the repository.** No `//`, no `/* */`, no JSDoc, no
TODOs. If a line needs explaining, rename something or extract a function until
it does not.

**Arrow functions only.** `const doThing = () => {}`, never
`function doThing() {}`. ESLint enforces this through `func-style`.

**British English in all prose and UI copy.** "colour", "behaviour",
"organise", "analyse", "centre". American spelling only where an API demands
it, such as CSS `color` and `text-align: center`, HTML attributes and
third-party identifiers. Match whatever spelling the language requires.

**No em-dashes anywhere.** Not in prose, not in UI copy, not in commit
messages, not in pull request descriptions. Use a comma or a full stop.

**Types come in their own `import type` statement**, never mixed into a value
import. ESLint enforces this through `consistent-type-imports` and a
`no-restricted-syntax` selector.

**Guard clauses, never nested ternaries.** Return early. `no-nested-ternary`
is an error.

**Repositories hold queries, services hold rules, controllers parse HTTP.**
Nothing else belongs in any of the three.

## Layering

Dependencies point inward and the boundaries are lint errors rather than
promises anyone has to remember.

| Boundary                                                | Enforced by                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| Components and pages call a service, never a repository | `no-restricted-imports` on `apps/web/components` and `apps/web/app` |
| A repository never imports a service                    | `no-restricted-imports` on `apps/web/lib/repositories`              |
| A service holds rules, not transport                    | `no-restricted-globals` on `apps/web/lib/services`                  |
| `fetch` is banned everywhere except `packages/provider` | `no-restricted-globals` on `apps/**` and `packages/**`              |

That last rule is the important one. It is what turns "nothing but the worker
touches the open banking layer" from a convention into a lint error. Outbound
calls to a bank live in `packages/provider` and nowhere else, so the set of
files that can reach a provider is a directory listing rather than an act of
faith.

Neither app may import a runtime value from a source-only workspace package,
only types. A runtime import dies at boot while the typecheck stays green.
`@coffer/database` is the exception, because it ships a built `dist`.

## Layout

```
apps/web            Next.js 16 App Router, Tailwind v4, port 3000
apps/api            NestJS 11, port 3001
apps/worker         Temporal worker
packages/database   schema.prisma, migrations, the built Prisma client
packages/contracts  request and response types shared by web, api and worker
packages/provider   Plaid client and normalisation
```

Packages are source-only. `main` points at `src/index.ts` and Next transpiles
them through `transpilePackages`, so there is no per-package build step and no
build ordering to maintain.

`packages/database` is the one exception. Prisma 7 generates TypeScript rather
than compiled JavaScript, and both `apps/api` and `apps/worker` run on swc,
which compiles only its own sources. So that package compiles itself to
CommonJS `dist`, `make db-build` runs ahead of typecheck, build and dev, and
`postinstall` runs it so a fresh clone works.

## Make targets

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
make replay        rebuild normalised tables from raw
```

`make migrate` authors a migration from a schema change and applies it.
`make deploy` applies migrations that already exist and authors nothing, which
is what a checkout that has fallen behind wants. After any schema change,
`make db-build` is what makes the new model visible to the API and the worker.

## Skills

| Skill                   | Read it before                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| `temporal-workflows`    | Writing or editing anything under `apps/worker`                      |
| `open-banking-provider` | Touching `packages/provider` or the sync write path                  |
| `database-package`      | Changing `schema.prisma` or wondering why a new model does not exist |
