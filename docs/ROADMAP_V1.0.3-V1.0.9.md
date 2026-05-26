# 版本路线图 v1.0.3 — v1.0.9

> **基线**：**v1.0.2**（GA + 桌面 + 生产支付宝）— [V1.0.2_STATUS_SUMMARY.md](./V1.0.2_STATUS_SUMMARY.md)  
> **竞品参照**：[COMPETITOR_COMPARISON_V1.0.2.md](./COMPETITOR_COMPARISON_V1.0.2.md)  
> **原则**：**小步快发**（约 2～4 周/版，1 人主力）；`main` 持续可部署；桌面 tag 按需  
> **目标**：v1.0.9 综合分 **~2.75**，仍不追 Cursor 3.6 全替代

---

## 总览表

| 版本 | 主题 | 目标分 | 对标竞品能力 | 建议周期 |
|------|------|:------:|--------------|----------|
| **1.0.2** | GA + 4b + 发布 | **2.55** | 已发布 | ✅ |
| **1.0.3** | 运维与信任 | 2.57 | 合规/可观测 | 2 周 |
| **1.0.4** | 块级 Diff MVP | 2.62 | Cursor Composer / Cascade | 3～4 周 |
| **1.0.5** | Tab FIM 入门 | 2.68 | Cursor Tab++ lite | 2～3 周 |
| **1.0.6** | 索引第二档 | 2.72 | 三者 @ 检索 | 2～3 周 |
| **1.0.7** | Agent 工具链 | 2.74 | Windsurf 终端工具 | 1～2 周 |
| **1.0.8** | 任务清单 + 语义检索 | 2.75 | Kiro Spec 子集 | 2 周 |
| **1.0.9** | 国内可达 + 桌面 macOS | 2.75+ | 运营收官 | 2～3 周 |

---

## v1.0.3 — 运维与信任（「能放心收钱、能排障」）

### 目标

上线后第一周风险清零：观测、合规文案、文档与实现一致。

### 交付清单

| ID | 交付 | 验收 |
|----|------|------|
| 3-1 | 生产 `VITE_SENTRY_DSN` + release `ai-ide@1.0.3` | 测试事件进 Sentry |
| 3-2 | `payment.html` / `payment-en.html` 运营主体填齐 | 法务签字 |
| 3-3 | 同步 `BROWSER_LIMITATIONS.md`：浏览器 500 / 桌面 2000 / 索引 200·800 | 与 `indexLimits.ts` 一致 |
| 3-4 | Vercel Cron：`expire-subscriptions` 401 排查 | Cron 日志 200 |
| 3-5 | `docs/BILLING_RECONCILE_DAILY.md` 纳入周报模板 | 有单后连续 3 天对账 |
| 3-6 | 欢迎页/设置：网络慢时提示（vercel 备选说明） | 文案可见 |

### 非目标

- 不做新 AI 能力  
- 不做微信 live（可延 v1.0.9 评估）

### 发布

- Web：Vercel deploy  
- Tag：可选 `v1.0.3`（仅文档+env 可无桌面包）

### 竞品分变化

+0.02（合规/运维维度）

---

## v1.0.4 — 块级 Diff MVP（「像 Composer 那样接受改动」）

### 目标

缩小与 **Cursor Composer / Windsurf Cascade** 最大体验差：逐块接受/拒绝。

### 交付清单

| ID | 交付 | 验收 |
|----|------|------|
| 4-1 | `diffHunkService` 接 Agent `write_file` 结果 UI | 单文件多 hunk 展示 |
| 4-2 | 接受/拒绝/接受全部 | 3 文件场景 E2E 或手测 |
| 4-3 | 与 `autoApplyWrites` 联动：关=仅 hunk 预览 | 默认仍安全 |
| 4-4 | i18n + Agent 活动线展示 hunk 数 | 中英文 |
| 4-5 | 文档 `docs/PHASE_IDE5_DIFF.md` | 用户说明 |

### 依赖

- 现有 `diffHunkService.ts`、Agent apply 流程

### 非目标

- 不做 merge conflict 三向合并  
- 不做 IDE 内联 ghost diff（Tab 另版）

### 发布

- Web deploy 为主  
- CHANGELOG 突出「块级 Diff」

### 竞品分变化

Agent +0.15 → 综合 **~2.62**

---

## v1.0.5 — Tab FIM 入门（「补全更像 Copilot」）

### 目标

缩小 **Cursor Tab++ / Windsurf** 补全差距；不追满血 FIM 模型。

### 交付清单

| ID | 交付 | 验收 |
|----|------|------|
| 5-1 | 多行补全 prompt（前缀+后缀）或专用小模型路由 | 主观「跟手」 |
| 5-2 | 防抖/缓存调优（`inlineCompletionService`） | P95 延迟可接受 |
| 5-3 | 设置项：Tab 补全开/关、最大行数 | 设置可见 |
| 5-4 | DeepSeek/OpenAI 兼容 FIM API 探测与降级 | 无 Key 不报错 |

### 非目标

- 不做 Copilot++ 级跨文件 Tab  
- 不做本地小模型打包

### 竞品分变化

编辑 +0.2 → 综合 **~2.68**

---

## v1.0.6 — 索引第二档（「@ 更大仓」）

### 目标

对标三竞品 **@ / 检索** 入门：2k 文件、Worker 不卡 UI。

### 交付清单

| ID | 交付 | 验收 |
|----|------|------|
| 6-1 | `getMaxIndexFiles` 提到 **2000**（桌面）/ **500**（浏览器）可配置 | 常量+设置 |
| 6-2 | Web Worker 增量索引 + 断点续建 | 1k 文件中断可续 |
| 6-3 | @ 检索 P95 &lt;5s（1k 文件） | 手测+简单脚本 |
| 6-4 | 失败重试 toast + 索引状态 UI | 用户可见进度 |

### 代码锚点

- `projectIndexManager.ts`、`projectIndexService.ts`、`indexLimits.ts`

### 竞品分变化

索引 +0.25 → 综合 **~2.72**

---

## v1.0.7 — Agent 工具链增强（「能 grep、能跑测试」）

### 目标

对齐 **Windsurf/Cursor** 内置工具链；桌面优先。

### 交付清单

| ID | 交付 | 验收 |
|----|------|------|
| 7-1 | 新工具 `grep_repo`（ripgrep 逻辑或 fuse） | Agent 可搜正则 |
| 7-2 | `run_command` 桌面：项目根执行 + 输出截断 | `npm test` 有输出 |
| 7-3 | Agent system prompt 更新工具说明 | 少幻觉工具名 |
| 7-4 | 工具结果统一 `MAX_TOOL_OUTPUT` 审计 | 无 OOM |
| 7-5 | 单测 `executor.test.ts` 覆盖新工具 | CI 绿 |

### 非目标

- 不做 20 步自动工具链（Cascade Turbo）  
- 浏览器 WebContainer 不保证全部 shell 命令

### 竞品分变化

Agent/终端 +0.05 → 综合 **~2.74**

---

## v1.0.8 — 轻量 Spec + 语义检索默认（「有一点 Kiro，不全抄」）

### 目标

给 **Kiro Spec** 的轻量替代（任务清单）；拉近 @ 语义检索。

### 交付清单

| ID | 交付 | 验收 |
|----|------|------|
| 8-1 | `.aide/tasks.md` 或 UI 任务清单 + Agent 勾选 | 3 步任务可跟踪 |
| 8-2 | 语义检索：登录用户配额内默认开启（可关） | @ 语义命中提升 |
| 8-3 | **自定义域名** 生产（国内 CDN） | 电信/联通抽样可访问 |
| 8-4 | `APP_URL` / 桌面 `AI_IDE_APP_URL` 切域名 | 支付回调正确 |
| 8-5 | L16 全路径 toast（支付/工作区/Agent/索引） | 无静默失败 |

### 非目标

- 不做 Hooks 引擎  
- 不做 Cloud Agent

### 竞品分变化

协作/合规/索引 → 综合 **~2.75**

---

## v1.0.9 — 运营收官（「1.0 世代封板」）

### 目标

**v1.0.x 世代**封板：双平台桌面、文档齐全、对外可长期维护。

### 交付清单

| ID | 交付 | 验收 |
|----|------|------|
| 9-1 | Electron **macOS** portable（CI matrix） | M 系列可开 |
| 9-2 | 微信 live 评估：有商户则接，无则文档说明「支付宝-only」 | 决策记录 |
| 9-3 | GitHub Release `v1.0.9` + 发布公告（对齐 [GA_ANNOUNCEMENT](./GA_ANNOUNCEMENT.md) 更新） | Release 页 |
| 9-4 | `README` / `ROADMAP` / 竞品对比表更新到 1.0.9 | 无 1.0.2 过期表述 |
| 9-5 | `npm run go-live:preflight` + 可选 `p0:gate` 写入 release checklist | 脚本一键 |
| 9-6 | 竞品复评 → 更新 [COMPETITOR_COMPARISON](./COMPETITOR_COMPARISON_V1.0.2.md) | 分数 2.75 |

### 发布后

- 进入 **v1.1.0** 规划（后台任务队列 M0、协作 M1 等）— 见 [PLAN_STRATEGY_2026_Q3.md](./PLAN_STRATEGY_2026_Q3.md) 阶段 3

### 竞品分变化

维持 **~2.75**（运维+渠道+文档，非智能大跳）

---

## 多种情况下的版本选择（决策树）

```mermaid
flowchart TD
  A[接下来 2 周重点?] --> B{用户反馈最多?}
  B -->|支付/崩溃/连不上| C[v1.0.3 运维]
  B -->|Agent 改码不敢用| D[v1.0.4 Diff]
  B -->|补全太弱| E[v1.0.5 Tab FIM]
  B -->|@ 搜不到| F[v1.0.6 索引]
  B -->|国内访问慢| G[v1.0.8 域名]
  B -->|要 Mac 桌面| H[v1.0.9 macOS]
```

| 情况 | 建议跳版 | 说明 |
|------|----------|------|
| 仅 1 人、课业重 | 只做 **1.0.3** + **1.0.4**，其余顺延 | 保 Agent 体验 |
| 获客好、要留存 | **1.0.3** → **1.0.4** → **1.0.6** | Diff+索引比 Tab 更响 |
| 竞品舆论战 | 先 **1.0.4 Diff**，宣发对标 Cascade | 见对比文档 §7 |
| 企业询盘 | 停 **1.0.8** 任务清单 + 合规；不追 Kiro Hooks | |
| 资金紧 | 维持 1.0.2，只跑 **1.0.3** 免费项 | Sentry+文档 |

---

## 发布节奏（Git / Vercel / 桌面）

| 类型 | 规则 |
|------|------|
| **Web** | 每版合并 `main` → Vercel Production |
| **桌面 tag** | 仅 **1.0.4 / 1.0.6 / 1.0.9** 建议打 tag（壳或能力变化） |
| **CHANGELOG** | 每版一节，链接对应 PHASE 文档 |
| **竞品分** | 每 **2 版** 更新对比表 |

---

## 与 IDE-5 编号对照

| 原 IDE-5 ID | 映射版本 |
|-------------|----------|
| 5-1 块级 Diff | **v1.0.4** |
| 5-2 Tab FIM | **v1.0.5** |
| 5-3 索引 Worker | **v1.0.6** |
| 5-4 grep/run_cmd | **v1.0.7** |
| 5-5 L16 toast | **v1.0.8** |
| 5-6 任务清单 | **v1.0.8** |
| 5-7 语义检索 | **v1.0.8** |
| 5-8 自定义域名 | **v1.0.8** |

---

## 资源估算（1 人，累计）

| 区间 | 日历时间 | 备注 |
|------|----------|------|
| v1.0.3 | +2 周 | 可并行课业 |
| v1.0.4～1.0.7 | +10～12 周 | 核心智能债 |
| v1.0.8～1.0.9 | +4 周 | 运维+封板 |
| **合计** | **~4～5 个月** | 至 2026 Q4～2027 Q1 |

---

## 验收总门禁（每版发布前）

```powershell
npm run go-live:preflight
# 有 API 变更时：
npm run test:integration:local
# 有 UI 流程变更时：
npm run test:e2e -- --project=ui
```

---

## 文档维护

| 版本发布后更新 |
|----------------|
| `CHANGELOG.md` |
| `COMPETITOR_COMPARISON_V1.0.2.md`（或升版为 1.0.x） |
| `V1.0.2_STATUS_SUMMARY.md` → 届时改为 `V1.0.x_STATUS` 或新建 |
| `NEXT_EXECUTION.md` 指向当前版 |
