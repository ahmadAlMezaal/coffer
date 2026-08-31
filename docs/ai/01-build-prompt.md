# Coffer, stage two: build

Assumes `BOOTSTRAP.md` is finished, the migration has been applied by the human,
and `make db-build` is green. If any of that is not true, stop and say so.

## Scope discipline

The brief asks for a basic version and caps it at roughly four hours. The stated
interest is in how much gets finished and which shortcuts get taken, not in the
best possible technical solution.

So the failure mode is over-engineering, not under-building. Every shortcut is
fine as long as it is written down. `ASSUMPTIONS.md` is a deliverable, not an
apology.

The one thing not to shortcut is Temporal. The brief says it is important to try
it because they use it extensively and it shows what working on their backend is
like. Substituting a queue would remove the single thing they asked to see.

## Architecture

Read path and write path are separate processes.

The API reads Postgres and nothing else. The worker is the only process holding
provider credentials or making outbound calls. Four things follow. Frontend
latency is decoupled from Plaid's. A user hammering refresh cannot burn the
provider quota. Access tokens never live in a process serving public traffic.
And a Plaid outage degrades to stale data rather than an error page.

One honest exception. Plaid Link is interactive, so `/link/token/create` and
`/item/public_token/exchange` are synchronous calls made by the API. Two calls,
at link time only, never on a read. State it precisely in the write-up rather
than claiming a clean separation.

### Link flow

1. Frontend asks the API for a link token. API calls `/link/token/create`.
2. User completes Plaid Link and the frontend receives a `public_token`.
3. Frontend posts it to `POST /consents`. The API exchanges it for an
   `access_token`, writes a consent row with `status: processing`, fetches
   accounts and balances, starts the sync workflow, and returns 200 immediately.
4. Everything after is the worker's problem. The frontend refetches and gets
   transactions when they exist.

Accounts and balances arrive almost instantly because banks expose those on
demand. Transactions do not, because Plaid has to pull history from the
institution, which takes seconds to minutes. That gap is real and the UI shows
it.

## packages/provider

The only place `fetch` is allowed. Wraps the Plaid Node SDK and owns
normalisation, so nothing above it ever sees a Plaid-shaped object.

`/transactions/sync` is a diff API. It takes a cursor and returns `added`,
`modified` and `removed`. You are not re-receiving the same window each call, so
identity dedupe is a unique constraint on `providerTransactionId` plus an
upsert.

Plaid returns positive amounts for money leaving the account, the opposite of
what most people assume. Normalise to an unsigned `amount` plus a `direction` of
`in` or `out` at the persistence boundary, once, and no sign bug of that family
can happen.

Booked transactions only. Skip anything with `pending: true` on write. The
reason to write down is not duplication, it is that pending spend is deducted
from the `available` balance but not from `current`, so counting pending outflow
while dividing by the current balance subtracts the same money twice. Pending
amounts also change on settlement, authorisation holds frequently never post at
all, and coverage varies by institution.

Apply `modified` and `removed` regardless. Posted transactions are not
immutable. Refunds and recategorisations arrive as `modified`, and Plaid has
transaction churn where a bank alters a transaction enough that it comes back as
a removal plus a new addition under a different id.

The `SYNC_UPDATES_AVAILABLE` webhook is a doorbell carrying no data. Not
implemented, because receiving it needs a public URL. Polling on the schedule
instead, webhooks named as the production answer.

## The raw layer

Every provider response is written to `raw_provider_payloads` before anything is
parsed. Append only. Every call, every page, every sync, not just the initial
backfill, and including responses where nothing changed. An empty sync still
proves you asked and the bank had nothing, and an unconditional insert is
cheaper to build than a branch.

The pipeline is raw, then normalised, then aggregated, and each stage reads only
the one below it. The read path never queries raw.

Four reasons for the write-up, and the second is the one to lead with in front
of an FCA authorised firm. Replay, so a normalisation bug can be fixed and the
derived tables rebuilt without re-hitting the provider, which matters because
history windows are limited and consent expires. Audit, because a disputed
figure has to be answerable with the exact bytes the bank returned. Schema
drift, because providers change fields without telling you. And ingest that
cannot fail on interpretation, because the fetch succeeds and writes raw while a
parsing error fails a separate activity that retries on its own.

Caveats to state rather than solve. Raw payloads are full of PII, so retention
and encryption at rest are real production concerns, and the table needs monthly
partitioning at any volume.

## apps/worker

`temporal server start-dev` is already running from `make up`. gRPC on 7233, web
UI on 8233. The UI is a demo asset, so it goes in the video.

One workflow per consent, started at link time, id `sync-{consentId}` so a
duplicate start is a no-op rather than a second syncer.

```
syncConsentWorkflow(consentId)
  loop:
    startSyncRun
    loop until has_more is false:
      fetchTransactionsPage      cursor in, raw payload written, page returned
      normaliseAndUpsertPage     upsert added, apply modified, soft delete removed
    persistCursor                only after the full pagination loop completes
    refreshBalances
    detectInternalTransfers
    recomputeStats
    finishSyncRun
    sleep 4 hours
    continueAsNew every 30 iterations
```

Activities are the only place that touch the network or the database. The
workflow function stays deterministic, so no `Date.now()`, no `Math.random()`,
no direct HTTP and no Prisma inside it. Use `workflow.now()` and
`workflow.sleep()`.

Persist the cursor only after the whole pagination loop finishes. A cursor saved
mid-pages, followed by a crash, silently skips transactions and nothing ever
reports it.

Outbound rate limiting to Plaid is `maxActivitiesPerSecond` on the worker rather
than a hand written token bucket. Inbound rate limiting is `@nestjs/throttler`
on the API, tightest on the link route.

Four hourly is six times a day, which roughly matches how often Plaid checks
most institutions itself. Polling harder gains nothing, and the on-demand path
is `/transactions/refresh`, a paid add-on. Worth a line in the write-up.

## Stats

Computed by the workflow, written to `stats_snapshots`, read by the API. The
stats endpoint is a read, never a computation.

**Total balance** is the sum of `currentBalance` across all accounts under all
active consents. Current, not available, to stay on the same accounting basis as
a booked-only ledger.

**Monthly inflow and outflow** are calendar month, Europe/London, so the
"+10% from last month" comparison in the mockup has a previous period to point
at. Internal transfers excluded from both.

**Net burn** is outflow minus inflow over the trailing three calendar months,
averaged. Three rather than one, because a single month is noise.

**Runway** is total balance divided by monthly net burn, rendered as years and
months. **Cash zero** is today plus that. Where burn is zero or negative, render
a dash rather than infinity.

The runway curve in the mockup is a forward projection from the current balance
at the current burn rate. It is not a plot of historical balances and there is
no balance history table. Say so in the walkthrough, it is a modelling choice
rather than a shortcut.

**Internal transfers.** Same absolute amount, opposite direction, within three
days, across two accounts belonging to the same user. Flag both rows and pair
them. Still shown in the transactions table, excluded from inflow, outflow and
runway. A heuristic that will produce false positives on coincidental equal
amounts. Say so.

## apps/api

```
POST /link-tokens              create a Plaid link token
POST /consents                 exchange public_token, store, start workflow, 200
GET  /consents                 connection list with status and lastSyncedAt
GET  /accounts                 accounts with balances, grouped by consent
GET  /transactions             ?accountId&from&to&counterparty&cursor&limit
GET  /stats                    balances, monthly in and out, runway, cash zero, deltas
```

Transactions is one filtered endpoint rather than nested under an account,
because the mockup's table has Date, Account and To/From filters above a single
combined list.

Controllers parse HTTP, services hold rules, repositories hold Prisma queries.
Reads filter `removedAt: null`.

No authentication, per the brief. One seeded user, hardcoded id.

## apps/web

Next.js App Router. Server components fetch from the API. One client component
for Plaid Link. No client state library, there is nothing to manage beyond
whether the Link modal is open.

Three states, driven off consent `status` and `lastSyncedAt`.

**Syncing.** Balance cards populated, skeleton rows in the transactions table, a
line saying transactions are still being fetched. This is the state right after
linking and it is what makes the async architecture visible.

**Ready.** Everything rendered.

**Stale.** Last run failed or is old. A "synced 4 hours ago" line under the
header.

Layout follows the mockup. Balance cards per account across the top, three stat
cards below, transactions table at the bottom. Do not spend time on pixel
fidelity, the brief explicitly says not to.

## Seeding

`make seed` creates the user and a sandbox consent using a custom sandbox user
JSON passed as `override_username: user_custom` to
`/sandbox/public_token/create`.

Default Plaid sandbox data is US retail spending, so a burn rate computed from
it comes out coffee-shop-sized and the runway figure will not survive being
looked at. The seed needs a business shape. Salary out monthly, three or four
recurring suppliers, revenue coming in, and one transfer between two of the
linked accounts so the internal transfer exclusion has something to catch. GBP
throughout.

`user_transactions_dynamic` plus `/sandbox/transactions/create` injects new
transactions and fires webhooks, so the video can show the sync picking up
something new rather than pointing at a static table. Wire it into `make sync`.

## Four hour budget

```
0:00  0:45   provider package and the link flow end to end, accounts stored
0:45  1:45   worker: workflow, activities, raw storage, transaction upsert,
             schedule running
1:45  2:15   stats computation and snapshot
2:15  3:15   dashboard
3:15  4:00   ASSUMPTIONS.md, THREATS.md, the build-it-right write-up
```

The last forty-five minutes are not slack. The write-up is the only deliverable
that shows judgement rather than throughput, and the brief asks for lots of
specific ideas on how you would build it for real. Protect that block.

### Cut order when overrunning

Cut from the top, in order, and note each cut in `ASSUMPTIONS.md`.

1. `sync_runs` writes
2. `stats_snapshots`, compute on read instead
3. internal transfer detection, becomes an assumption only
4. the runway curve, becomes a single number
5. the stale indicator

Never cut the Temporal workflow, the raw payload layer, or the documentation
block. Those three are the whole point.

## ASSUMPTIONS.md

- Authentication skipped, per the brief. One seeded user, hardcoded id.
- Booked transactions only, for the accounting basis reason above.
- GBP only. Sandbox institutions are US-flavoured, so currency is asserted
  rather than converted. No FX.
- No joint accounts, no credit cards.
- Institution agnostic. Whatever the provider returns is stored generically,
  with no per-bank logic. In production, field coverage varies by bank, merchant
  names and category quality especially, and real systems need per-institution
  capability handling.
- Consent expiry and reauthorisation not implemented. UK AIS consent needs
  reconfirming roughly every 90 days. The `status` column exists for it and the
  production path is an `ITEM_LOGIN_REQUIRED` state plus an update-mode relink.
- Webhooks not implemented, polling instead, because receiving them needs a
  public URL.
- Internal transfer detection is a heuristic and will produce false positives.
- The runway curve is a projection, not balance history.

## THREATS.md

The brief explicitly asks what can go wrong and how the solution could be
exploited.

Access tokens in plaintext in Postgres. No authentication, so the API is fully
enumerable by user id. No rate limiting on the link route without the throttler,
which burns the Plaid quota. Raw payloads full of PII with no retention policy.
PII in logs. Plaid webhook signature verification absent, were webhooks added.
An unbounded `GET /transactions` as a cheap denial of service. Internal transfer
detection as a way to hide outflow from the stats by structuring payments to
match.

## The build-it-right write-up

Token encryption with a KMS. Consent lifecycle and reauthorisation. Per
institution capability handling. Balance history as its own table so the runway
curve plots real data. Transfer matching that is not a heuristic. Webhook
ingestion with signature verification and idempotency keys. Partitioning
`raw_provider_payloads` by month with a retention policy. A provider
abstraction so Plaid is not the only option. Backfill and replay as a first
class operation rather than a script.

## Stretch

- Pending transactions shown greyed out in the table, excluded from every stat.
- `make replay`, rebuilding normalised tables from `raw_provider_payloads`.
- Balance history table so the runway curve plots real data.

## Finishing

`make check` before each push. Commits read as a sentence about the product,
lower case after the type. Push to `origin main` as you go rather than once at
the end.
