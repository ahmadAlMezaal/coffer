---
name: database-package
description: Use when changing schema.prisma, adding a migration, or when a model that plainly exists in the schema does not exist as far as apps/api or apps/worker are concerned. Explains why make db-build sits between a schema change and the rest of the repository.
---

# The database package

`packages/database` is one of the two workspace packages with a build step, and
this is why. `packages/provider` is the other, for the same reason: `apps/api`
imports it at runtime for the two link-time Plaid calls. `make db-build` builds
both.

Prisma 7 generates TypeScript into `src/generated` rather than compiled
JavaScript. `apps/api` and `apps/worker` both compile with swc, and swc
compiles only its own sources, so neither app will ever compile the generated
client for you. The package therefore compiles itself to CommonJS `dist`, and
that `dist` is what the apps import.

## The rule

**A schema change is not visible to `apps/api` or `apps/worker` until
`make db-build` has run.**

Until it does, both apps typecheck against the previous client. A model you
just added reads as a property that does not exist. A field you just renamed
still has its old name and the new one is an error. The schema on disk and the
types in your editor disagree, and the schema is not the one winning.

If you have just edited `schema.prisma` and the compiler is insisting a model
is missing, you have not found a bug. You have found this.

```
make db-build
```

`postinstall` runs the same thing, so a fresh clone works without anyone having
to know this.

The same trap applies to `packages/provider`. Change a type in
`packages/provider/src` and `apps/worker` will typecheck against the old `dist`
until `make db-build` runs, so a field you just added reads as a property that
does not exist.

## Migrations

```
make migrate    author a migration from the current schema and apply it
make deploy     apply migrations that already exist, authoring none
```

`make migrate` is for a schema you have just changed. `make deploy` is for a
checkout that has fallen behind, and it never writes a new migration.

Both are separate from `make db-build`. A migration changes the database. A
build changes the types. You will usually want both, in that order.

## Where things live

- `prisma/schema.prisma` is the model.
- `prisma.config.ts` holds the connection URL. Prisma 7 removed `url` from the
  datasource block in the schema, so it is read from `DATABASE_URL` here.
- `src/generated` is Prisma output. It is gitignored, and both ESLint and
  Prettier skip it. Never edit it and never commit it.
- `src/client.ts` constructs the client through `@prisma/adapter-pg`, which
  Prisma 7 requires for a direct Postgres connection.
- `dist` is what the apps actually import.

## Money

Every monetary column is `Decimal` with `@db.Decimal(14, 2)`, never a float.
This holds in the schema, in the provider normalisation and in the stats.
