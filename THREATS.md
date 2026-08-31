# Threats

What can go wrong, and how this could be exploited. The brief asks the question
directly, so the answers are specific rather than a checklist.

Everything below is a real property of the code in this repository. Nothing here
is hypothetical.

## Credentials and data at rest

**Access tokens are in plaintext in Postgres.** `access_consents.accessToken`
holds a long-lived Plaid token that reads a customer's full transaction history.
Anyone with a read on that table, a stolen backup, a snapshot restored into a
staging environment, or a `SELECT` through an unrelated SQL injection, gets
permanent read access to the customer's bank data without touching the bank.
Rotating it requires the customer to relink.

The fix is envelope encryption with a KMS: the column stores ciphertext, the
data key never leaves the KMS, and decryption is an audited call from the worker
alone. Access tokens should also never be logged, never be returned by an API,
and never appear in an error message.

**Raw payloads are full of PII with no retention policy.**
`raw_provider_payloads.responseBody` contains names, account numbers, masks,
merchant detail and a complete spending profile, stored verbatim and for ever.
It is the single most valuable table in the database and the least protected.
Production needs encryption at rest, monthly partitioning, a retention window
measured against the legal basis for holding it, and a documented deletion path
for a subject access or erasure request.

**Database credentials are in `.env` and the compose file uses `coffer/coffer`.**
Fine locally, fatal anywhere else.

## Authorisation

**There is no authentication, so the API is fully enumerable.** Every endpoint
reads a hardcoded user id. The moment a second user exists, `GET /transactions`
returns whichever user the server was configured with, and any client that can
reach port 3001 can read all of it. There is no ownership check anywhere in the
read path because there is nothing to check against.

The fix is not only a session. It is that every repository query is scoped by
the authenticated user id, and that scoping is asserted in tests rather than
remembered. An id in a URL is an IDOR waiting to happen.

**CORS is fully open.** `app.enableCors()` with no origin list, so any page on
the internet can read the API from a victim's browser once authentication
exists and rides on a cookie.

## Abuse of the provider relationship

**The link route burns the Plaid quota if it is not throttled.**
`POST /link-tokens` and `POST /consents` each cost a real Plaid call.
Unthrottled, a script can exhaust the quota, which takes the product down for
every real customer and costs money. `@nestjs/throttler` caps both at five
requests a minute, which is the mitigation, not a solution: the limit is per IP
and per process, so it does not survive multiple instances or a distributed
caller. Production wants a shared store behind the throttler and a per-user
budget rather than a per-IP one.

**A `public_token` posted to `POST /consents` is exchanged without any check
that the caller obtained it.** With no authentication, an attacker who obtains a
public token by any means can attach that bank connection to the single seeded
user and see its data through the dashboard. Real systems bind the link session
to the authenticated user who requested the link token.

## Denial of service

GET /transactions pages by offset, and deep offsets get slower. limit is capped at 200 and validated as an integer, so ?limit=1000000 does nothing. offset is not bounded the same way, and Prisma's skip compiles to a SQL OFFSET, which makes the database walk and discard every preceding row. On a transactions table that grows without bound, ?offset=5000000 is a slow query an attacker can issue cheaply and repeatedly. Offset was chosen deliberately, because the table shows "Showing 26 to 50 of 96" and a Previous link, and a cursor can answer neither. Production would keep the visible count as a separate cached or estimated query and page the rows by keyset.

**The workflow retries a failing bank forever.** A sync run that fails is caught,
recorded and retried on the next tick rather than killing the workflow. That is
the right behaviour for a poller, but it means a permanently broken consent
generates provider calls indefinitely. Production needs a circuit breaker that
moves the consent to `reauth_required` after N consecutive failures and stops
calling.

## Integrity of the numbers

**Internal transfer detection can be used to hide outflow.** The rule is: same
absolute amount, opposite direction, within three days, two accounts under one
user. Anyone who wants their outflow to look smaller can structure payments to
match a same-amount inbound movement within the window and both legs vanish from
inflow, outflow, net burn and runway. If these figures ever fed a lending or
affordability decision, that is the attack, and it is cheap.

The defence is not a better heuristic. It is using the provider's own transfer
signals, matching on counterparty account identity rather than amount, and
treating any amount-based match as a suggestion a human confirms.

**The sync cursor is the integrity boundary.** It is persisted only after a full
pagination loop completes. A bug that moved it earlier would silently skip
transactions with no error, no retry and no signal anywhere that the balances
had drifted. Worth naming as a threat because it is the failure mode with no
alarm attached.

## Things that would become threats

**Webhook signature verification is absent, because webhooks are not
implemented.** The moment a `SYNC_UPDATES_AVAILABLE` endpoint exists, an
unverified one lets anyone trigger unbounded provider calls by posting to it.
Plaid signs webhooks with a JWT whose key comes from
`/webhook_verification_key/get`, and the handler needs to verify it, check the
timestamp, and be idempotent on the webhook id.

**PII in logs.** Nothing currently logs a transaction or a token, but nothing
stops it either. The provider package handles the only objects that carry PII,
and a stray `console.log` during debugging would put a customer's spending into
the log aggregator. Production wants a redacting logger and a lint rule.
