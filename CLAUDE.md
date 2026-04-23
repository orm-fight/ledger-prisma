# Working context for Claude

See [README.md](README.md) for the scenario, the rules, how to run, and the sibling-repo plan. The notes below are what README deliberately doesn't cover: intent, conventions, and workflow.

## Intent

This repo is **intentionally minimal**. Core double-entry only — no GoB compliance, no audit log, no period locking, no reversal, no immutability triggers, no gap-free sequence, no VAT, no multi-currency.

A GoB-compliant superset of the same domain lives under `~/Git/ts-orm-research/`. The two codebases share no code and serve different audiences:

| | `~/Git/ledger-prisma/` (here) | `~/Git/ts-orm-research/` |
|---|---|---|
| Audience | Colleagues new to accounting | Colleagues evaluating GoB-compliant designs |
| Scope | Wikipedia Transaction Example | German GoB / GoBD requirements |
| Features | `postEntry`, `getBalance`, `trialBalance` | + audit log, periods, reversal, immutability, SKR03 |

If the user asks for audit logs, period rules, reversal, or SKR03 *in this repo*, confirm first — those belong in `ts-orm-research`, not here.

## Conventions

- **Account identifiers are English names** (`Cash`, `Inventory`, `Liabilities`, `Equity`) — never SKR03 numeric codes. The teaching goal is that the test file reads as narrative; numeric codes defeat that. SKR03 belongs in the compliance repo.
- **Amounts are integer dollars** (`10000` = $10,000), not minor units. A production ledger should use minor units (cents); this repo trades realism for readability. Don't change this without asking.
- **Repo series** follows the `ledger-<library>` convention: this is `ledger-prisma`; siblings are `ledger-sqlite3`, `ledger-better-sqlite3`, `ledger-node-sqlite` (hyphen, not colon).

## Schema lives in two places — on purpose

`prisma/schema.prisma` is the idiomatic source of truth for the Prisma client. But Prisma has no built-in "apply schema to this connection" call, so `src/db.js` holds the equivalent schema as raw `CREATE TABLE` statements that `init(db)` applies via `$executeRawUnsafe`.

When you change one, change the other. The two files are intentionally kept side-by-side rather than generated from one another — the table/column names are hand-written to match (`accounts`, `journal_entries`, `account_debit`, `account_credit`), and the mini size of the schema (two tables) makes manual sync trivial. Running `prisma migrate` to generate SQL was considered and rejected: it would pull migration files, `.env` handling, and a generate/deploy workflow into a repo whose whole point is readability.

## Why not in-memory SQLite?

Prisma's default SQLite driver doesn't honor SQLite's URI syntax — `file::memory:`, `?mode=memory`, `?cache=shared` all fall through as literal filenames. The two clean paths to true in-memory are (a) `@prisma/adapter-better-sqlite3` (adds a dependency that collides with the planned `ledger-better-sqlite3` sibling) or (b) `/dev/shm/` (Linux-only). Instead, `test/fixtures.js` writes each scratch DB into `os.tmpdir()` and deletes the directory on teardown. Cross-platform, zero extra deps, no artefacts in the project directory.

## Workflow

- Host: company GitLab at `gitlab.maibornwolff.de`, group `guild-wtb`. Clone URL is wired as `origin`.
- The user will transfer ownership to their superior via *Settings → Members* once initial state is pushed. Don't treat the user as the long-term sole owner.
- Migration to GitHub is planned for "when the project is ready for a broader audience" — not yet. Don't prematurely add GitHub-specific files (issue templates, `.github/workflows/`).
- Never push on the user's behalf unless they ask. Creating local commits is fine.
- `prisma generate` runs automatically as a `postinstall` npm script — no manual step needed after `npm install`.
