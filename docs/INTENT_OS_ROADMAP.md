# Intent OS 路线图

**定位**：避开 Trae 的 Chat/Builder/SOLO 路线，以 **意图 → 规格 → 验收 → 证明** 为产品中心。

---

## Tier S — 备案前 MVP ✅

**验收**：Welcome 一键 Demo → Chat 跑 1 关队列 → acceptance 未过则暂停 → Intent Graph 可见 → Drift 告警 → 报告可保存。

| 编号 | 能力 | 状态 | 关键路径 |
|------|------|:----:|----------|
| S5 | Vibe→Spec | ✅ | `vibeToSpecService.ts` · ChatMessageActions |
| S4 | 验收优先队列 | ✅ | `useChatSendOrchestrator` · `SpecVerificationQueueList` |
| S3 | Grounding Gate | ✅ | `groundingGateService.ts` · `runtimeQueueCoordinator` |
| S1 | Intent Graph | ✅ | `intentGraphService.ts` · `IntentGraphPanel` |
| S2 | Drift Radar | ✅ | `specDriftService.ts` · SpecCatalog |
| B6 | 60 秒 Demo 闭环 | ✅ | `demo-onboarding` · Welcome 一键启动 |

---

## Tier SL — 骨架补全 ✅

**目标**：让 Tier S 在 stub/无 Plan 链接时仍可演示，队列失败态与 Drift 数据一致。

| 编号 | 能力 | 状态 | 说明 |
|------|------|:----:|------|
| SL-1 | Graph 无 links 回退 | ✅ | `listSpecTasksPaths` 仍渲染 Spec / acceptance 节点 |
| SL-2 | stub 验收写 activeSpecPath | ✅ | `runtimeQueueCoordinator` 验收通过后同步状态 |
| SL-3 | 队列 verify / failed 态 | ✅ | `verifyingSpecBackfill` + `stage: 'failed'` |
| SL-4 | Grounding 失败可感知 | ✅ | Activity Line `grounding.block` + 队列 banner |
| SL-5 | E2E 回归 | ✅ | `e2e/intent-os-sl.spec.ts` |
| SL-6 | Drift 单测 + i18n | ✅ | `specDriftService.test.ts` · drift 文案 i18n |

**SL 验收**：内测 IP 无人指导走完 60 秒 Demo + Graph 非空 + 验收失败可复现暂停。

---

## Tier SM — Demo 可信度 ✅

**目标**：减少手工勾选与 `window.prompt`，让 60 秒 Demo 更像产品而非骨架。

| 编号 | 能力 | 状态 | 关键路径 |
|------|------|:----:|----------|
| SM-1 | Demo 一键标记本关 | ✅ | `intentDemoAcceptanceService` · `IntentDemoVerifyBanner` |
| SM-2 | Promote 小面板 | ✅ | `PromoteToSpecModal` · 可选跑第一关 / 开 Spec Studio |
| SM-3 | 验收后引导保存 report | ✅ | `useChatSendOrchestrator` · toast 引导 |
| SM-4 | Drift 快捷入口 | ✅ | SpecCatalog banner → tasks / acceptance |
| SM-5 | Intent Graph 入口 | ✅ | StatusBar · 队列区 · `openSettingsToIntentGraph` |

### 60 秒演示路径（内测 IP · Tier SM）

1. Welcome → **从 Intent 演示开始**（自动创建 Spec + 入队 + 打开 Chat）
2. Agent 完成 `src/demo.ts` 的 greet 任务
3. 队列 **待验收** → 点 **一键标记本关完成**（或手动勾选 `acceptance.md`）
4. Toast 提示 → 队列面板 **保存到 .aide/reports**
5. StatusBar / 队列 **意图图谱** → 查看 Spec / acceptance 溯源

### 原 Tier S 演示路径（仍可用）

1. Welcome → **从 Intent 演示开始**（自动创建 Spec + 入队 + 打开 Chat）
2. Agent 完成 `src/demo.ts` 的 greet 任务
3. 队列进入 **待验收** → 勾选 `acceptance.md` 后通过
4. 设置 → **意图图谱** 查看 Spec / acceptance 节点
5. 队列面板 → **保存到 .aide/reports**

---

## Tier A — 备案后加深 🔨

**建议顺序**：A1 → A6 → A2 → A3 → A4 → A5（A3 与 B2 Spec Studio 2.0 合并交付）

| 编号 | 能力 | 状态 | 关键路径 |
|------|------|:----:|----------|
| A1 | Proof-of-Done Report | ✅ | `proofOfDoneReportService.ts` · 队列「保存证明包」 · `e2e/intent-os-a1.spec.ts` |
| A6 | Share Intent | ✅ | `intentShareSnapshotService.ts` · ShareModal Intent 快照 |
| A2 | Spec Packs | ✅ | `course-capstone` 模板（课设/竞赛向） |
| A3 | Intent Formalization Wizard | ✅ | 三步向导（意图 → 模板 → 预览） · `SpecStudioPanel` · `intentFormalizationService.ts` |
| A4 | Template Preview | ✅ | 预览统计 + 四件套 tab · `e2e/intent-os-a3.spec.ts` |
| A5 | Inline 四件套编辑 | ✅ | 创建前 inline 编辑 requirements/design/tasks/acceptance |

### A1 证明包内容

- Markdown + HTML 双文件（`.aide/reports/proof-{spec}-*.md/html`）
- 已完成 tasks · acceptance 验收输出 · 引用文件快照 · Intent Graph JSON

### A6 分享快照

- 生成分享时可选附带 `.aide/meta/intent-share.json`
- 含 Spec 进度（done/total）与 `buildIntentGraph` 快照

---

## Tier B — 体验精美化 ✅

| 编号 | 能力 | 状态 | 关键路径 |
|------|------|:----:|----------|
| B1 | Unified Intent Shell | ✅ | 左 Graph · 中 Editor · 右 Queue · `IntentShellLeftRail` · `IntentShellQueueRail` · `IntentShellBar` |
| B2 | Spec Studio 2.0 | ✅ | 模板预览 + inline 四件套编辑（见 A3/A4/A5） |
| B4 | Acceptance Editor | ✅ | acceptance 结构化 UI + 一键跑验收 · `AcceptanceEditorModal` |

### B1 Shell 布局

- **左栏**：`IntentGraphPanel`（shell 变体）· 节点点击打开文件 / acceptance
- **顶栏**：当前 Spec · 队列阶段 · Drift 快捷 · 保存证明包
- **右栏**：`TaskQueuePanel` 独立展示（Chat 内队列在 Shell 开启时隐藏）
- **E2E**：`e2e/intent-os-b1.spec.ts`

---

## Tier C — Intent OS 独有创新 ✅

| 编号 | 能力 | 状态 | 关键路径 |
|------|------|:----:|----------|
| C1 | Intent Replay | ✅ | 证明包 Graph overlay · 恢复队列/打开证明包 · `intentReplayGraphOverlay` |
| C2 | Share Intent Import | ✅ | 项目导入自动聚焦 · Share 粘贴预览 +「应用 Intent 焦点」 |
| C3 | Drift Resolution | ✅ | Shell 顶栏多动作（tasks/acceptance/requirements/proof） |
| C4 | Grounding Gate v2 | ✅ | 符号校验 · Shell/队列 i18n 提示 · `groundingGateV2: true` |
| C5 | Intent Graph 2.0 | ✅ | 未完成任务高亮 · Autopilot 下一关节点标记 · `intent-graph-node--next` |
| C6 | Autopilot Lite | ✅ | `useAutopilotLite` · Shell/StatusBar「Autopilot · 下一关」 |

**Tier C 开关**：`src/lib/intentOsTierC.ts`（逐项开启 C4–C6）

---

## 明确不做（Trae 赛道）

Builder 一句话全栈 · SOLO 黑盒交付 · Cue/Tab 主卖点 · 免费模型补贴战

---

## 相关文档

- [PLAN_SYSTEM_QUICKSTART.md](./PLAN_SYSTEM_QUICKSTART.md)
- [CN_LAUNCH_P0.md](./CN_LAUNCH_P0.md)
