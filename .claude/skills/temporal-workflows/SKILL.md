---
name: temporal-workflows
description: Use when writing or editing anything under apps/worker, or any Temporal workflow, activity or worker registration. Covers determinism rules, where side effects belong, continueAsNew, and when the sync cursor may be persisted.
---

# Temporal workflows

This skill exists because non-deterministic workflow code does not fail loudly.
It fails on replay, days later, on a history you cannot reproduce locally. The
rules below are not style preferences, they are the difference between a
workflow that survives a worker restart and one that does not.

## Determinism

A workflow function is replayed from its event history every time the worker
picks it up again. Any value that differs between the original run and the
replay corrupts the run.

Inside a workflow function, never use:

- `Date.now()`, `new Date()`. Use `workflow.now()`.
- `Math.random()`, `crypto.randomUUID()`. Pass a seed in as workflow input or
  generate it in an activity.
- `setTimeout`. Use `workflow.sleep()`.
- `fetch` or any HTTP client. ESLint bans `fetch` outside `packages/provider`
  anyway, and this is the reason it is banned in the worker too.
- Prisma, or any other database access.
- Reading `process.env`.
- Iterating a `Set` or a `Map` whose insertion order depends on anything
  outside the history.

Everything in that list is a side effect, and every side effect belongs in an
activity. The workflow decides what happens and in what order. The activity is
the only thing that touches the world.

## Activities

Activities are retried independently, so they must be idempotent. Assume every
activity will run at least twice.

Split the work so that a failure retries as little as possible. Fetching a page
from the provider and writing it to the raw table is one activity, and it
succeeds as soon as the bytes are safe. Parsing those bytes into normalised
rows is a second activity, so a parsing bug fails and retries on its own and
never causes a refetch.

## History growth

Workflow history is bounded. A long-lived or looping workflow must call
`continueAsNew` before the history grows unbounded, passing forward whatever
state the next run needs. A sync loop that polls indefinitely without
`continueAsNew` will eventually hit the limit and fail in production, having
worked perfectly in every test.

## The sync cursor

`/transactions/sync` is paginated. The next cursor is only valid once every
page in the current round has been fetched and persisted.

**Persist `accessConsent.syncCursor` only after the full pagination loop has
completed.** Never mid-pages.

A cursor saved after page two of five, followed by a crash, means the next run
resumes from a point past transactions that were never written. Nothing errors.
Nothing retries. The balances are simply wrong, and there is no signal anywhere
that says so. This is the single most expensive mistake available in this
codebase, so treat the cursor write as the commit at the end of the loop and
nothing earlier.
