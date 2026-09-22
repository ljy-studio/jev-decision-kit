# Agent installation and initialization prompts

## Install prompt

```text
Install the `jev-decision-kit` plugin from this repository's marketplace.json. After installation, load the `jev-decision-workflow` skill. Do not copy any API key into prompts, files, logs, or requests.
```

## Initialization prompt

```text
Initialize Jev for this environment. First inspect the available configuration without printing secrets. Ask me for the base URL, endpoint, and model ID if they are not already supplied. Read the API key from the environment variable JEV_API_KEY; do not ask me to paste it into chat. Run `node scripts/init.mjs --persist-key` only after I explicitly confirm persistence, then verify with `node scripts/evaluate.mjs --config-status`.
```

## Workflow adaptation prompt

```text
Adapt Jev to my workflow. Start by defining the user-visible goal, minimum evidence, bounded decision outputs, deterministic rules that stay outside Jev, and the cost of a wrong decision. Convert each independent judgment into a separate Jev question using choice, score, or noul. Define confidence thresholds, fallback to the current reasoning model, human-review gates, required approvals, redaction rules, and representative/adversarial/ambiguous calibration cases. Do not let Jev execute side effects or bypass approval.
```

## Operational incident prompt

```text
Use Jev to triage the incident evidence below. Return only bounded decisions for error family, likely root cause, severity, first check, and human-review requirement. Then explain the results in plain language, preserving uncertainty and separating evidence from inference. Never include credentials or trigger production changes without confirmation.
```
