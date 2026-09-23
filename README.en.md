# Jev Decision Kit

[中文](README.md) | [English](README.en.md)

A Codex Jev decision plugin for humans and AI Agents: configure Jev, call structured judgments, and adapt classification, routing, severity, priority, risk screening, and human review to business or operational workflows.

**Install** · **Initialize** · **Evaluate** · **Request authoring** · **Updates** · **Security**

## Why Jev Decision Kit?

- **Agent-native**: returns bounded `choice`, `score`, and `noul` decisions that Agents can consume reliably.
- **Domain-adaptable**: reuse the framework for model operations, support routing, risk screening, ticket assignment, and more.
- **Secure by default**: API keys are read from environment variables and never written to repositories, prompts, request state, or logs.
- **Reviewable**: confidence, thresholds, human-review gates, and approval boundaries stay explicit in the workflow.
- **Distributable**: includes a Codex marketplace manifest, Skill, initialization scripts, and Agent prompts.

## Quick Start (Human Users)

### Requirements

- Node.js 18 or later
- Access to the Jev API endpoint
- A Jev API key managed by the user

### Install

```powershell
git clone https://github.com/ljy-studio/jev-decision-kit.git
cd jev-decision-kit
codex plugin marketplace add .
```

Then install `jev-decision-kit` in Codex and load the `jev-decision-workflow` Skill. The repository marketplace lives at `.agents/plugins/marketplace.json`, the conventional path for a Codex Git marketplace.

### Initialize

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

Initialization supports a base URL, endpoint, complete API URL, fallback URL, model ID, custom config path, and Windows user-level key persistence.

The API key is read only from `JEV_API_KEY` or `TYPESAFE_API_KEY` and is never written to the repository or local config file. In CI, inject `JEV_API_KEY` as a secret and omit `--persist-key`.

### Agent-Managed Configuration (User Choice Required)

If you want an Agent to configure Jev, require it to show the risk and wait for your choice before performing any persistent operation.

> **Risk warning**: Persisting `JEV_API_KEY` writes the secret to the current Windows user's environment. Future processes started by that user may read it, and existing processes usually need to restart before seeing the new value. This does not write to GitHub, but it broadens local process access. Never write the key to a machine-wide environment variable, repository, logs, or chat history.

Choose one of:

1. **Non-sensitive setup only**: let the Agent configure the base URL, endpoint, model ID, and local non-secret settings; set the API key yourself.
2. **Full Agent setup**: after explicit confirmation, let the Agent use the current `JEV_API_KEY` to run `init.mjs --persist-key`, then verify configuration without printing the key.
3. **Manual setup**: configure everything yourself.

Copy-ready prompt:

```text
I want you to configure Jev, but first show the risk and ask me to choose:
1) configure only the non-sensitive base URL, endpoint, model ID, and local settings;
2) after my explicit confirmation, persist the current JEV_API_KEY as a Windows user-level environment variable;
3) let me configure everything manually.

If I choose 2: do not ask me to paste the key into chat; read only the current JEV_API_KEY environment variable; never write it to a machine-wide environment variable, repository, config file, prompt, or log; verify with evaluate.mjs --config-status without printing the key. If the current process has no key, stop and tell me to set it securely or restart the process.
```

### Quick Start (AI Agent)

Send the following prompt to an Agent:

```text
Install jev-decision-kit from this repository and load the jev-decision-workflow Skill. Inspect Jev configuration without printing secrets; read the API key from JEV_API_KEY. If configuration is missing, ask for the base URL, endpoint, and model ID, and run initialization only after I confirm. Verify with evaluate.mjs --config-status. Never write the key to files, prompts, request state, or logs.
```

More copy-ready prompts are available in [agent-prompts.md](plugins/jev-decision-kit/assets/agent-prompts.md).

## Evaluate Jev Decisions

Pass a request through stdin or provide a JSON file:

```powershell
$request | node plugins/jev-decision-kit/scripts/evaluate.mjs
node plugins/jev-decision-kit/scripts/evaluate.mjs examples/ai-model-ops-request.json
```

Requests follow the Jev contract:

```json
{
  "state": { "evidence": "minimum material needed for the judgment" },
  "questions": {
    "route": {
      "type": "choice",
      "instructions": "Which route best matches the evidence?",
      "criteria": {
        "route_a": "Definition of route A.",
        "route_b": "Definition of route B."
      }
    }
  }
}
```

Question types:

- `choice`: choose exactly one option from a bounded set;
- `score`: select an ordered severity, priority, or risk level;
- `noul`: estimate whether a condition is likely true.

Jev handles bounded semantic judgments only. Open-ended writing, exact calculations, approvals, side effects, and final explanations remain with the current Agent or deterministic code.

### Conversation Output Contract

After every Jev call, the Agent must show a `Jev structured result` JSON code block before its interpretation, recommendations, or next steps:

- On success: show the complete evaluator return envelope, including `response` and `meta`, every answer, type, selected value, confidence, probability distribution, legend, model, usage, endpoint, retry count, and cost metadata when present.
- On failure: show the complete safe error envelope and explicitly say that Jev produced no decision.
- Do not provide a prose-only summary or omit structured fields.
- If an upstream response unexpectedly contains credentials, personal data, or another secret, redact only that value and disclose that redaction occurred without exposing it.

This contract lets users verify that Jev was actually called and distinguish its output from the Agent's interpretation.

## Author Jev Request Inputs

When an Agent turns a workflow into Jev input, it should define the decision boundary first, produce a minimized `Jev request draft` JSON block, then validate locally:

```powershell
node plugins/jev-decision-kit/scripts/validate-request.mjs examples/ai-model-ops-request.json
```

The validator reports only question counts, IDs, type counts, errors, and redaction warnings; it never echoes `state` content. `--strict` treats sensitive-field warnings as failures. See [request-authoring.md](plugins/jev-decision-kit/skills/jev-decision-workflow/references/request-authoring.md) for the method and [request-authoring-prompts.md](plugins/jev-decision-kit/assets/request-authoring-prompts.md) for reusable prompts.

## Plugin Updates

### For users

After adding the GitHub marketplace, inspect configured marketplaces first:

```powershell
node plugins/jev-decision-kit/scripts/update.mjs --marketplace jev-decision-kit
```

Refresh only after review:

```powershell
node plugins/jev-decision-kit/scripts/update.mjs --marketplace jev-decision-kit --apply --yes
```

The command uses Codex's marketplace-upgrade flow. On success, restart the Codex desktop app and start a new chat before testing the refreshed Skill. Do not assume an already-open chat has loaded the update.

### For maintainers

After changing the plugin, plan a version first, then explicitly write it, validate, commit, and push:

```powershell
node plugins/jev-decision-kit/scripts/release.mjs --bump patch
node plugins/jev-decision-kit/scripts/release.mjs --bump patch --apply
```

The release script previews by default. Only `--apply` changes `plugin.json`; it never commits, tags, or pushes automatically.

## Workflow Adaptation

For a new domain, define the user-visible goal, minimum evidence, bounded outputs, deterministic rules that stay in code or policy, cost of error, confidence thresholds, human-review gates, and required approvals. Split independent judgments into separate typed questions and calibrate with representative, adversarial, ambiguous, and no-match cases. See [workflow-adaptation.md](plugins/jev-decision-kit/skills/jev-decision-workflow/references/workflow-adaptation.md) and [workflow-spec.yaml](plugins/jev-decision-kit/skills/jev-decision-workflow/assets/workflow-spec.yaml).

## Security (Read Before Use)

- Confidence is a decision signal, not authorization.
- Never put an API key in prompts, `state`, config files, repositories, or logs.
- Keep production routing changes, credential rotation, data handling, and other high-impact actions outside Jev.
- Route low-confidence, irreversible, or production-impacting results to the current Agent or a human.
- Jev must not bypass approvals, permissions, deterministic safety checks, or user confirmation.

## Contributing

Issues and pull requests are welcome. New domain adaptations should include the workflow boundary, question definitions, threshold policy, and calibration cases. Run plugin and Skill validation before opening a pull request.

```powershell
python C:/Users/Junye/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/jev-decision-kit
python C:/Users/Junye/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/jev-decision-kit/skills/jev-decision-workflow
```
