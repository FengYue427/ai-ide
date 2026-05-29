# v1.1.3 路线 B — AI 网关（平台额度）

> **状态**：**已推迟至 v1.2**（2026-05-29 拍板：v1.1.3 = 协作 A）  
> **实现入口**：[ROADMAP_V1.2.md](./ROADMAP_V1.2.md)  
> **主规划**：[ROADMAP_V1.1.md](./ROADMAP_V1.1.md) §4.3

---

## 1. 一句话

**Pro 用户可不填 API Key**，通过服务端转发 DeepSeek/通义等完成 Chat；用量计入现有 `usage/ai` 配额；超额 429，并保留 **BYOK** 路径。

---

## 2. 范围

### 做

| 项 | 说明 |
|----|------|
| 模型路由 | `provider` → 上游 endpoint + 平台 Key |
| 配额 | 复用/扩展 `usageService`；Free 限量 / Pro 放宽 |
| 客户端 | 设置中心「平台 AI / 自带 Key」切换 |
| 风控 | 单用户 RPM、异常熔断、成本日志 |
| 透明 | 响应头或 meta 标明 `billing: platform \| byok` |

### 不做

- 后台 Agent 自动走平台 Key（可 v1.1.3.1 小 patch，非 MVP）
- 多模型同时并发网关（单轮 Chat 优先）
- 企业专属模型托管  

---

## 3. 阶段 F1～F5

| 阶段 | 交付 | 估时 |
|------|------|------|
| **F1** | 路由配置、`lib/api/aiGateway/` 骨架、`POST` 鉴权 | 3～5d |
| **F2** | Chat 完成路径走网关；单元 + integration 429 | 5～7d |
| **F3** | 设置 UI + i18n；Free/Pro 文案 | 3d |
| **F4** | 成本仪表盘（admin 可选）、E2E 无 Key 冒烟 | 3～5d |
| **F5** | CHANGELOG、`RELEASE_NOTES_v1.1.3.md`、tag | 2～3d |

**内部 patch 映射（留档）**：F1→1.1.3.1，F2→.2，…，F5→.5

---

## 4. API 草案

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/chat` | 已有；增加 `usePlatformKey: true` body 字段 |
| GET | `/api/usage/ai` | 已有；返回 `platformRemaining` |
| — | 环境变量 | `PLATFORM_DEEPSEEK_API_KEY` 等 |

---

## 5. 验收

- [ ] 无 Key 的 Pro 账号完成 1 轮 Chat  
- [ ] 达到日限额后 429，UI 提示升级或 BYOK  
- [ ] BYOK 用户不受影响（回归 `test:integration` + smoke）  
- [ ] 平台 Key 不落客户端 bundle（仅服务端）  

---

## 6. 风险

| 风险 | 缓解 |
|------|------|
| 模型账单超支 | 硬日限额 + 告警 |
| 上游 5xx | 重试 1 次 + 友好错误 |
| 与后台 Agent 重复计费 | 网关仅 Chat；Agent 仍 BYOK 直到单独设计 |
