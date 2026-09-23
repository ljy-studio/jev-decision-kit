# Jev Decision Kit

[中文](README.md) | [English](README.en.md)

面向人类用户和 AI Agent 的 Codex Jev 决策插件：配置 Jev，调用结构化判断，并将分类、路由、严重性、优先级、风险筛查和人工复核适配到具体业务或运维流程。

**安装** · **初始化** · **评估** · **工作流适配** · **安全策略**

## 为什么使用 Jev Decision Kit？

- **Agent 原生**：输出 `choice`、`score`、`noul` 等有界结果，便于 Agent 稳定消费。
- **领域可适配**：将同一套决策框架用于模型运维、客服路由、风险筛查、工单分派等工作流。
- **安全可控**：API key 只从环境变量读取，不写入仓库、提示词、请求状态或日志。
- **可复核**：置信度、阈值、人工复核条件和审批边界都显式保留在工作流中。
- **可分发**：仓库包含 Codex marketplace 清单、Skill、初始化脚本和 Agent 提示词。

## 快速开始（人类用户）

### 环境要求

- Node.js 18 或更高版本
- 可访问 Jev API endpoint
- 由用户自行管理的 Jev API key

### 安装

```powershell
git clone https://github.com/ljy-studio/jev-decision-kit.git
cd jev-decision-kit
codex plugin marketplace add .
```

然后在 Codex 中安装 `jev-decision-kit`，并加载 `jev-decision-workflow` Skill。

### 初始化

PowerShell 示例：

```powershell
$env:JEV_API_KEY = Read-Host "JEV API key"
node plugins/jev-decision-kit/scripts/init.mjs `
  --base-url "https://api.gaoxin.net.cn" `
  --endpoint "/typesafe/v1/systemone" `
  --model "jev-latest" `
  --persist-key
node plugins/jev-decision-kit/scripts/evaluate.mjs --config-status
```

初始化支持：

- `base URL`
- `endpoint`
- 完整 `api URL`
- fallback URL
- `model ID`
- 自定义配置文件路径
- Windows 用户级 key 持久化

API key 只从 `JEV_API_KEY` 或 `TYPESAFE_API_KEY` 环境变量读取，不会写入仓库或本地配置文件。CI 场景请使用 Secret 注入 `JEV_API_KEY`，不要使用 `--persist-key`。

### Agent 代理配置（需要用户选择）

如果希望由 Agent 代理完成配置，请先让 Agent 展示风险并等待选择，不要默认执行持久化操作。

> **风险警告**：持久化 `JEV_API_KEY` 会把密钥写入当前 Windows 用户级环境变量。后续由该用户启动的进程可能读取此密钥；现有进程通常需要重启才能看到新值。该操作不会写入 GitHub，但会扩大本机进程可访问范围。不要将 key 写入机器级环境变量、仓库、日志或聊天记录。

用户可以选择：

1. **仅代理非敏感配置**：由 Agent 配置 `base URL`、`endpoint`、`model ID` 和本地非敏感配置；API key 由用户自行设置。
2. **代理完整配置**：用户明确确认后，Agent 才能使用当前环境中的 `JEV_API_KEY` 执行 `init.mjs --persist-key`，并只验证是否配置成功，不打印密钥。
3. **不代理配置**：用户完全手动执行初始化。

可直接发送给 Agent 的提示词：

```text
我希望你代理配置 Jev，但在执行前必须先展示风险并让我选择：
1) 只配置 base URL、endpoint、model ID 等非敏感项；
2) 在我明确确认后，将当前环境中的 JEV_API_KEY 持久化为当前 Windows 用户级环境变量；
3) 我自己手动配置。

如果我选择 2：不要让我在聊天里粘贴 key；只读取当前环境中的 JEV_API_KEY；不要写入机器级环境变量、仓库、配置文件、prompt 或日志；执行后用 evaluate.mjs --config-status 验证，但不要输出 key。若当前环境中没有 key，停止并提示我安全地设置环境变量或重启进程。
```

### AI Agent 快速开始

将以下提示词发送给 Agent：

```text
从当前仓库安装 jev-decision-kit，加载 jev-decision-workflow Skill。先检查 Jev 配置但不要输出任何密钥；从环境变量 JEV_API_KEY 读取 API key。配置缺失时，向我询问 base URL、endpoint 和 model ID，并在我确认后运行初始化脚本。初始化完成后，用 evaluate.mjs --config-status 验证连接，不要把 key 写入文件、提示词、请求状态或日志。
```

更多可复制提示词见 [agent-prompts.md](plugins/jev-decision-kit/assets/agent-prompts.md)。

## 评估 Jev 决策

通过标准输入或 JSON 文件传入请求：

```powershell
$request | node plugins/jev-decision-kit/scripts/evaluate.mjs
node plugins/jev-decision-kit/scripts/evaluate.mjs examples/ai-model-ops-request.json
```

请求使用 Jev 合约：

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

问题类型：

- `choice`：从有限候选中选择一个结果；
- `score`：在有序等级中判断严重性、优先级或风险；
- `noul`：判断某个条件成立的概率。

Jev 只负责有界语义判断。开放式写作、精确计算、权限审批、外部副作用和最终解释由当前 Agent 或代码负责。

### 对话结果展示约束

每次调用 Jev 后，Agent 必须先在对话中展示一个 `Jev structured result` JSON 代码块，再提供解读、建议或后续步骤：

- 调用成功：完整展示调用器返回的 `response` 和 `meta`，包括每个答案、类型、选择值、置信度、概率分布、等级说明、模型、用量、endpoint、重试次数和成本元数据（如存在）。
- 调用失败：完整展示安全错误结构，并明确说明 Jev 没有产生判断结果。
- 不得只给自然语言总结，也不得省略结构化字段。
- 若上游异常返回了凭证、个人信息或其他敏感值，仅可对该敏感字段脱敏，并说明发生了脱敏；不得展示原值。

这项约束让用户可以直接确认 Jev 是否真实调用成功，并能区分 Jev 结果与 Agent 的后续解释。

## 领域工作流适配

适配新业务时，先定义：

1. 用户可见的目标；
2. 决策时可获得的最小证据；
3. 有界的决策输出；
4. 必须保留在代码或政策中的确定性规则；
5. 错误判断的代价；
6. 置信度阈值、人工复核条件和必要审批。

然后把每个独立判断拆成单独的 `choice`、`score` 或 `noul` 问题，并使用代表性、对抗性、歧义和无匹配样例进行校准。参考 [workflow-adaptation.md](plugins/jev-decision-kit/skills/jev-decision-workflow/references/workflow-adaptation.md) 和 [workflow-spec.yaml](plugins/jev-decision-kit/skills/jev-decision-workflow/assets/workflow-spec.yaml)。

## 安全策略（使用前请阅读）

- 置信度是决策信号，不是授权凭证。
- 不要把 API key 放进 prompt、`state`、配置文件、仓库或日志。
- 生产路由调整、凭证轮换、数据处理和其他高影响操作必须在 Jev 之外执行。
- 低置信度、不可逆或涉及生产影响的结果必须转交当前 Agent 或人工确认。
- Jev 不得绕过审批、权限、确定性安全检查或用户确认。

## 贡献

欢迎提交 Issue 或 Pull Request。新增领域适配时，请同时提供工作流边界、问题定义、阈值策略和校准样例，并运行插件与 Skill 校验。

```powershell
python C:/Users/Junye/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/jev-decision-kit
python C:/Users/Junye/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/jev-decision-kit/skills/jev-decision-workflow
```
