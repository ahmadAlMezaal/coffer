# How this was built

The brief asks for the back and forth with the coding agent, so this directory
holds the whole record rather than a summary of it. Everything in Coffer was
written with Claude Code against the two prompt files below.

## What is in here

| File                     | What it is                                          |
| ------------------------ | --------------------------------------------------- |
| `00-bootstrap-prompt.md` | The first prompt. Repository, workspace, schema      |
| `01-build-prompt.md`     | The second prompt. Provider, worker, API, dashboard  |
| `01-bootstrap-session.md`| The bootstrap session, exported with `/export`       |
| `02-build-session.md`    | The build session, exported with `/export`           |

The two prompt files were written before any code existed, in a separate
planning conversation. They are the design document as much as the instruction,
which is why they carry the reasoning rather than just the requirements.

## Why it was split in two

The bootstrap prompt stops deliberately at a schema that has not been migrated.
Two failures in this build are environment dependent and cannot be caught by
reasoning about the code. The Prisma build ordering shows up as a type error in
the API that looks like a schema mistake, and a worker that cannot reach
Temporal looks like a configuration problem. Landing both inside one long run
would have tangled them with half written application code.

So the migration was reviewed by hand, the generated SQL was read, and only then
did the second prompt run.

## Where the agent was overridden

This is the part worth reading. Everything below is a place where the first
output was wrong, or right for the wrong reason, and was changed.

**[Placeholder]** What the agent produced, what was wrong with it, and what
replaced it.

**[Placeholder]** As above.

**[Placeholder]** As above.

## Where the agent was right and the plan was wrong

**[Placeholder]** Anywhere the prompt specified something and the implementation
turned out to need something different.

## What was not delegated

The prompt files themselves, the assumptions, the threat model and the schema
argument in `SCHEMA.md`. The agent wrote the code and most of the prose, but the
decisions about what to build, what to cut and what to be honest about were made
before it started.