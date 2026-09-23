---
name: jev-decision-workflow
description: Use Jev for bounded workflow decisions such as classification, routing, severity, priority, risk screening, and confidence-gated handoff after the local Jev configuration has been initialized.
---

# Jev Decision Workflow

Use this skill when a user needs a contextual but bounded judgment in a business or operational workflow. Keep prose generation, calculations, permissions, side effects, and final explanations in the current reasoning model; use Jev only for typed judgments whose answer is a `choice`, `score`, or `noul`.

## Initialize before evaluating

1. Ask the user to run the repository's initialization command if configuration is missing: `node scripts/init.mjs --persist-key` from the plugin directory.
2. Never put an API key in a request, repository file, prompt, log, or answer. The evaluator reads `JEV_API_KEY` or `TYPESAFE_API_KEY` from the environment and stores only non-secret connection settings in the user's local config.
3. Check readiness with `node scripts/evaluate.mjs --config-status`. Do not claim a Jev evaluation happened unless the evaluator returned an `answers` object.
4. Read [configuration.md](../references/configuration.md) when changing connection settings or explaining precedence.

When the user asks the Agent to configure the environment directly, show the risk first and require an explicit choice: non-sensitive settings only, full current-user key persistence, or manual setup. Never persist a key by default. Full persistence is limited to the current user scope and must stop if `JEV_API_KEY` is not already available in the process environment.

## Adapt a workflow

Before calling Jev, define the workflow boundary: user-visible goal, minimum evidence available, bounded output, deterministic rules kept outside Jev, and the consequence of a wrong decision.

Then:

- use one question per independent judgment;
- use `choice` for exactly one route or category;
- use `score` for an ordered severity or priority level;
- use `noul` for the probability that a condition holds;
- write criteria so each option is understandable without hidden organizational knowledge;
- submit independent questions together in one request;
- redact credentials, personal data, and unrelated content;
- define confidence thresholds, fallback behavior, and human-review gates outside Jev.

Read [workflow-adaptation.md](../references/workflow-adaptation.md) for the reviewable template and [workflow-spec.yaml](../assets/workflow-spec.yaml) for a starting specification.

## Interpret and hand off

Treat probabilities and confidence as signals, not proof. Route low-confidence, high-impact, irreversible, or production-changing cases to the current reasoning model or a human. Jev must not bypass approvals, authorization, deterministic safety checks, or user confirmation.

## Conversation output contract

After every Jev evaluation attempt, the Agent must show a `Jev structured result` JSON code block in its user-facing reply. Do this before interpretation, recommendations, or next steps.

- On success, show the complete evaluator return envelope exactly as received: both `response` and `meta`, including every answer, type, selected value, confidence, probability distribution, legend, model, usage, endpoint, retry count, and cost metadata when present.
- On failure, show the complete safe error envelope returned by the evaluator and clearly state that Jev did not produce a decision. Do not replace a failed call with an inferred result while presenting it as Jev output.
- Do not summarize, omit fields, or convert the structured result into prose only. A concise interpretation may follow the JSON block.
- Redact only credentials, authorization headers, personal data, or other secret values if an upstream response unexpectedly contains them. State that redaction occurred without revealing the removed value.

When the user needs a new domain workflow, adapt the specification first and calibrate it with representative, adversarial, ambiguous, and no-match cases before treating it as production policy.
