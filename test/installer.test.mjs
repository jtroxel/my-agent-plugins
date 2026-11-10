import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { lstat, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const cli = join(root, "bin", "agentic-plugins.mjs");

test("links portable skills once and creates only native profiles", async () => {
  const target = await mkdtemp(join(tmpdir(), "agentic-plugins-"));
  execFileSync(process.execPath, [cli, "install", root, "--target", target, "--agents", "claude-code,cursor-agent,copilot"], { stdio: "pipe" });

  assert.ok((await lstat(join(target, ".agents", "skills", "plugin-authoring"))).isSymbolicLink());
  assert.ok((await lstat(join(target, ".agents", "skills", "agents-working"))).isSymbolicLink());
  assert.ok((await lstat(join(target, ".agents", "skills", "cto-writer"))).isSymbolicLink());
  assert.ok((await lstat(join(target, ".agents", "skills", "git-worktrees"))).isSymbolicLink());
  assert.ok((await lstat(join(target, ".agents", "skills", "gui-automation"))).isSymbolicLink());
  assert.match(await readFile(join(target, ".agents", "skills", "gui-automation", "references", "command-reference.md"), "utf8"), /cua do switch/);
  assert.match(await readFile(join(target, ".claude", "agents", "plugin-reviewer.md"), "utf8"), /Managed by agentic-plugins/);
  assert.match(await readFile(join(target, ".cursor", "agents", "plugin-reviewer.md"), "utf8"), /readonly: true/);
  assert.match(await readFile(join(target, ".github", "agents", "plugin-reviewer.agent.md"), "utf8"), /tools:/);
});

test("update reuses the recorded source and install mode", async () => {
  const target = await mkdtemp(join(tmpdir(), "agentic-plugins-"));
  execFileSync(process.execPath, [cli, "install", root, "--target", target, "--copy"], { stdio: "pipe" });
  execFileSync(process.execPath, [cli, "update", "--target", target], { stdio: "pipe" });

  assert.equal((await lstat(join(target, ".agents", "skills", "plugin-authoring"))).isSymbolicLink(), false);
  assert.equal((await lstat(join(target, ".agents", "skills", "gui-automation"))).isSymbolicLink(), false);
  assert.match(await readFile(join(target, ".agents", "skills", "cto-writer", "examples.md"), "utf8"), /Bad vs good/);
  assert.equal(JSON.parse(await readFile(join(target, ".agents", ".agentic-plugins.json"), "utf8")).copied, true);
});
