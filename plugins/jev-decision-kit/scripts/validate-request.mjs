#!/usr/bin/env node
import fs from "node:fs/promises";

const TYPES = new Set(["noul", "choice", "score"]);
const SENSITIVE_NAME = /(api[_-]?key|authorization|token|secret|password|credential)/i;
const SENSITIVE_VALUE = /(sk-[A-Za-z0-9_-]{8,}|bearer\s+\S+)/i;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isStructured(value) {
  return (typeof value === "string" && value.trim().length > 0) || Array.isArray(value) || isObject(value);
}

function scanSensitive(value, location, warnings) {
  if (typeof value === "string") {
    if (SENSITIVE_VALUE.test(value)) warnings.push(`${location}: possible credential-shaped value; redact it before evaluation.`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanSensitive(item, `${location}[${index}]`, warnings));
    return;
  }
  if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      const child = `${location}.${key}`;
      if (SENSITIVE_NAME.test(key)) warnings.push(`${child}: sensitive field name; remove or redact it before evaluation.`);
      scanSensitive(item, child, warnings);
    }
  }
}

function validate(input) {
  const errors = [];
  const warnings = [];
  const typeCounts = { choice: 0, score: 0, noul: 0 };
  const questionIds = [];
  if (!isObject(input)) return { errors: ["Request must be a JSON object."], warnings, summary: null };
  if (!(typeof input.state === "string" || Array.isArray(input.state) || isObject(input.state))) errors.push("state must be a string, object, or array.");
  else scanSensitive(input.state, "state", warnings);
  if (input.model !== undefined && (typeof input.model !== "string" || !input.model.trim())) errors.push("model must be a non-empty string when provided.");
  if (!isObject(input.questions) || Object.keys(input.questions).length === 0) {
    errors.push("questions must be a non-empty object.");
  } else {
    for (const [id, question] of Object.entries(input.questions)) {
      questionIds.push(id);
      if (!id.trim()) { errors.push("question IDs must be non-empty."); continue; }
      if (!isObject(question) || !TYPES.has(question.type)) { errors.push(`Question '${id}' has an unsupported type.`); continue; }
      typeCounts[question.type] += 1;
      if (!isStructured(question.instructions)) errors.push(`Question '${id}' needs non-empty instructions.`);
      if (question.type === "noul" && question.criteria !== undefined && !isObject(question.criteria)) errors.push(`Noul question '${id}' criteria must be an object when provided.`);
      if (question.type === "choice") {
        if (!isObject(question.criteria) || Object.keys(question.criteria).length < 2 || Object.keys(question.criteria).length > 255) errors.push(`Choice question '${id}' must contain 2 to 255 named criteria.`);
      }
      if (question.type === "score") {
        if (!Array.isArray(question.criteria) || question.criteria.length < 2 || question.criteria.length > 10) errors.push(`Score question '${id}' must contain 2 to 10 ordered criteria.`);
        else if (question.criteria.some((criterion) => !isStructured(criterion))) errors.push(`Score question '${id}' has an empty criterion.`);
      }
    }
  }
  return { errors, warnings, summary: { question_count: questionIds.length, question_ids: questionIds, type_counts: typeCounts } };
}

async function readInput(args) {
  const file = args.find((arg) => !arg.startsWith("--"));
  if (file) return JSON.parse(await fs.readFile(file, "utf8"));
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  if (!raw.trim()) throw new Error("Provide a JSON request through stdin or a file path.");
  return JSON.parse(raw);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: node scripts/validate-request.mjs [request.json] [--strict]");
    return;
  }
  const result = validate(await readInput(args));
  const strict = args.includes("--strict");
  const ok = result.errors.length === 0 && (!strict || result.warnings.length === 0);
  console.log(JSON.stringify({ ok, errors: result.errors, warnings: result.warnings, summary: result.summary }, null, 2));
  if (!ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, errors: [error.message], warnings: [], summary: null }, null, 2));
  process.exitCode = 1;
});
