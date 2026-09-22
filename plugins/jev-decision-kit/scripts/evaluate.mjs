#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_API_URL = "https://api.gaoxin.net.cn/typesafe/v1/systemone";
const DEFAULT_FALLBACK_URL = "https://api-sh.gaoxin.net.cn/typesafe/v1/systemone";
const DEFAULT_MODEL = "jev-latest";
const TYPES = new Set(["noul", "choice", "score"]);

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim();
}

function configPath() {
  return process.env.JEV_CONFIG_PATH || path.join(os.homedir(), ".codex", "jev-decision-kit", "config.json");
}

async function readConfig() {
  try { return JSON.parse(await fs.readFile(configPath(), "utf8")); }
  catch { return {}; }
}

function joinUrl(base, endpoint) {
  return `${base.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
}

function validUrl(value) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; }
  catch { return null; }
}

function resolveRuntimeConfig(fileConfig, inputModel) {
  const explicitApiUrl = firstNonEmpty(process.env.JEV_API_URL, fileConfig.api_url);
  const base = firstNonEmpty(process.env.JEV_BASE_URL, fileConfig.base_url);
  const endpoint = firstNonEmpty(process.env.JEV_ENDPOINT, fileConfig.endpoint, "/typesafe/v1/systemone");
  const apiUrl = validUrl(explicitApiUrl || (base ? joinUrl(base, endpoint) : DEFAULT_API_URL));
  if (!apiUrl) throw new Error("Resolved Jev API URL is invalid.");
  const disableFallback = ["1", "true", "yes"].includes(String(process.env.JEV_DISABLE_FALLBACK || "").toLowerCase());
  const fallback = firstNonEmpty(process.env.JEV_FALLBACK_API_URL, fileConfig.fallback_api_url, DEFAULT_FALLBACK_URL);
  const apiUrls = [apiUrl];
  if (!explicitApiUrl && !disableFallback && validUrl(fallback) && validUrl(fallback) !== apiUrl) apiUrls.push(validUrl(fallback));
  return {
    apiUrl,
    apiUrls,
    model: firstNonEmpty(inputModel, process.env.JEV_MODEL, fileConfig.model, DEFAULT_MODEL),
    apiKey: firstNonEmpty(process.env.JEV_API_KEY, process.env.TYPESAFE_API_KEY),
    timeoutMs: Math.min(Math.max(Number.parseInt(process.env.JEV_TIMEOUT_MS || "30000", 10) || 30000, 1000), 120000),
    maxRetries: Math.min(Math.max(Number.parseInt(process.env.JEV_MAX_RETRIES || "2", 10) || 2, 0), 5),
    inputPrice: Number.parseFloat(process.env.JEV_INPUT_PRICE_CNY_PER_MILLION || "0.34")
  };
}

function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }

function validateRequest(input) {
  if (!isObject(input)) throw new Error("Request must be a JSON object.");
  if (!(typeof input.state === "string" || Array.isArray(input.state) || isObject(input.state))) throw new Error("state must be a string, object, or array.");
  if (!isObject(input.questions) || Object.keys(input.questions).length === 0) throw new Error("questions must be a non-empty object.");
  for (const [id, question] of Object.entries(input.questions)) {
    if (!isObject(question) || !TYPES.has(question.type)) throw new Error(`Question '${id}' has an unsupported type.`);
    if (typeof question.instructions !== "string" && !isObject(question.instructions) && !Array.isArray(question.instructions)) throw new Error(`Question '${id}' needs instructions.`);
    if (question.type === "choice" && (!isObject(question.criteria) || Object.keys(question.criteria).length < 2 || Object.keys(question.criteria).length > 255)) throw new Error(`Choice question '${id}' needs 2 to 255 criteria.`);
    if (question.type === "score" && (!Array.isArray(question.criteria) || question.criteria.length < 2 || question.criteria.length > 10)) throw new Error(`Score question '${id}' needs 2 to 10 ordered levels.`);
  }
}

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function readResponse(response) {
  const text = await response.text();
  try { return { body: text ? JSON.parse(text) : {}, isJson: true }; }
  catch { return { body: null, isJson: false }; }
}

async function evaluate(input, config) {
  if (!config.apiKey) throw new Error("No Jev API key is configured.");
  const payload = { state: input.state, model: config.model, questions: input.questions };
  let lastError;
  for (let endpointIndex = 0; endpointIndex < config.apiUrls.length; endpointIndex += 1) {
    const endpoint = config.apiUrls[endpointIndex];
    for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal });
        clearTimeout(timer);
        const parsed = await readResponse(response);
        if (!response.ok) {
          const retryable = [404, 408, 429, 500, 502, 503, 504, 529].includes(response.status);
          lastError = new Error(`Jev request failed with HTTP ${response.status}.`);
          if (!retryable || attempt === config.maxRetries) { if (endpointIndex === config.apiUrls.length - 1) throw lastError; break; }
          await delay(250 * 2 ** attempt); continue;
        }
        if (!parsed.isJson || !isObject(parsed.body?.answers)) throw new Error("Jev response is missing the answers object.");
        const inputTokens = Number(parsed.body.usage?.input_tokens);
        const estimatedCost = Number.isFinite(inputTokens) ? inputTokens * config.inputPrice / 1e6 : null;
        return { response: parsed.body, meta: { model_requested: config.model, attempts: attempt + 1, endpoint, estimated_cost_cny: estimatedCost, cost_is_estimate: estimatedCost !== null } };
      } catch (error) {
        clearTimeout(timer);
        if (error.message?.startsWith("Jev response") || error.message?.startsWith("Jev request failed")) throw error;
        lastError = error.name === "AbortError" ? new Error("Jev request timed out.") : new Error("Jev network request failed.");
        if (attempt === config.maxRetries && endpointIndex === config.apiUrls.length - 1) throw lastError;
        await delay(250 * 2 ** attempt);
      }
    }
  }
  throw lastError || new Error("Jev evaluation failed.");
}

function printStatus(config, fileConfig) {
  console.log(JSON.stringify({ configured: Boolean(config.apiKey), api_url: config.apiUrl, api_urls: config.apiUrls, model: config.model, config_path: configPath(), config_file_present: Object.keys(fileConfig).length > 0, timeout_ms: config.timeoutMs, max_retries: config.maxRetries }, null, 2));
}

async function readInput(argv) {
  const file = argv.find((arg) => !arg.startsWith("--"));
  if (file) return JSON.parse(await fs.readFile(file, "utf8"));
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  if (!raw.trim()) throw new Error("Provide a JSON request through stdin or a file path.");
  return JSON.parse(raw);
}

async function main() {
  const argv = process.argv.slice(2);
  const fileConfig = await readConfig();
  const input = argv.includes("--config-status") ? {} : await readInput(argv);
  if (!argv.includes("--config-status")) validateRequest(input);
  const config = resolveRuntimeConfig(fileConfig, input.model);
  if (argv.includes("--config-status")) { printStatus(config, fileConfig); return; }
  console.log(JSON.stringify(await evaluate(input, config), null, 2));
}

main().catch((error) => { console.error(JSON.stringify({ error: "jev_cli_failed", message: error.message }, null, 2)); process.exitCode = 1; });
