# Workflow adaptation guide

Use this sequence to adapt the kit to a new business or operational domain.

## 1. Fix the boundary

Record the user-visible goal, minimum evidence available at decision time, bounded decision output, deterministic rules that remain in code or policy, and the cost of a wrong decision.

## 2. Extract typed judgments

Turn contextual judgments into narrow questions: `choice` for one route or category, `score` for an ordered severity or priority, and `noul` for whether a condition is likely true. Do not ask Jev to draft a report, calculate an exact value, or perform an external action.

## 3. Define policy outside Jev

Set confidence thresholds and the fallback model in the workflow implementation. Define when to require human review, what approvals remain mandatory, and which fields must be redacted.

## 4. Calibrate

Maintain representative, adversarial, ambiguous, and no-match cases with expected answers. Track accuracy, handoff rate, latency, and input cost. Pin a versioned Jev model after tuning production thresholds; use aliases deliberately.

## 5. Example: model aggregation operations

For an upstream `502` timeout affecting one provider route, classify the error family as `upstream_dependency`, choose provider health and latency comparison as the first investigation, score severity according to traffic scope and fallback availability, and route persistent traffic changes or uncertain remediation to human review. This is a pattern, not a universal incident policy.
