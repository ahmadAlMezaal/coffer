# Assumptions

Every shortcut taken, written down. The brief caps this at roughly four hours
and asks which shortcuts got taken, so this file is a deliverable rather than an
apology.

## Scope

**Authentication skipped, per the brief.** One seeded user with a hardcoded id,
`COFFER_USER_ID`. Every endpoint reads that id rather than a session. There is
no login, no session, no ownership check.

**Booked transactions only.** Anything with `pending: true` is skipped on write.
The reason is not duplication, it is the accounting basis. Pending spend is
deducted from the `available` balance but not from `current`, so counting
pending outflow while dividing by the current balance subtracts the same money
twice. Pending amounts also change on settlement, authorisation holds frequently
never post at all, and coverage varies by institution. `modified` and `removed`
are still applied regardless of pending state, because they refer to rows that
already exist.

**GBP only.** Sandbox institutions are US flavoured, so the seed asserts GBP on
the sandbox accounts rather than converting. There is no FX and no
multi-currency total. A real deployment needs a base currency, a rate source
and a rate valid at the transaction date, not today's.

**Disconnecting a bank has not been exercised against Plaid.** The path
terminates the sync workflow, calls `/item/remove` and revokes the consent, and
it typechecks and is wired through the UI, but running it would have unlinked
the seeded sandbox data the demo depends on. It is the one code path here that
ships untested.

**No joint accounts and no credit cards.** Every account is treated as a
depository balance the user owns outright.

**Institution agnostic.** Whatever the provider returns is stored generically,
with no per-bank logic. In production, field coverage varies by bank, merchant
names and category quality especially, and real systems need per-institution
capability handling.

**Consent expiry and reauthorisation not implemented.** UK AIS consent needs
reconfirming roughly every 90 days. The `status` column and its
`reauth_required` value exist for it, and `expiresAt` is on the table, but
nothing writes them. The production path is an `ITEM_LOGIN_REQUIRED` error state
plus an update-mode relink.

**Webhooks not implemented.** `SYNC_UPDATES_AVAILABLE` is a doorbell carrying no
data, and receiving it needs a public URL. The workflow polls every four hours
instead. Webhooks are the production answer, with signature verification and an
idempotency key.

## Numbers

**Internal transfer detection is a heuristic.** Same absolute amount, opposite
direction, within three days, across two accounts belonging to the same user.
It will produce false positives on coincidental equal amounts, and it will miss
a transfer where the two legs post with different amounts because of a fee. Both
legs stay in the transactions table and are excluded from inflow, outflow and
runway.

**Net burn averages over the trailing months that have history**, not blindly
over three. The window is the three complete calendar months before this one,
but a month with no transactions at all is dropped from the average rather than
counted as a zero-burn month. Counting it would halve the burn of a business
that has only two months of linked history and roughly double its runway. Where
none of the three has any history, the current month is used.

**The runway curve is a projection, not balance history.** It is a straight line
from the current balance at the current burn rate. There is no balance history
table, so there is nothing to plot. This is a modelling choice rather than an
oversight, and the chart says so on its face.

**Monthly figures are calendar month, Europe/London.** Transaction dates are
stored as dates rather than timestamps, so the London and UTC month boundaries
coincide.

**`stats_snapshots` accumulates a row per sync** rather than one row per period
upserted in place. The API reads the newest snapshot per period. It leaves a
computation trail, at the cost of rows that nothing prunes.

## The sandbox

**The Plaid sandbox caps custom-user history at about 90 days.** `days_requested`
is set to 730 both on the link token and on `/transactions/sync`, and the
sandbox still returns roughly three months. So the seeded business has three
months of history rather than the six the fixture describes, and the trailing
burn window has two complete months in it rather than three.

**Two seed modes, because Plaid will not give both at once.**

- `make seed` uses a custom sandbox user, which gives a business shaped ledger:
  payroll, HMRC, rent, AWS, three recurring client invoices, and one £25,000
  transfer between the two accounts so the internal transfer exclusion has
  something to catch. Its transaction set is fixed, so
  `/sandbox/transactions/create` does nothing to it.
- `make seed-dynamic` uses `user_transactions_dynamic`, which accepts injected
  transactions, so `make sync-new` can show a sync picking something up live.
  Its data is Plaid's default US retail spending, so the burn rate comes out
  coffee-shop sized and the runway figure will not survive being looked at.

Default sandbox data was not usable for the stats, which is why the custom user
is the default.

## Operational

**A sync run that fails after its activity retries are exhausted waits four
hours before trying again.** Activities retry five times with exponential
backoff first, so this only bites on a sustained outage. A production version
would back off on a curve rather than a fixed interval.

**A run that finds the bank still backfilling polls every twenty seconds**
rather than waiting the full four hours, until `transactions_update_status`
reports the historical update complete. Without this a freshly linked account
shows no transactions for four hours and looks broken.

**Access tokens are stored in plaintext.** See [THREATS.md](THREATS.md).

**Raw payloads have no retention policy and are not partitioned.** They are full
of PII. At any real volume the table needs monthly partitioning and a retention
window.

## Scope

The cut order in the plan was `sync_runs` writes, then `stats_snapshots`, then
internal transfer detection, then the runway curve, then the stale indicator.
None of it was needed. All five are in.

Several things also went beyond what the brief asked for, deliberately rather
than by drift. A collapsing drawer and a separate Accounts page, because
managing a connection and reading its data are different jobs and the mockup
only covers the second. Six months of spend and income as clickable bars,
because a single monthly total invites the question of whether it is typical.
Bank logos and category chips, because a table of twelve identical grey rows is
harder to read than the mockup suggests. Pagination and a category filter,
because the seeded ledger was long enough to need both. Disconnect, because a
consent that can be granted and never revoked is not a consent.

None of it is load bearing for the features the brief lists, and all of it came
after those were working.
