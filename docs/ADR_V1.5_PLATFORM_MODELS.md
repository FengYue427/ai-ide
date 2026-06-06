# ADR: v1.5 平台模型网关 — 弃 BYOK · 多厂商 · 套餐覆盖 API 成本

> **状态**：Accepted（v1.5 启动前拍板）  
> **日期**：2026-06-05  
> **RFC**：[V1.5_F0_PLATFORM_MODELS.md](./V1.5_F0_PLATFORM_MODELS.md)  
> **关联**：[ROADMAP_V1.1.3_GATEWAY.md](./ROADMAP_V1.1.3_GATEWAY.md)（v1.2 已落地 DeepSeek 单路由）

---

## 背景

当前产品形态存在 **双重付费感知**：

1. 用户已在 OpenAI / Anthropic / 国内大模型等平台 **单独充值 API**；
2. 若 IDE 再收订阅费，且仍要求 **自备 API Key（BYOK）**，体验接近「付两次钱」，不合理。

现状代码：

| 层 | 现状 |
|----|------|
| 客户端 `modelOptions` | 已列出 OpenAI · DeepSeek · Claude · Gemini · Qwen · GLM · MiniMax 等 |
| 实际可用 | 多数 **必须 BYOK**；登录后 **平台模式仅 DeepSeek/OpenAI** 服务端路由 |
| 套餐 | Pro **$4.99/¥19**，定价未覆盖多模型 API 成本 |
| 配额 | 按 **次/日** 计数，未区分模型单价 |

**产品决策（用户拍板）**：v1.5 起，云端模型 **统一走平台 Key**，用户 **不再自备 Key**；通过 **提高套餐价格** 覆盖模型成本，对标 Cursor「订阅内含 AI」。

---

## 决策

### D1 — 云端模型：平台 Key 唯一路径

**决定**：

- **登录用户** 使用 Chat / Agent / Tab（平台路径）时，一律经 **`/api/ai/*` 网关**，服务端持有各厂商 Key。
- **客户端不再保存、不再传输** 云端 Provider 的 API Key。
- **Ollama / 本地模型** 保留直连（无 Key、无计费），作为离线/隐私选项。

**不决定（v1.5 内）**：

- 企业私有化部署自带 Key（→ v1.6+ 可选「Enterprise BYOK 豁免」）。

### D2 — 支持的平台厂商（v1.5.0 目标）

| Provider ID | 厂商 | 服务端 env（示例） | 优先级 |
|-------------|------|-------------------|:------:|
| `openai` | OpenAI | `PLATFORM_OPENAI_API_KEY` | P0 |
| `deepseek` | DeepSeek | `PLATFORM_DEEPSEEK_API_KEY` | P0（已有） |
| `claude` | Anthropic | `PLATFORM_ANTHROPIC_API_KEY` | P0 |
| `google` | Google Gemini | `PLATFORM_GOOGLE_API_KEY` | P0 |
| `qwen` | 阿里通义 | `PLATFORM_QWEN_API_KEY` | P1 |
| `zhipu` | 智谱 GLM | `PLATFORM_ZHIPU_API_KEY` | P1 |
| `minimax` | MiniMax | `PLATFORM_MINIMAX_API_KEY` | P1 |
| `grok` | xAI | `PLATFORM_GROK_API_KEY` | P2（可选） |

各厂商 **adapter** 统一实现 `PlatformLlmAdapter`（chat · 可选 embed · stream）。

### D3 — BYOK 退场策略

| 阶段 | 行为 |
|------|------|
| **v1.5.0 GA** | 设置页 **移除** 云端 BYOK 入口；`keyMode` 固定 `platform`（Ollama 除外） |
| **迁移期（1 个小版本）** | 若检测到本地仍存 BYOK Key，toast 提示「已切换平台 AI，旧 Key 将不再使用」并清除 |
| **代码** | BYOK 直连路径 **保留 1 个版本** 于 feature flag `VITE_ALLOW_BYOK_LEGACY=false`（默认关），便于回滚 |

### D4 — 配额：从「次/日」到「加权额度」

**决定**：引入 **模型权重**（Model Weight），一次请求消耗 `ceil(weight)` 个配额单位。

|  tier | 示例模型 | 权重（草案） |
|------|----------|:------------:|
| **economy** | deepseek-v4-flash · gemini-flash · glm-4-flash | 1 |
| **standard** | gpt-4o-mini · claude-haiku · qwen-plus | 2 |
| **premium** | gpt-4o · claude-sonnet · gemini-pro | 5 |
| **frontier** | o3 · claude-opus · deepseek-r1 | 10 |

- Free：仅 **economy** 档 + 低日额度（如折合 **50 标准单位/日**）
- Pro：全档模型 + 高额度（如 **2000 标准单位/日**）
- Team：更高或 **-1（不限）** + 成本告警

**计量落库**：`usage/ai` 记录 `provider` · `model` · `weight` · `estimatedUsd`（仪表盘用，非法律账单）。

### D5 — 套餐调价（草案，F0 实施时写入 `plans.ts`）

> 目标：**订阅价 ≥ 预期 API 成本 + 毛利**；以下为 **内部草案**，上线前用 `platformUsageEstimate` 回测校正。

| 套餐 | 现定价 | **v1.5 草案** | 说明 |
|------|:------:|:-------------:|------|
| Free | $0 | $0 | 平台 AI 限 economy 模型 |
| Pro | $4.99 / ¥19 | **$9.99 / ¥39** | 全模型 · 加权配额 |
| Team | $12.99 / ¥49 | **$19.99 / ¥79** | 高配额 · 优先路由 |

- Stripe Price ID 需 **新建**（不覆盖旧订阅，旧客 grandfather 或邮件迁移）。
- 国内支付宝/微信同步调价。

### D6 — 与 Tab++ / Runtime 的关系

- Tab / FIM **平台路径** 与 Chat **共用网关与配额**（同一 `reserveAIUsage`）。
- Runtime Hook `run: agent` **必须** 走平台模型（禁止 Hook 内 BYOK）。
- Tab++ 不绑单一厂商：用户在设置中选 **默认模型**，Tab 继承（可 per-workspace 记忆）。

### D7 — 安全与合规

- 平台 Key **仅服务端**；禁止打入前端 bundle 或 `VITE_*`。
- 按用户 **RPM + 日配额** 硬限；异常熔断。
- 日志 **不存** 完整 prompt（可配置采样 debug）。

---

## 非目标（v1.5）

- 用户自带 Key 转售 / Key 池 marketplace
- 按 Token 精确后付费账单（v1.5 仍 **订阅制 + 配额**）
- 模型微调 / 私有部署

---

## 实现映射（F0）

| 模块 | 路径 |
|------|------|
| 厂商路由表 | `lib/api/aiGateway/platformCatalog.ts` |
| Adapter | `lib/api/aiGateway/adapters/*.ts` |
| 配额权重 | `lib/billing/modelWeights.ts` |
| 客户端模型 UI | `SettingsCenter` · 移除 BYOK |
| 套餐 | `lib/billing/plans.ts` |
| E2E | `e2e/platform-models.spec.ts` |

详见 [V1.5_F0_PLATFORM_MODELS.md](./V1.5_F0_PLATFORM_MODELS.md)。

---

## 开放问题

1. **旧 Pro 订阅** grandfather 还是强制迁移？→ 建议 **grandfather 3 个月**  
2. **Free 档** 是否允许 Claude/GPT？→ 建议 **仅 economy**  
3. **国内模型** 默认路由（Qwen vs DeepSeek）→ 按用户 locale / 延迟探测
