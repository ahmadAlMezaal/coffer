# How this was built

The brief asks for the back and forth with the coding agent, so this directory
holds the whole record rather than a summary of it. Coffer was written with
Claude Code across three sessions.

## What is in here

| File                      | What it is                                          |
| ------------------------- | --------------------------------------------------- |
| `00-bootstrap-prompt.md`  | The first prompt. Repository, workspace, schema      |
| `01-bootstrap-session.md` | The bootstrap session, exported with `/export`       |
| `01-build-prompt.md`      | The second prompt. Provider, worker, API, dashboard  |
| `02-build-session.md`     | The build session                                    |
| `03-feedback-session.md`  | Two rounds of design and product review              |

The first two sessions ran against written prompts. The third did not: it was
interactive review, driven by screenshots and a list of things that were wrong
with the running app, which is a different and equally real way of working with
an agent.

The prompt files were written before any code existed, in a separate planning
conversation. They are the design document as much as the instruction, which is
why they carry the reasoning rather than just the requirements.

## Why it was split

The bootstrap prompt stops deliberately at a schema that has not been migrated.
Two failures in this build are environment dependent and cannot be caught by
reasoning about the code: Prisma's build ordering shows up as a type error in
the API that looks like a schema mistake, and a worker that cannot reach
Temporal looks like a configuration problem. Landing both inside one long run
would have tangled them with half written application code.

So the migration was reviewed by hand, the generated SQL was read, and only then
did the second prompt run.

## Where the plan was wrong and the agent was right

This is the more interesting direction, and it happened more often than the
reverse.

**Prisma 7 no longer accepts `url = env("DATABASE_URL")` in the datasource
block.** The prompt specified it. Prisma rejects it with P1012. Rather than
working around the error, the agent looked up the current shape, found that the
URL now lives in `prisma.config.ts` and that a direct Postgres connection
requires a driver adapter, and restructured the database package accordingly.
The schema models are otherwise byte for byte what the prompt specified.

**`packages/provider` needed a built `dist` too.** The prompt named
`packages/database` as the only package with a build step. That was wrong, and
for a reason the prompt itself explains: `apps/api` runs on swc, which compiles
only its own sources, and the API imports the provider for the two link-time
Plaid calls. The agent caught the contradiction and fixed it.

**"Sleep 4 hours" was wrong for a freshly linked bank.** A new item returns
`NOT_READY` with zero transactions while Plaid backfills, so the workflow as
specified would have slept four hours and shown an empty table. It now polls
every twenty seconds until Plaid reports the historical update complete. This
was found by running it, not by reading it.

**Latest versions were declined deliberately.** `typescript-eslint@8` caps
TypeScript below 6.1 and `eslint-plugin-react@7.37` caps ESLint at 9, so the
repository pins TypeScript 5.9.3 and ESLint 9.39.5 rather than the newest of
each, and says why.

**Two seed modes, because Plaid will not give both at once.** The prompt assumed
a custom sandbox user could carry business-shaped data and accept injected
transactions. It cannot: `/sandbox/transactions/create` does not reach a
`user_custom` item, and the sandbox caps custom-user history at roughly 90 days
regardless of `days_requested`. Both modes are now wired, and the trade-off is
in `ASSUMPTIONS.md` rather than hidden.

## Three bugs the live run found

None of these were visible in the code. All were found by running against Plaid
sandbox and looking at the numbers.

1. **Net burn divided by three even when a trailing month had no history**,
   which halved the burn rate and roughly doubled the runway figure. It now
   averages over the months that actually have history.
2. **The runway curve stopped at 24 months while advertising a cash-zero date 35
   months out.** The chart contradicted the number printed above it.
3. **Dashboard state was partly derived from how many rows came back**, so any
   filter matching nothing rendered as syncing skeletons. State now comes from
   consent status and last sync time alone.

The first two matter because they are the class of bug that a passing test suite
and a clean typecheck do not catch. The numbers were wrong, plausibly wrong, and
on screen.

## Where the agent was overridden

**Playwright artefacts.** It had been taking screenshots to verify the UI, which
was useful, and started to include them in the pull request, which was not. Told
to keep them out.

**The paging change was made unilaterally and accepted after the fact.** It
switched the transactions API from cursor to offset plus total, on the grounds
that a cursor cannot answer "Showing 26 to 50 of 96" or offer a Previous link.
That is correct, it was the right call, and it was still a contract change made
without asking. `THREATS.md` now carries the cost of that decision rather than
only its benefit.

**Scope, twice.** The third session was two rounds of "this is wrong, fix it",
which is the part of the work that could not be specified up front. Charts,
copy that sounds like a product rather than an engineer, a connecting state
prominent enough to notice, and clickable month bars all came from looking at
the thing rather than from planning it.

## What it flagged without being asked

While diagnosing a Node version discrepancy it printed `~/.npmrc` into the
session, noticed that the file contained an npm auth token, and said so
unprompted at the end of the run.

It also found that the month-on-month deltas never resolved, because every stats
snapshot shares one period, and moved them onto a grouped read over
transactions. That was outside the literal ask, and the design depended on it.

And it self-reported the worst moment of its own build: three orphaned workers
left running from earlier attempts, one serving activities with stale code,
which cost real time chasing a phantom. The check for it is now in the
`temporal-workflows` skill.

## What was not delegated

The prompt files, the assumptions, the threat model, and the argument in
`SCHEMA.md` for hanging accounts off the consent rather than the user. The agent
wrote the code and most of the prose. The decisions about what to build, what to
cut, and what to be honest about were made before it started and reviewed after.