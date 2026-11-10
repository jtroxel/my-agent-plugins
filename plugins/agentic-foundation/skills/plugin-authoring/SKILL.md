---
name: plugin-authoring
description: Create, validate, or evolve Agent Plugins and Agent Skills. Use when packaging reusable agent capabilities, writing plugin manifests, or deciding what must remain client-specific.
license: MIT
compatibility: Requires a filesystem and Node.js only when running validation or install commands.
metadata:
  version: "0.1.0"
---

# Agent plugin authoring

Create portable capabilities first:

1. Put each Agent Skill in `skills/<skill-name>/SKILL.md`.
2. Keep the frontmatter `name` identical to its directory name. Use lowercase letters, numbers, and hyphens only.
3. Put plugin metadata in `plugin.json`; do not put component paths in the manifest.
4. Put MCP server definitions in root `mcp.json` when applicable.
5. Keep client-only features under their reverse-domain namespace, such as `com.github.copilot/`.

Use native scaffolding only for functionality that is not portable under Agent Plugins:

- Claude Code: agent profiles, hooks, commands, and Claude-only plugin configuration.
- Cursor Agent: agent profiles, commands, rules, and hooks.
- Copilot CLI: custom agents, prompts, hooks, and Copilot-only configuration.

Do not copy a portable skill into client-specific skill directories. Install it once under `.agents/skills/` so compatible clients discover the same source of truth.

Before publishing, validate every JSON file and ensure every skill directory contains a valid `SKILL.md`.
