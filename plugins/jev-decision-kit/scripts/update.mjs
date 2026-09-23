#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function valueAfter(args, flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith("--") ? args[index + 1] : fallback;
}

function runCodex(args) {
  const result = spawnSync("codex", args, { encoding: "utf8" });
  if (result.error) throw new Error("Codex CLI is unavailable. Install or start Codex before updating the marketplace.");
  return { ok: result.status === 0, exit_code: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

function printHelp() {
  console.log("Usage: node scripts/update.mjs [--marketplace NAME] [--apply --yes]");
  console.log("Without --apply, the script only lists configured marketplaces.");
  console.log("--apply requires --yes and refreshes the selected marketplace snapshot.");
}

function marketplaceIsConfigured(output, marketplace) {
  const rows = output.split(/\r?\n/).slice(1);
  return rows.some((row) => row.trim().split(/\s{2,}/)[0] === marketplace);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) { printHelp(); return; }
  const marketplace = valueAfter(args, "--marketplace", "jev-decision-kit");
  const apply = args.includes("--apply");
  if (apply && !args.includes("--yes")) {
    console.error(JSON.stringify({ ok: false, error: "confirmation_required", message: "Re-run with --apply --yes after reviewing the marketplace source and update risk." }, null, 2));
    process.exitCode = 1;
    return;
  }
  const result = apply
    ? runCodex(["plugin", "marketplace", "upgrade", marketplace])
    : runCodex(["plugin", "marketplace", "list"]);
  const configured = apply ? null : marketplaceIsConfigured(result.stdout, marketplace);
  console.log(JSON.stringify({
    ok: result.ok,
    action: apply ? "marketplace_upgrade" : "marketplace_list",
    marketplace,
    marketplace_configured: configured,
    command_output: { stdout: result.stdout, stderr: result.stderr, exit_code: result.exit_code },
    restart_required: apply && result.ok,
    next_steps: apply && result.ok
      ? ["Restart the Codex desktop app so it reloads the refreshed plugin files.", "Start a new chat before testing the updated Skill."]
      : configured === false
        ? ["Add the Git marketplace first: codex plugin marketplace add ljy-studio/jev-decision-kit --ref main.", "Then re-run this check before applying an update."]
        : ["Review the configured marketplace source before applying an update."]
  }, null, 2));
  if (!result.ok) process.exitCode = 1;
}

try { main(); }
catch (error) {
  console.error(JSON.stringify({ ok: false, error: "update_failed", message: error.message }, null, 2));
  process.exitCode = 1;
}
