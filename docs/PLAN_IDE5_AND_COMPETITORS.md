# IDE-5 与竞品路线图 — 对标 Cursor / Kiro / Windsurf

> **日期**：2026-05-26  
> **前置**：D3 GA ✅ · IDE-4b 代码 ✅ · 4b-5 自动更新 ✅  
> **矩阵**：[COMPETITOR_MATRIX_2026-05.md](./COMPETITOR_MATRIX_2026-05.md)

---

## 1. 战略定位（不变）

**不做**「第四个 VS Code AI  fork」。  
**要做**：国内可付费的 **浏览器 Cursor 入门版** + 可选 **桌面壳**（大仓 + 真终端）。

对外一句话：

> 在浏览器里完成 Cursor/Windsurf **Agent 入门档 ~70%**，加上支付宝与 BYOK；桌面版补齐终端与大文件夹。

---

## 2. 竞品差距 → IDE-5 映射

| 竞品能力 | Cursor | Kiro | Windsurf | **IDE-5 对应** | 验收 |
|----------|--------|------|----------|----------------|------|
| Composer 块级 apply | ●●● | ●● | ●●● | **5-1 块级 Diff** | 3 文件逐 hunk 接受 |
| Copilot++ / 多行 Tab | ●●● | ●● | ●●● | **5-2 Tab FIM** | 多行补全主观可用 |
| @ 全仓检索 | ●●● | ●● | ●●● | **5-3 索引 Worker** | 2k 文件 @ <5s P95 |
| 终端工具链 | ●●● | ●●● | ●●● | **5-4 grep + run_cmd** | Agent 跑测试（桌面） |
| Spec / Hooks | — | ●●● | ● | **不追**；可选 5-6 任务清单 | — |
| Cascade 实时感知 | — | — | ●●● | **部分**：活动线 + 终端输出注入 | 文档诚实边界 |
| 云后台 Agent | ●●● | ●●● | ●●（Devin） | **2027 队列** | — |

---

## 3. IDE-5 工作包（建议顺序）

### 阶段 2a — 体验第二档（2026 Q4 ～ 2027 Q1）

| ID | 交付 | 工时（估） | 竞品收益 |
|----|------|------------|----------|
| **5-1** | 块级 Diff + hunk 接受/拒绝 | 3～4 周 | vs Cursor Composer、Windsurf Cascade |
| **5-2** | Tab FIM 或专用小模型 | 2～3 周 | vs Cursor Tab++ |
| **5-3** | 索引 Worker + 断点续建 | 2～3 周 | vs 三者 @ 检索 |
| **5-4** | `grep` + 桌面 `run_terminal_cmd` 工具 | 1～2 周 | vs Windsurf 工具链 |
| **5-5** | L16 全路径 toast（支付/工作区/Agent） | 1 周 | 运营质量，非竞品分 |

**建议并行**：5-5 可与 5-1 穿插；**5-1 先于 5-2**（Agent 闭环价值更大）。

### 阶段 2b — 可选（2027 Q1）

| ID | 交付 | 说明 |
|----|------|------|
| 5-6 | **轻量任务清单**（非 Kiro Spec） | Markdown  checklist + Agent 勾选，不做 Hooks 引擎 |
| 5-7 | 语义检索默认开（配额内） | 缩小 @ 差距 |
| 5-8 | 自定义域名 + 国内 CDN | 解决 vercel.app 访问；桌面 remote shell 同源 |

---

## 4. 与三竞品「并排话术」

| 维度 | Cursor | Kiro | Windsurf | **AI IDE** |
|------|--------|------|----------|------------|
| 谁买单 | 海外 Pro USD | AWS 企业 | USD Pro ~$10 | **¥19 支付宝** |
| 怎么开始 | 下载安装 | 下载 + AWS | 下载 | **打开浏览器** |
| Agent | Composer 最强 | Spec 最规范 | Cascade 最跟手 | **工具 Agent 够用** |
| 适合 | 专业全栈 | AWS 团队 | Agent 重度 | 国内个人/小仓/课堂 |

**不要说**：比 Cursor/Kiro/Windsurf 更强。  
**要说**：入门 Agent + 国内付费 + 可选桌面大仓。

---

## 5. 资源节奏（1 人主力）

| 时间 | 主线 | 竞品目标分 |
|------|------|------------|
| **2026 Q3** | 4b 验收 + GA 运维 + 自定义域名调研 | ~2.55 |
| **2026 Q4** | IDE-5-1 块级 Diff | ~2.65 |
| **2027 Q1** | 5-2 Tab + 5-3 索引 | **~2.75** |
| **2027 H2** | 后台任务队列 M0 | ~3.0 |

---

## 6. 桌面发布与 4b-5 运维

| 动作 | 命令 / 触发 |
|------|-------------|
| 本地打包 | `npm run electron:pack` |
| 发布到 GitHub Releases | `git tag v1.0.1 && git push origin v1.0.1` → [desktop-release.yml](../.github/workflows/desktop-release.yml) |
| 手动发布 | `GH_TOKEN=... npm run electron:publish` |
| 用户检查更新 | 打包版 **Help → Check for Updates**（12s 后自动检查） |
| 便携版失败回退 | 打开 GitHub Releases 页手动下载 |
| 壳崩溃日志 | `%APPDATA%/ai-ide/desktop-crash.log` |
| Web 崩溃 | `VITE_SENTRY_DSN`（与 `ai-ide@<version>` release 对齐） |

**Remote shell 说明**：UI 仍从 Vercel 拉取；**electron-updater 只更新壳**（preload/终端/fs）。前端发版仍走 Vercel，与桌面 tag 解耦。

---

## 7. 决策点

| # | 问题 | 建议 |
|---|------|------|
| 1 | IDE-5 先 Diff 还是先 Tab？ | **先 5-1 Diff** |
| 2 | 是否做 Kiro 式 Spec？ | **否**；最多 5-6 任务清单 |
| 3 | 是否接 Windsurf 式 Devin？ | **否**（2027 自研队列） |
| 4 | 桌面默认 remote vs offline？ | **remote**（登录/支付） |
| 5 | GA+6 月目标分 | **~2.75**（不追 3.45 Windsurf） |
