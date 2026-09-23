#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, ".codex-plugin", "plugin.json");

function parseArgs(args) {
  const bumpIndex = args.indexOf("--bump");
  return { bump: bumpIndex >= 0 ? args[bumpIndex + 1] : null, apply: args.includes("--apply"), help: args.includes("--help") };
}

function bumpedVersion(version, bump) {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) throw new Error("Current plugin version must start with semantic version X.Y.Z.");
  let [major, minor, patch] = match.slice(1).map(Number);
  if (bump === "major") { major += 1; minor = 0; patch = 0; }
  else if (bump === "minor") { minor += 1; patch = 0; }
  else if (bump === "patch") { patch += 1; }
  else throw new Error("--bump must be patch, minor, or major.");
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `${major}.${minor}.${patch}+codex.${timestamp}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log("Usage: node scripts/release.mjs --bump patch|minor|major [--apply]"); return; }
  if (!args.bump) throw new Error("Specify --bump patch, minor, or major.");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const previousVersion = manifest.version;
  const nextVersion = bumpedVersion(previousVersion, args.bump);
  if (args.apply) {
    manifest.version = nextVersion;
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({ ok: true, applied: args.apply, previous_version: previousVersion, next_version: nextVersion, manifest_path: manifestPath, next_steps: args.apply ? ["Run validation.", "Commit, tag, and push the release."] : ["Review the planned version.", "Re-run with --apply to update plugin.json."] }, null, 2));
}

main().catch((error) => { console.error(JSON.stringify({ ok: false, error: "release_failed", message: error.message }, null, 2)); process.exitCode = 1; });
