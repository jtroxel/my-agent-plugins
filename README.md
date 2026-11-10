# Agentic Plugins

This repository is a source marketplace for [Agent Plugins](https://agent-plugins.org) and [Agent Skills](https://agentskills.io).

`plugins/agentic-foundation` is a valid Agent Plugin: its portable skills live in
`skills/<name>/SKILL.md` and its Copilot-only extension lives in the
`com.github.copilot/` namespace. Add plugins as sibling directories and register
them in `marketplace.json`.

## Install

For regular skill consumers, use the ecosystem CLI:

```sh
# Replace OWNER/REPO after publishing this repository.
npx skills add https://github.com/OWNER/REPO/tree/main/plugins/agentic-foundation --all
npx skills update
```

For a checked-out local source, the repository CLI installs portable skills once
under `.agents/skills` and adds only nonportable native profiles:

```sh
npx --package=@johntroxel/agentic-plugins agentic-plugins install /path/to/my-agent-plugins \
  --target /path/to/project \
  --agents claude-code,cursor-agent,copilot
```

The default is symlinks, suitable for local development: edits in this repository
take effect immediately. Pass `--copy` to snapshot files instead:

```sh
npx agentic-plugins install /path/to/my-agent-plugins --target . --copy
npx agentic-plugins update --target .
```

The installer records its source and mode in `.agents/.agentic-plugins.json`, so
`update` is deterministic. It refuses to overwrite files it did not create.

## Compatibility policy

| Capability | Install location |
| --- | --- |
| Agent Skills | `.agents/skills/<skill>/` only |
| Claude Code-specific agent profiles | `.claude/agents/` |
| Cursor-specific agent profiles | `.cursor/agents/` |
| Copilot CLI-specific agent profiles | `.github/agents/` |

Skills are not duplicated in `.claude/skills`, `.cursor/skills`, or
`.github/skills`; all three target agents support the portable Agent Skills
format. The built-in native `plugin-reviewer` profile is deliberately separate
because custom-agent configuration is not part of the Agent Plugins standard.

## Repository scripts

```sh
npm test                 # installer smoke tests
npm run install:link     # local symlink install into this checkout
npm run install:local    # copied install into this checkout
npm run update:local     # update the recorded local installation
npm run skills:add       # Vercel Skills CLI install flow
npm run skills:update    # Vercel Skills CLI update flow
```
