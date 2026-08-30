---
name: open-banking-provider
description: Use when touching packages/provider, the Plaid client, or the sync write path that turns provider responses into accounts and transactions. Covers the diff shape of /transactions/sync, amount normalisation, pending rows, and the raw payload rule.
---

# Open banking provider

`packages/provider` is the only place in the repository allowed to call
`fetch`. ESLint enforces that. Everything below is about what to do with what
comes back.

## `/transactions/sync` is a diff, not a window

The endpoint returns `added`, `modified` and `removed` relative to a cursor. It
does not return a time window that you receive again on the next call. Two
consequences:

**Dedupe is a unique constraint plus an upsert.** `providerTransactionId` is
unique, and the write path upserts on it. It is never a plain insert, and it is
never a "have I seen this already" lookup in application code.

**Apply `modified` and `removed` regardless.** Posted transactions are not
immutable. A description can change, an amount can be corrected, a transaction
can be withdrawn days after it posted. A sync that only handles `added` drifts
away from the truth and never comes back.

`removed` is a soft delete. Set `removedAt` rather than deleting the row, so
the transaction leaves the stats while the sync stays idempotent.

## Amounts

Plaid returns a **positive** amount for money **leaving** the account. That is
the opposite of what most people assume, and every stats bug in this shape of
application traces back to it.

Normalise once, at the persistence boundary, into two columns:

- `amount`, unsigned, always positive.
- `direction`, either `in` or `out`.

Nothing downstream should ever have to know the provider's sign convention.
Do the conversion in exactly one place, so there is exactly one place to be
wrong.

Money is `Decimal`, never a float, at every step.

## Pending transactions

Skip anything with `pending: true` on write. A pending transaction gets a
different id when it posts, so writing it produces a duplicate that no unique
constraint can catch.

Note that this applies to writes only. `modified` and `removed` are applied
regardless of pending state, because they refer to rows that already exist.

## Raw first

Write the raw response to `raw_provider_payloads` **before parsing anything**.
The table is append only. Application code never updates it and never deletes
from it, and the read path never queries it.

This gives four things:

- **Replay.** A normalisation bug found three months later is fixable from
  stored bytes, without going back to the provider. Provider history windows
  are limited and consent expires, so what is not stored is often gone for good.
- **Audit.** When a customer disputes a figure, the answer is the exact bytes
  the bank returned at that moment, not a reconstruction from our own tables.
- **Schema drift.** Providers add and change fields without telling anyone. A
  new field becomes a query rather than a redeploy.
- **Ingest cannot fail on interpretation.** The fetch activity writes raw and
  succeeds. A parsing error fails a separate activity that retries on its own,
  and the fetch never repeats.

`responseHash` exists so an identical repeat payload can be recognised and
skipped rather than reprocessed.

## Accounts arrive with the transactions

`/transactions/sync` returns an `accounts` array alongside `added`, `modified`
and `removed`. The write path upserts those accounts from the same payload
before it writes any transactions.

This is not an optimisation, it is what makes the ordering safe. Transactions
carry a foreign key to an account, so a transaction for an account that appeared
since the last sync would fail its insert if accounts were only refreshed
afterwards. Taking the accounts from the payload you already have costs no extra
call and removes the ordering hazard entirely.

## The backfill is not instant

A newly linked item returns `transactions_update_status: NOT_READY` and an empty
`added` array while Plaid pulls history from the institution. That is a
legitimate empty sync, not a failure, and it can last seconds to minutes.

Anything that polls must read `transactions_update_status` and keep polling on a
short interval until it reads `HISTORICAL_UPDATE_COMPLETE`. Treating the first
empty response as "nothing to do" and falling back to the normal four-hourly
schedule leaves a freshly linked account showing an empty table for four hours.

## The sandbox

`days_requested` is set to 730 on both the link token and the sync call, and the
Plaid sandbox still returns about 90 days for a custom user. That is a sandbox
ceiling, not a bug to chase.

Two sandbox user shapes, and they do not overlap. `user_custom` takes a JSON
ledger as its password and gives whatever data you write, which is the only way
to get business-shaped GBP figures, but its transaction set is fixed and
`/sandbox/transactions/create` does nothing to it. `user_transactions_dynamic`
accepts injected transactions but only serves Plaid's default US retail
spending. `make seed` uses the first, `make seed-dynamic` the second.

One more sandbox trap: in the `user_custom` JSON, `version` must be a number.
A string there is rejected as `INVALID_CREDENTIALS`, which points nowhere near
the actual problem. Omitting it entirely is safest.
