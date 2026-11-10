---
name: agents-working
description: Routes interim agent artifacts (session summaries, draft reports, scratch notes) to the workspace agents-working directory via $AGENTS_WORKING. Use when writing in-process documents, session summaries, investigation notes, or reports that should not live in Projects/ subject repos or workspace shell tracked files.
---

# Agents Working Directory

## Purpose

Agent workspaces separate **subject projects** (`Projects/`) from **interim work**. Subject repos hold durable code and project deliverables. The agent working directory holds disposable or in-process artifacts that do not belong in git-tracked project trees.

## Location

| Item | Value |
|------|-------|
| Default path | `agents-working/` at workspace root |
| Shell env var | `$AGENTS_WORKING` (absolute path) |
| Setup | `agentws init` creates it by default; `agentws add --working` adds it to existing workspaces |

Resolve the path in order:

1. `$AGENTS_WORKING` if set
2. `agents-working/` relative to workspace root (the folder named `workspace` in the code-workspace file)

## What belongs here

Write these to `$AGENTS_WORKING` (or `agents-working/`):

- Session summaries and handoff notes
- Draft reports and option analyses not yet ready for a project repo
- Investigation scratch pads (log excerpts, query results, timelines)
- Temporary exports, CSVs, or canvases used only during a session
- Multi-step plans the user has not asked to commit

## What does NOT belong here

- Source code, tests, or config for a subject project → `Projects/<name>/`
- Workspace shell files (`.code-workspace`, rules, settings) → workspace root
- Files the user explicitly asked to add to a project repo

## Directory layout

Use subdirectories by purpose:

```text
agents-working/
├── sessions/       # session summaries, handoff notes
├── reports/        # draft analyses, status writeups
├── investigations/ # debugging notes, evidence bundles
└── scratch/        # ephemeral exports, one-off outputs
```

Create subdirs as needed. Prefer dated filenames: `sessions/2026-08-05-spark-oom.md`.

## Agent instructions

When producing interim artifacts:

1. Check `$AGENTS_WORKING`; if unset, use `agents-working/` at workspace root.
2. Pick the appropriate subdirectory (`sessions/`, `reports/`, etc.).
3. Do not write interim docs into `Projects/` unless the user explicitly requests a project-path location.
4. When summarizing a session for the user, offer to save the summary under `agents-working/sessions/`.
5. Treat contents as gitignored and ephemeral unless the user asks to promote a file into a project.

## Shell usage

Terminals in Cursor/VS Code receive `$AGENTS_WORKING` automatically when the workspace was created with `agentws init` (or after `agentws add --working`).

```bash
# Write a session note
echo "# Session summary" > "$AGENTS_WORKING/sessions/$(date +%F)-topic.md"

# Or relative path from workspace root
mkdir -p agents-working/scratch
```

## agentws commands

```bash
# New workspace — creates agents-working/ by default
agentws init my-workspace

# Custom working dir name
agentws init my-workspace --working scratch

# Skip working dir
agentws init my-workspace --no-working

# Add working dir to existing workspace
agentws add --working
```
