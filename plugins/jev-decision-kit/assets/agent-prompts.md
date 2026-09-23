# Agent installation and initialization prompts

## Install prompt

```text
Install the `jev-decision-kit` plugin from this repository's marketplace. After installation, load the `jev-decision-workflow` skill. Do not copy any API key into prompts, files, logs, or requests.
```

## Initialization prompt

```text
Initialize Jev for this environment. First inspect the available configuration without printing secrets. Ask me for the base URL, endpoint, and model ID if they are not already supplied. Read the API key from the environment variable JEV_API_KEY; do not ask me to paste it into chat. Run `node scripts/init.mjs --persist-key` only after I explicitly confirm persistence, then verify with `node scripts/evaluate.mjs --config-status`.
```

## Agent-managed configuration prompt (explicit user choice)

```text
I want you to configure Jev, but first show the risk and ask me to choose:
1) configure only the non-sensitive base URL, endpoint, model ID, and local settings;
2) after my explicit confirmation, persist the current JEV_API_KEY as a Windows user-level environment variable;
3) let me configure everything manually.

Risk warning: persistence makes the key available to future processes started by this Windows user, and existing processes may need to restart. It does not write to GitHub, but it broadens local process access.

If I choose 2: do not ask me to paste the key into chat; read only the current JEV_API_KEY environment variable; never write it to a machine-wide environment variable, repository, config file, prompt, or log; run init.mjs --persist-key only after my confirmation; verify with evaluate.mjs --config-status without printing the key. If the current process has no key, stop and tell me to set it securely or restart the process.
```

## Jev request-authoring prompt

```text
Turn my workflow into a valid, minimal Jev request. First state the user-visible goal, bounded decision, minimum evidence, deterministic rules outside Jev, and cost of error. Then show a `Jev request draft` JSON block with state and independent questions. Use choice only for one of 2–255 mutually exclusive options, score only for 2–10 ordered levels, and noul only for a condition probability with explicit true/false meaning. Do not include credentials, Authorization values, tokens, personal data, unrelated context, or desired answers in state. Run validate-request.mjs before calling Jev, fix every validation error, redact every credential warning, and after the call show the complete safe `Jev structured result` JSON before your interpretation.
```

## Plugin update prompt

```text
Check whether the configured jev-decision-kit marketplace can be updated by running `node scripts/update.mjs --marketplace jev-decision-kit`. Do not refresh it yet. Show me the result and explain that applying an update refreshes the local marketplace snapshot, requires a Codex desktop-app restart, and requires a new chat before the updated Skill is loaded. Only after I explicitly confirm, run `node scripts/update.mjs --marketplace jev-decision-kit --apply --yes`.
```

## Workflow adaptation prompt

```text
Adapt Jev to my workflow. Start by defining the user-visible goal, minimum evidence, bounded decision outputs, deterministic rules that stay outside Jev, and the cost of a wrong decision. Convert each independent judgment into a separate Jev question using choice, score, or noul. Define confidence thresholds, fallback to the current reasoning model, human-review gates, required approvals, redaction rules, and representative/adversarial/ambiguous calibration cases. Do not let Jev execute side effects or bypass approval. After every Jev call, show the complete safe structured evaluator return in a `Jev structured result` JSON code block before explaining it; include both response and meta on success, or the safe error envelope on failure.
```

## Operational incident prompt

```text
Use Jev to triage the incident evidence below. Return only bounded decisions for error family, likely root cause, severity, first check, and human-review requirement. Immediately show the complete safe structured evaluator return in a `Jev structured result` JSON code block before any explanation: include both response and meta on success, or the safe error envelope on failure. Then explain the results in plain language, preserving uncertainty and separating evidence from inference. Never include credentials or trigger production changes without confirmation.
```
