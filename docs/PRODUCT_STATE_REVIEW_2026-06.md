# AI IDE 产品状态深审与发光路径（2026-06）

> **范围**：v1.1.7 GA → v1.1.9 完成后的代码与路线复盘  
> **生产**：https://ai-ide-flame.vercel.app · tag `v1.1.9`

---

## 1. 我们已交付什么（事实）

### 1.1 世代能力矩阵

| 版本 | 用户可感知价值 | 工程锚点 |
|------|----------------|----------|
| **v1.1.7** | 浏览器/WebContainer/桌面 Node 调试：断点、栈、单步 | `debugAlphaService` · CDP · `DebugPanel` |
| **v1.1.8** | **平台 AI**（免 Key）+ **/signup** SEO + 注册 CTA | `POST /api/ai/chat` · `platformAiService` · 静态页 |
| **v1.1.8.x** | 插件/Tab 补全走平台；未登录 Chat 引导注册 | `isAiConfigured` · `pluginContext` |
| **v1.1.9** | **插件 SDK 2.0**：`ai.getMode` · `debug.getSummary` · 市场示例 | `PLUGIN_SDK_V2.md` · `sdk-v2-status` |

### 1.2 技术栈健康度（当前）

| 维度 | 状态 | 说明 |
|------|:----:|------|
| 单元/类型 | ✅ | `npm run test:local` 545+ |
| API 集成 | ✅ | Postgres + auth/workspace/jobs/collab |
| Web 构建 | ✅ | Vercel 对齐 `npm test` |
| 桌面 macOS CI | 🟡 | Python 3.11 + lockfile 已修；偶发 native 编译 |
| Collab E2E | 🟡 | 双浏览器 + Livekit；选择器与超时已加固 |
| 生产冒烟 | ✅ | 用户侧 smoke 5/5（需 env） |

### 1.3 差异化三角（已成型）

```text
        Plan / Specs / Reports
               ▲
              ╱ ╲
             ╱   ╲
    Agent ◀────────▶ 实时协作 (M1)
             ╲   ╱
              ╲ ╱
        平台 AI + BYOK 双轨
```

大型 IDE 往往 **单点极强**；我们的叙事是 **工作流融合**：计划 → Agent 改代码 → 可选协作房间 → 同一浏览器部署。

---

## 2. 代码层面要点（给维护者）

### 2.1 平台 AI 数据流

```text
Settings keyMode=platform + 已登录
  → aiService / platformAiService / agentChatCompletion
  → POST /api/ai/chat
  → consumeAiUsage + PLATFORM_DEEPSEEK_API_KEY
```

**关键文件**：`aiPlatformMode.ts` · `platformAiService.ts` · `lib/api/handlers/ai/chat.ts` · `lib/api/aiGateway/`

### 2.2 插件边界

- **SDK 1**：`ai.complete` only  
- **SDK 2**：+ `getMode` · `debug.getSummary`（`debug:read`）  
- 沙箱：`pluginSandboxRunner` 与 `createSandboxedContext` 权限对齐

### 2.3 仍开放的 patch（非阻塞 GA）

| 项 | 文档 | 建议 |
|----|------|------|
| 条件断点 | `ROADMAP_V1.1.7.x` 1.1.7.1 | v1.2 前或独立 patch |
| Watch 只读 | 1.1.7.4 | 同上 |
| 插件签名/市场 | `ROADMAP_V1.2.md` | 需 v1.1.8 生产稳定 2 周+ |

---

## 3. 本次计划收口（v1.1.8.x + v1.1.9）

| 项 | 状态 |
|----|:----:|
| v1.1.8.1～1.1.8.3 | ✅ |
| **v1.1.8.4** 设置页 `health.platformAi` | ✅ |
| v1.1.9 F1～F4 + tag | ✅ |
| CI lockfile / mac Python / integration 容错 | ✅ |
| Collab E2E 选择器 | ✅ `data-testid="collab-create-join-primary"` |

---

## 4. 产品如何「发光发亮」

### 4.1 对外一句话（建议统一）

**「开源、浏览器里的 AI 原生 IDE：免 API Key 即可 Chat/Agent，带协作房间与轻量调试。」**

### 4.2 三条增长飞轮

1. **可发现** — `/signup` · GSC · 欢迎页 CTA · 中文 SEO 文案（已做，持续优化收录与落地页转化）  
2. **零摩擦试用** — 平台 AI + 模板工作区 + 欢迎引导（`?auth=register`）  
3. **开发者扩散** — 插件 SDK 2.0 示例 + GitHub 开源 + 「装插件看 AI/调试状态」的演示视频

### 4.3 演示脚本（5 分钟投资人/用户）

1. 打开 `/signup` 注册 → 设置选 **平台 AI**（设置里可见服务状态绿条）  
2. Chat：「给 index.js 加一个 HTTP 服务」→ Agent 改文件  
3. 命令面板 → **实时协作** → 创建房间 → 第二浏览器只读加入  
4. F5 调试：断点暂停 → 看栈  
5. 插件市场安装 **SDK v2 状态** → 工具栏看 AI 模式与调试阶段  

### 4.4 接下来 30 天（建议优先级）

| 优先级 | 动作 | 目的 |
|:------:|------|------|
| P0 | 生产 env 常驻 + 每周 smoke | 平台 AI 口碑 |
| P0 | 1～2 篇中文教程（注册+平台 AI+协作） | SEO + B 站/公众号 |
| P1 | Collab E2E 在 CI 稳定绿 | 协作卖点可宣传 |
| P1 | 条件断点 MVP（1.1.7.1） | 调试故事完整 |
| P2 | v1.2 插件市场审核/签名草案 | 生态可信度 |

### 4.5 避免分散

- **不要** 同时开 DAP 全量、SSH、企业 SSO — 见 `ROADMAP_V1.2.md` 启动条件  
- **要** 把「平台 AI + 协作 + Agent」做成 **一条可复述的演示链路**

---

## 5. 雷达自评（v1.1.9 后）

| 维度 | 1～5 | 备注 |
|------|:----:|------|
| AI 原生 | 4 | 平台网关 + Agent + Tab/插件 |
| 协作 | 4 | M1 生产；E2E 加固中 |
| 编辑器 | 4 | Monaco + Git + 终端 |
| 扩展 | 3→4 | SDK 2.0 刚落地 |
| 部署 | 4 | Vercel + 自托管 API |
| i18n | 4 | Phase2 + ja bulk |

---

## 6. 文档索引（执行入口）

| 文档 | 用途 |
|------|------|
| [NEXT_EXECUTION.md](./NEXT_EXECUTION.md) | 下一迭代命令 |
| [ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) | B 轨总表 |
| [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) | 大拓展门槛 |
| [PLUGIN_SDK_V2.md](./PLUGIN_SDK_V2.md) | 插件作者 |
| [RELEASE_NOTES_v1.1.9.md](./RELEASE_NOTES_v1.1.9.md) | 发版说明 |

---

*本审阅随 v1.1.9 计划收口更新；下一 B 轨启动前建议复评本节雷达表。*
