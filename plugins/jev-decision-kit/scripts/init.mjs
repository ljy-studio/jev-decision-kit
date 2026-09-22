#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULT_BASE_URL = "https://api.gaoxin.net.cn";
const DEFAULT_ENDPOINT = "/typesafe/v1/systemone";
const DEFAULT_MODEL = "jev-latest";
const DEFAULT_FALLBACK_URL = "https://api-sh.gaoxin.net.cn/typesafe/v1/systemone";

function argsFrom(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) { out._.push(token); continue; }
    const [rawKey, inline] = token.slice(2).split("=", 2);
    if (inline !== undefined) out[rawKey] = inline;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) out[rawKey] = argv[++i];
    else out[rawKey] = true;
  }
  return out;
}

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim();
}

function normalizeEndpoint(endpoint) {
  if (!endpoint) return DEFAULT_ENDPOINT;
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

function validateUrl(value, label) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsupported protocol");
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid HTTP(S) URL.`);
  }
}

function defaultConfigPath() {
  return process.env.JEV_CONFIG_PATH || path.join(os.homedir(), ".codex", "jev-decision-kit", "config.json");
}

async function persistUserKey(key) {
  if (process.platform !== "win32") {
    throw new Error("--persist-key currently supports Windows user-level persistence. Export JEV_API_KEY in your shell or CI secret on other systems.");
  }
  const script = "$v = [Console]::In.ReadToEnd().TrimEnd(); [Environment]::SetEnvironmentVariable('JEV_API_KEY', $v, 'User')";
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { input: `${key}\n`, stdio: ["pipe", "ignore", "pipe"] });
}

function printHelp() {
  console.log("Usage: node scripts/init.mjs [options]");
  console.log("  --base-url URL       Base URL used with endpoint");
  console.log("  --endpoint PATH      Endpoint path");
  console.log("  --api-url URL        Complete API URL (overrides base URL and endpoint)");
  console.log("  --fallback-url URL   Optional fallback endpoint");
  console.log("  --model MODEL        Jev model alias or version");
  console.log("  --config-path PATH   Local config file path");
  console.log("  --persist-key        Persist JEV_API_KEY as a Windows user variable");
  console.log("  --help               Show this help");
}

async function main() {
  const args = argsFrom(process.argv.slice(2));
  if (args.help) { printHelp(); return; }
  const configPath = path.resolve(firstNonEmpty(args["config-path"], defaultConfigPath()));
  const apiKey = firstNonEmpty(process.env.JEV_API_KEY, process.env.TYPESAFE_API_KEY);
  if (!apiKey) throw new Error("Set JEV_API_KEY in the environment before initialization; the key is never accepted as a command-line argument.");

  const apiUrl = args["api-url"] ? validateUrl(args["api-url"], "--api-url") : null;
  const baseUrl = validateUrl(firstNonEmpty(args["base-url"], DEFAULT_BASE_URL), "base URL").replace(/\/$/, "");
  const endpoint = normalizeEndpoint(firstNonEmpty(args.endpoint, DEFAULT_ENDPOINT));
  const fallbackUrl = validateUrl(firstNonEmpty(args["fallback-url"], DEFAULT_FALLBACK_URL), "fallback URL");
  const model = firstNonEmpty(args.model, DEFAULT_MODEL);
  const config = { api_url: apiUrl, base_url: baseUrl, endpoint, fallback_api_url: fallbackUrl, model };

  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8" });
  if (process.platform !== "win32") await fs.chmod(configPath, 0o600).catch(() => {});
  if (args["persist-key"]) await persistUserKey(apiKey);

  console.log(JSON.stringify({ configured: true, config_path: configPath, api_url: apiUrl || `${baseUrl}${endpoint}`, model, key_persisted: Boolean(args["persist-key"]) }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ error: "init_failed", message: error.message }, null, 2));
  process.exitCode = 1;
});
