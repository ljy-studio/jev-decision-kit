# Jev request-authoring prompts

## 中文：把业务需求转换为 Jev 入参

```text
请把我的业务需求转换为可执行的 Jev 请求。先明确用户可见目标、待判断的有界问题、最小证据、必须留在 Jev 之外的确定性规则，以及错误判断的代价。然后输出：

1. 简短的决策边界；
2. 一个 `Jev request draft` JSON 代码块，包含最小化的 state 和一个或多个相互独立的 questions；
3. 每个问题为什么选用 choice、score 或 noul；
4. 置信度阈值、回退策略、人工复核条件和审批边界；
5. 调用前的脱敏与校验清单。

choice 必须给出 2–255 个互斥候选，score 必须给出 2–10 个有序等级，noul 必须说明条件成立与不成立的含义。不要在 state 中放入 API key、Authorization、Token、个人信息、无关上下文或预设答案。先运行 validate-request.mjs；通过后才调用 Jev。调用后必须先完整展示 `Jev structured result` JSON，再解释结论。
```

## English: turn a workflow into Jev input

```text
Convert my workflow into an executable Jev request. First define the user-visible goal, bounded decisions, minimum evidence, deterministic rules that must stay outside Jev, and the cost of error. Then provide:

1. a concise decision boundary;
2. a `Jev request draft` JSON block with minimized state and one or more independent questions;
3. why each question uses choice, score, or noul;
4. confidence thresholds, fallback policy, human-review gates, and approval boundaries;
5. a redaction and validation checklist before the call.

choice needs 2–255 mutually exclusive options, score needs 2–10 ordered levels, and noul must define what true and false mean. Do not put API keys, Authorization values, tokens, personal data, unrelated context, or desired answers in state. Run validate-request.mjs before calling Jev. After the call, show the full `Jev structured result` JSON before any interpretation.
```
