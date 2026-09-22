# Jev Decision Kit

[中文](README.md) | [English](README.en.md)

A Codex Jev decision plugin for humans and AI Agents: configure Jev, call structured judgments, and adapt classification, routing, severity, priority, risk screening, and human review to business or operational workflows.

**Install** · **Initialize** · **Evaluate** · **Workflow adaptation** · **Security**

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

Then install `jev-decision-kit` in Codex and load the `jev-decision-workflow` Skill.

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
