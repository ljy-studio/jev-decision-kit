# Authoring Jev request inputs

Use this guide when turning a user task into a Jev request. The objective is a small, reviewable input that supports one or more bounded judgments.

## Draft in two layers

1. **Decision boundary**: state the user-visible goal, the decision to make, available evidence, deterministic rules kept outside Jev, and the cost of a wrong result.
2. **Request JSON**: put only evidence required for the judgment in `state`; put one independent typed judgment in each `questions` entry.

Do not put API keys, authorization headers, personal data, unrelated history, policy text, or desired answers in `state`.

## Choose the smallest valid type

| Need | Jev type | Rule |
| --- | --- | --- |
| Is a condition likely true? | `noul` | Define what true and false mean. |
| Select one route or category | `choice` | Provide 2–255 mutually exclusive, named criteria. |
| Assign an ordered level | `score` | Provide 2–10 ordered criteria from low to high. |

Each question should have one semantic purpose. If a later question depends on new evidence, make a second call only after obtaining that evidence.

## Before calling Jev

1. Give the user or workflow a `Jev request draft` JSON block when review is useful.
2. Run `node scripts/validate-request.mjs request.json` or pipe the JSON through the validator.
3. Resolve validation errors. Treat credential warnings as mandatory redaction.
4. Define confidence thresholds, fallback behavior, human-review gates, and approval requirements outside Jev.
5. Call `evaluate.mjs`, then show the complete safe `Jev structured result` in the conversation.
