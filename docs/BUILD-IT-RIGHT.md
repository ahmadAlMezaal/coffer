# Building it for real

What this repository would need to become something an authorised firm could
run. Ordered by what I would do first, not by how interesting it is.

## 1. Encrypt the access tokens

The single highest-value change. `access_consents.accessToken` is a long-lived
credential to a customer's bank, stored in plaintext next to their transaction
history.

Envelope encryption with a KMS. The column holds ciphertext plus the encrypted
data key and a key version. Decryption happens in the worker, which is already
the only process that needs the token, and every decrypt is an audited KMS call
so there is a log of when a customer's bank credential was used and by what.
Key rotation becomes a re-encrypt job rather than a mass relink.

The same treatment applies to `raw_provider_payloads.responseBody`, or at least
to a column-level encrypted subset of it.

## 2. Consent lifecycle and reauthorisation

UK AIS consent needs reconfirming roughly every 90 days, and connections break
for other reasons: a password change, MFA, the bank revoking the token.

The columns exist. What is missing is the machine that drives them. Plaid
reports this as `ITEM_LOGIN_REQUIRED` on any call, and the item webhook fires
`PENDING_EXPIRATION` ahead of a scheduled expiry. So:

- Any activity that gets `ITEM_LOGIN_REQUIRED` moves the consent to
  `reauth_required` and the workflow stops calling rather than retrying into a
  wall.
- `expiresAt` is populated at link time and a scheduled workflow warns the
  customer before it lands.
- Link in update mode re-authorises the existing item rather than creating a
  duplicate connection, so the item id, the accounts and their history survive.
- The dashboard shows a per-connection reconnect prompt rather than silently
  going stale.

This is the difference between a demo and something a customer keeps using past
day 90.

## 3. Webhooks instead of polling

`SYNC_UPDATES_AVAILABLE` is a doorbell carrying no data. Receiving it needs a
public URL, which is why it is not here.

The production shape is a webhook endpoint that verifies the Plaid JWT against
the key from `/webhook_verification_key/get`, rejects anything with a stale
timestamp, and then does nothing except signal the existing Temporal workflow.
The workflow already has a `syncNow` signal, so this is genuinely a small
change. The handler must be idempotent on the webhook id, because Plaid will
resend.

Keep the four-hourly poll as a floor. Webhooks get missed, and a poll that finds
nothing is cheap.

## 4. Balance history as its own table

The runway curve currently projects a straight line from today's balance. It is
honest about that, but it is not what anyone actually wants to see.

A `balance_snapshots` table written on every sync, one row per account per run,
turns the chart into real history with the projection appended to its right
edge. It also makes reconciliation possible: a balance that moved without a
matching transaction is a signal worth alerting on, and there is no way to
detect it without history.

Cheap to add, and it changes the product more than its cost suggests.

## 5. Transfer matching that is not a heuristic

Matching on equal amounts in opposite directions within three days is
structurally exploitable, as [THREATS.md](../THREATS.md) sets out.

The real version uses counterparty account identity. Plaid exposes
`counterparties` and, for accounts the user has linked, the account and routing
numbers through `/auth`. A transfer between two accounts the same user has
linked is identifiable rather than inferable. Where identity is unavailable,
fall back to the amount heuristic but mark the match as low confidence, exclude
it from the headline stats only when confidence is high, and let the user
confirm or reject a pairing in the UI. A confirmed pairing is training data for
better matching later.

## 6. Per-institution capability handling

Everything here is institution agnostic, which is fine until it is not. Field
coverage varies enormously between banks: merchant names, categories, balance
freshness, whether `available` is populated at all, how long history goes back.

Production needs a capability table per institution, populated from
`/institutions/get` plus observed behaviour, and code paths that degrade
explicitly rather than rendering a blank. "This bank does not provide merchant
names" is a better answer than an empty column.

## 7. Partition and retain the raw layer

`raw_provider_payloads` grows without bound and is the most sensitive table in
the database.

Monthly partitions by `receivedAt`, so detaching an old partition is the
retention job. A retention window set against the legal basis for holding the
data, not against what is convenient. Encryption at rest, and a documented path
for a subject access or erasure request that can find every payload touching one
customer, which the `accessConsentId` index already supports.

## 8. A provider abstraction

`packages/provider` is the only place that knows Plaid exists, which is enforced
by ESLint rather than convention. That is the hard part already done, but the
interface it exposes is still Plaid shaped in places: the cursor is Plaid's
cursor, and `transactions_update_status` is a Plaid concept.

A second provider, TrueLayer or Yapily for a UK-first product, would force the
interface to become genuinely neutral: a provider is a thing that returns
accounts, returns a page of transaction changes against an opaque cursor, and
reports whether its backfill is finished. Everything above that layer already
consumes only normalised types, so the blast radius is one package.

## 9. Backfill and replay as a first class operation

`make replay` is a script. It rebuilds the normalised tables from
`raw_provider_payloads` and it works, but it runs to completion or it does not,
it is not observable, and it cannot be run for one consent while the rest of the
system carries on.

The production version is a Temporal workflow: replay one consent, one payload
at a time, resumable, with a dry-run mode that reports what would change before
anything is written. That turns "we found a normalisation bug three months ago"
from an incident into a scheduled job.

## 10. The operational layer this has none of

Named honestly rather than pretended at.

- **Observability.** Structured logs with a redacting serialiser, traces that
  span the API, Temporal and Plaid, and metrics on sync duration, page counts,
  provider error rates and the age of the oldest unsynced consent.
- **Alerting on silence.** The dangerous failure here is not an error, it is a
  consent that quietly stops syncing. Alert on staleness, not on exceptions.
- **A shared throttle store.** The current rate limiter is per process.
- **Idempotency keys on writes**, so a retried `POST /consents` cannot create a
  second connection.
- **Migrations gated in CI**, and a plan for the ones that need a backfill.
- **Integration tests against Plaid sandbox in CI**, which is exactly what the
  sandbox is for and would have caught the three seed-data bugs in this build
  before they reached a demo.
