# Agent roles

Each file is a self-contained brief for one role. Phases and tasks are defined in `../PLAN.md`; the rules every agent follows are in `../../AGENTS.md`.

| Order | File | Phase |
| --- | --- | --- |
| 1 | `06-qa-release-engineer.md` | 0, then 3 |
| 2 | `01-product-manager.md` | Before 1, then 3 |
| 3 | `02-brand-designer.md`, `04-export-engineer.md`, `03-ux-designer.md` | 1 (parallel) |
| 4 | `05-mobile-engineer.md` | 2 |
| 5 | `03-ux-designer.md` (U-3), `06-qa-release-engineer.md`, `01-product-manager.md` | 3 |

## Running them

The briefs are plain Markdown prompts, so they work with whatever way your Codex version starts a sub-agent (paste the file, or point the agent at it). Check the current Codex docs for the exact mechanism; this repo does not depend on it.

Suggested starter prompt for any role:

> You are the role described in `docs/agents/<file>`. Read `AGENTS.md`, `docs/PLAN.md` and your brief. Do only the tasks assigned to your role, stay within the files your role owns, and finish with the report format your brief specifies.

Run one phase at a time. Merge a phase before starting the next, and review each report before merging.
