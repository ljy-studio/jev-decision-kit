# Jev Decision Kit

A Codex plugin for configuring Jev and adapting bounded typed decisions to operational and business workflows.

## Repository layout

- `marketplace.json` — repository marketplace entry for Codex installation.
- `plugins/jev-decision-kit/.codex-plugin/plugin.json` — plugin manifest.
- `plugins/jev-decision-kit/skills/jev-decision-workflow/` — the reusable workflow-adaptation skill.
- `plugins/jev-decision-kit/scripts/init.mjs` — initialization and non-secret config setup.
- `plugins/jev-decision-kit/scripts/evaluate.mjs` — local Jev HTTP evaluator and config status command.
- `plugins/jev-decision-kit/assets/agent-prompts.md` — prompts for installation, initialization, and domain adaptation.

## Install from a cloned repository

After cloning this repository, add its marketplace root and install `jev-decision-kit` with the Codex plugin manager. The repository marketplace is intentionally separate from the user's personal marketplace.

## Initialize

PowerShell example:

```powershell
$env:JEV_API_KEY = Read-Host "JEV API key"
node plugins/jev-decision-kit/scripts/init.mjs `
  --base-url "https://api.gaoxin.net.cn" `
  --endpoint "/typesafe/v1/systemone" `
  --model "jev-latest" `
  --persist-key
node plugins/jev-decision-kit/scripts/evaluate.mjs --config-status
```

The API key is read from the environment and is never written to the repository or local config file. In CI, inject `JEV_API_KEY` as a secret and omit `--persist-key`.

## Evaluate

Send a JSON request on stdin or provide a JSON file path:

```powershell
$request | node plugins/jev-decision-kit/scripts/evaluate.mjs
```

The request follows the Jev contract: `state` plus one or more typed questions under `questions`. Use `choice`, `score`, and `noul` only for bounded semantic judgments.

## Security and policy

The kit does not put API keys in prompts, request state, config files, repository files, or logs. Probabilities and confidence are decision signals, not authorization. Keep approvals, safety checks, deterministic calculations, and side effects outside Jev.
