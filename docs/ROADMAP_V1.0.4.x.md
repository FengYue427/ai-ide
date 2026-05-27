# 1.0.4.x 附属路线图（1.0.4.1 → 1.0.4.4）— GA 后 stabilization

> **前置**：主版本 **[v1.0.4 GA](./V1.0.4_GA_EXECUTION.md)** ✅  
> **总规划**：[V1.0.4.x_MASTER_PLAN.md](./V1.0.4.x_MASTER_PLAN.md)  
> **版本策略**：[VERSIONING.md](./VERSIONING.md) · **短规划**：[PLAN_SHORT_V1.0.3-V1.0.4.md](./PLAN_SHORT_V1.0.3-V1.0.4.md) §4  
> **下一世代**：**v1.1** → [ROADMAP_V1.1.md](./ROADMAP_V1.1.md)

---

## 0. 与 1.0.4 GA 的关系

**1.0.4 GA** 已并入原 **E1（MCP）+ E2（感知）** 主体代码。  
**1.0.4.x 四级** = 在 GA 之上的 **深化验收（.1/.2）+ 检索体验（.3）+ 世代收官（.4）**，模式同 [ROADMAP_V1.0.3.x.md](./ROADMAP_V1.0.3.x.md)。

---

## 1. 四级总览

| 版本 | 代号 | 状态 | 主题（一句话） | 建议 tag |
|:----:|------|:----:|----------------|----------|
| **1.0.4** | — | ✅ **GA** | 体验巩固 · 竞品 **~2.80** 初评 | `v1.0.4` |
| **1.0.4.1** | **E1′ MCP 深化** | ⏳ | 生产 smoke、proxy 文档、目录 FAQ | 合并 → `v1.0.4.2` |
| **1.0.4.2** | **E2′ 感知深化** | ⏳ | 手测用例、非 Cascade 话术、可选 UX | **`v1.0.4.2`** |
| **1.0.4.3** | **E3 检索** | ⏳ | 语义/@ 引导、索引 UX、i18n | 合并 → `v1.0.4.4` |
| **1.0.4.4** | **E4 收官** | ⏳ | 发布矩阵、live、milestone · **2.80 终稿** | **`v1.0.4.4`** |

> **1.0.4.x 世代在 1.0.4.4 结束后不再新增第四段**（除非 hotfix）；下一主规划为 **v1.1**。

---

## 2. 1.0.4.1 — E1′ MCP 深化

> **GA 已有**：`mcpOfficialCatalog.ts`、`McpSettingsSection` 官方推荐区、ping 测试。  
> **执行**：[V1.0.4.1_EXECUTION.md](./V1.0.4.1_EXECUTION.md) · [MCP_OFFICIAL_CATALOG.md](./MCP_OFFICIAL_CATALOG.md)

| ID | 交付 | 验收 |
|----|------|------|
| 4.1-1 | 生产 **`/api/mcp/proxy`** smoke 记录 | `dev:stack` + 1 条公网 HTTPS（若有） |
| 4.1-2 | 可选脚本 `npm run mcp:smoke` | CI 或本地文档命令 |
| 4.1-3 | MCP 故障 FAQ（CORS、localhost、401） | 并入 [MCP_OFFICIAL_CATALOG.md](./MCP_OFFICIAL_CATALOG.md) §故障 |
| 4.1-4 | [PHASE_IDE4_CURSOR_PARITY.md](./PHASE_IDE4_CURSOR_PARITY.md) MCP 行更新 | 竞品表 **○** 终验 |
| 4.1-5 | Agent `<<<mcp-tool>>>` 手测 1 条 | Chat 记录或截图入档 |

**非目标**：stdio MCP、新 MCP 传输协议、Server 市场后台。

---

## 3. 1.0.4.2 — E2′ 感知深化

> **GA 已有**：`agentContextService`、`terminalContextService`、Agent 设置开关、活动行 hunk。  
> **执行**：[V1.0.4.2_EXECUTION.md](./V1.0.4.2_EXECUTION.md)

| ID | 交付 | 验收 |
|----|------|------|
| 4.2-1 | 手测：焦点文件 + 终端注入各 1 条 | 测试记录 |
| 4.2-2 | 对外话术「非 Cascade」统一 | COMPETITOR + CSDN 一致 |
| 4.2-3 | **Could**：Agent 结束后保留活动摘要条（只读） | UX PR 或文档标注「仅运行时」 |
| 4.2-4 | 设置 → Agent 区增加「感知说明」折叠文案 | i18n 中英 |

**非目标**：全仓编辑历史、LSP 符号流、Windsurf 级实时感知。

---

## 4. 1.0.4.3 — E3 检索（@ 与语义）

> **基线已有**：索引 Worker、Chat 内重试按钮、语义开关、`@` 提及。  
> **执行**：[V1.0.4.3_EXECUTION.md](./V1.0.4.3_EXECUTION.md) · [SEMANTIC_SEARCH_ONBOARDING.md](./SEMANTIC_SEARCH_ONBOARDING.md)

| ID | 交付 | 验收 |
|----|------|------|
| 4.3-1 | **语义 onboarding**：无 Key / 未开开关时设置页引导 | [SEMANTIC_SEARCH_ONBOARDING.md](./SEMANTIC_SEARCH_ONBOARDING.md) |
| 4.3-2 | **@ 引导**：首次导入 ≥10 文件后 Chat 轻提示 | 可 dismiss、localStorage |
| 4.3-3 | 索引失败：设置页「索引与 @」卡片 + 重试 | 与 Chat 重试行为一致 |
| 4.3-4 | 索引上限说明（500/2000）链到 [BROWSER_LIMITATIONS.md](./BROWSER_LIMITATIONS.md) | 设置页链接 |
| 4.3-5 | i18n 抽测：Agent/MCP/索引/语义 关键路径无硬编码 | 中英对照表 PR |
| 4.3-6 | **Could**：索引 building 时禁用 `@` 并提示 | 减少半成品索引 |

**非目标**：向量库后端、全仓 embedding 常驻、索引上限改为 5000。

---

## 5. 1.0.4.4 — E4 沟通与 1.0.4.x 收官

> **执行**：[V1.0.4.4_EXECUTION.md](./V1.0.4.4_EXECUTION.md)

| ID | 交付 | 验收 |
|----|------|------|
| 4.4-1 | [publish/](./publish/) 矩阵升至 **1.0.4.4** | CSDN + 掘金 ≥2 |
| 4.4-2 | `rc:live-spotcheck` 附录（日期 + 版本） | [RC_LIVE_SPOTCHECK_LAST.md](./RC_LIVE_SPOTCHECK_LAST.md) 人工 5/5 |
| 4.4-3 | README / ROADMAP 顶栏 **1.0.4.4** 或「1.0.4.x 已收官」 | PR |
| 4.4-4 | 竞品 **2.80** 终稿（修订 §3 表，非仅 §0.1） | COMPETITOR 文档 |
| 4.4-5 | 关闭 GitHub **1.0.4.x** milestone | — |
| 4.4-6 | GitHub Release **`v1.0.4.4`**（Web；桌面同 tag 或说明无差分） | Release Notes |
| 4.4-7 | **可选** Discussions：1.0.4.x 收官 + v1.1 征求意见 | 链接 [V1.1_RFC_STUB.md](./V1.1_RFC_STUB.md) |

---

## 6. 全局非目标（1.0.4.x 整段）

Background Agent · Cascade 全感知 · Kiro Hooks · VSIX · DAP · Tab++ · 微信 live · 索引/工具大规模扩张。

---

## 7. 评分路线图

| 时点 | AI IDE 分 | 说明 |
|------|:---------:|------|
| 1.0.4 GA | **~2.80** | MCP、rules、感知入门（§0.1） |
| **1.0.4.4 收官** | **~2.80 固化** | E3 检索体验入档 + live 抽测 |
| v1.1 目标 | **~2.90** | 见 [ROADMAP_V1.1.md](./ROADMAP_V1.1.md) |
| Cursor 参照 | 3.60 | 差 **~0.8** |

---

## 8. CHANGELOG / 发包

- 每一附属：`CHANGELOG [1.0.4.N]`
- `package.json` / `getReleaseVersion()` / Sentry `ai-ide@1.0.4.N` 对齐
- 发版前：`test:local` · `go-live:preflight` · `rc:live-spotcheck`

---

## 9. 快速命令

```powershell
npm run test:local
npm run go-live:preflight
npm run rc:live-spotcheck
npm run ops:verify-p1
# E1 待建
# npm run mcp:smoke
```

---

## 10. 文档索引

| 文档 | 用途 |
|------|------|
| [V1.0.4.x_MASTER_PLAN.md](./V1.0.4.x_MASTER_PLAN.md) | 世代总规划 |
| [V1.0.4.1_EXECUTION.md](./V1.0.4.1_EXECUTION.md) | E1′ |
| [V1.0.4.2_EXECUTION.md](./V1.0.4.2_EXECUTION.md) | E2′ |
| [V1.0.4.3_EXECUTION.md](./V1.0.4.3_EXECUTION.md) | E3 |
| [V1.0.4.4_EXECUTION.md](./V1.0.4.4_EXECUTION.md) | E4 |
| [SEMANTIC_SEARCH_ONBOARDING.md](./SEMANTIC_SEARCH_ONBOARDING.md) | E3 语义规格 |
| [NEXT_EXECUTION.md](./NEXT_EXECUTION.md) | 当前周 |
