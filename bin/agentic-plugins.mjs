#!/usr/bin/env node

import { cp, lstat, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const packageRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const managedMarker = "<!-- Managed by agentic-plugins -->";
const metadataPath = (target) => join(target, ".agents", ".agentic-plugins.json");

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(`Usage:
  agentic-plugins install [source] --target <project> [--agents claude-code,cursor-agent,copilot] [--copy]
  agentic-plugins update --target <project>

Portable skills are installed once at .agents/skills. The default is symlinks, which is
best for local development; pass --copy to copy immutable files instead.`);
  process.exitCode = message ? 1 : 0;
}

function options(args) {
  const result = { copy: false, agents: [] };
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--copy") result.copy = true;
    else if (arg === "--target") result.target = args[++index];
    else if (arg === "--agents") result.agents = (args[++index] ?? "").split(",").filter(Boolean);
    else if (arg === "--help" || arg === "-h") result.help = true;
    else if (arg.startsWith("-")) throw new Error(`unknown option ${arg}`);
    else positional.push(arg);
  }
  result.positional = positional;
  return result;
}

async function skillDirectories(source) {
  const skillsRoot = join(source, "skills");
  if (!existsSync(skillsRoot)) return [];
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && existsSync(join(skillsRoot, entry.name, "SKILL.md")))
    .map((entry) => join(skillsRoot, entry.name));
}

async function safeReplace(destination, allowedExisting = false) {
  if (!existsSync(destination)) return;
  const info = await lstat(destination);
  if (info.isSymbolicLink() || allowedExisting) {
    await rm(destination, { recursive: true, force: true });
    return;
  }
  throw new Error(`${relative(process.cwd(), destination)} already exists and is not managed; refusing to replace it`);
}

async function installSkill(source, target, copy, managedSkills) {
  const destination = join(target, ".agents", "skills", basename(source));
  await mkdir(dirname(destination), { recursive: true });
  await safeReplace(destination, managedSkills.includes(basename(source)));
  if (copy) await cp(source, destination, { recursive: true });
  else await symlink(source, destination, "dir");
  return basename(source);
}

const nativeLocations = {
  "claude-code": [".claude", "agents", "plugin-reviewer.md"],
  "cursor-agent": [".cursor", "agents", "plugin-reviewer.md"],
  copilot: [".github", "agents", "plugin-reviewer.agent.md"]
};

async function installNative(target, agent) {
  const location = nativeLocations[agent];
  if (!location) throw new Error(`unsupported agent "${agent}"; use claude-code, cursor-agent, or copilot`);
  const source = join(packageRoot, "templates", "native", agent, "agents", location.at(-1));
  const destination = join(target, ...location);
  await mkdir(dirname(destination), { recursive: true });
  if (existsSync(destination)) {
    const content = await readFile(destination, "utf8");
    if (!content.includes(managedMarker)) {
      throw new Error(`${relative(process.cwd(), destination)} exists and is not managed; refusing to replace it`);
    }
  }
  await writeFile(destination, `${managedMarker}\n${await readFile(source, "utf8")}`);
  return relative(target, destination);
}

async function install(source, target, { copy, agents }, prior = {}) {
  const pluginsRoot = join(source, "plugins");
  const pluginRoots = existsSync(pluginsRoot)
    ? (await (await import("node:fs/promises")).readdir(pluginsRoot, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(pluginsRoot, entry.name))
    : [];
  const skillRoots = existsSync(pluginsRoot) ? [source, ...pluginRoots] : [source];
  const skills = (await Promise.all(skillRoots.map(skillDirectories))).flat();
  if (!skills.length) throw new Error(`no Agent Skills found in ${source}`);

  const managedSkills = prior.skills ?? [];
  const installed = [];
  for (const skill of skills) installed.push(await installSkill(skill, target, copy, managedSkills));
  const native = [];
  for (const agent of agents) native.push(await installNative(target, agent));

  const state = {
    schemaVersion: 1,
    source,
    copied: copy,
    agents,
    skills: installed,
    native,
    updatedAt: new Date().toISOString()
  };
  await mkdir(dirname(metadataPath(target)), { recursive: true });
  await writeFile(metadataPath(target), `${JSON.stringify(state, null, 2)}\n`);
  console.log(`Installed ${installed.length} portable skill(s) in ${join(target, ".agents", "skills")}.`);
  if (native.length) console.log(`Installed ${native.length} native agent profile(s).`);
}

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);
  const parsed = options(args);
  if (parsed.help || command === "help") return usage();
  if (!parsed.target) return usage("--target is required");
  const target = resolve(parsed.target);

  if (command === "install") {
    if (parsed.positional.length > 1) return usage("install accepts one optional source");
    const source = resolve(parsed.positional[0] ?? packageRoot);
    return install(source, target, parsed);
  }
  if (command === "update") {
    if (!existsSync(metadataPath(target))) return usage(`no installation metadata at ${metadataPath(target)}`);
    const prior = JSON.parse(await readFile(metadataPath(target), "utf8"));
    return install(resolve(prior.source), target, { copy: prior.copied, agents: prior.agents }, prior);
  }
  return usage(`unknown command ${command}`);
}

main().catch((error) => {
  console.error(`agentic-plugins: ${error.message}`);
  process.exitCode = 1;
});
