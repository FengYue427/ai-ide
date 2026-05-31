# v1.1.6.x 补丁（Git 可视化抛光）

> **更新**：2026-05-29 — **1.1.6.x patch 线 ✅（1.1.6.1～1.1.6.8）**  
> **前置**：tag **`v1.1.6`**（B 轨 GA）  
> **并行 B 轨**：[V1.1.7_KICKOFF.md](./V1.1.7_KICKOFF.md)（调试器 MVP，不阻塞本线热修）

---

## 定位

v1.1.6.x 是 **轨道 A** 小 patch：在 v1.1.6 GA 后持续抛光 **Git UX / 性能 / i18n**，**不扩展**为完整 Git 客户端（PR、三向合并、submodule 仍属非目标）。

**节奏**：与 1.1.5.x 相同 — `test:local` → bump 第四段 → deploy；**不打** 新 B 轨 tag（对外仍 **v1.1.6**）。

---

## 已完成（P0～P1）

| 版本 | 主题 | 交付摘要 |
|------|------|----------|
| **1.1.6.1** | diff tab **截断** | ≤2000 行 / 512KB 每侧 · 编辑器提示条 |
| **1.1.6.2** | **staged diff** 热修 | `statusMatrix` 语义 · 无 HEAD / 暂存删除 / 新文件 |
| **1.1.6.3** | log **分页** | 50 条/页 · parent 续拉 · load more |
| **1.1.6.4** | Git **ja** | `empty.git` · `status.gitTitle` · `gitI18nJa` 全覆盖测试 |
| **1.1.6.5** | diff **布局** | 大行数/大体积自动 **inline** diff（`gitDiffLayout`）；截断仍为兜底 |
| **1.1.6.6** | 历史 **筛选** | 已加载 commit 客户端 filter（message / author / SHA / 路径*） |
| **1.1.6.7** | status **防抖** | 300ms debounce · **仅手动刷新** localStorage 开关 |
| **1.1.6.8** | **Electron git** spike | 本地文件夹只读 CLI `status`/`branch`；失败回退 isomorphic-git |

**1.1.6.x patch 线已收口**（2026-05-29）。后续 Git 大功能见 v1.1.7+ / v1.2。

---

## 前瞻 backlog（1.1.6.5～1.1.6.8 · 草案）

按 **价值 / 风险 / 与 v1.1.7 边界** 排序；开做前在 Kickoff 勾选。

| 版本 | 主题 | 说明 | 优先级 | 估时 |
|------|------|------|:------:|------|
| **1.1.6.8** | **Electron git** spike | 本地文件夹只读 `git status`（不替代 isomorphic-git 主路径） | P2 | 3～5d |

### 明确不做（留在 v1.1.7+ 或非 Git 线）

| 项 | 归属 |
|----|------|
| 断点 / 调试 attach | **v1.1.7** |
| PR / merge UI / 三向合并 | 长期 / 不做 |
| `git push` OAuth 流程大改 | v1.2 或独立 RFC |
| 替换 isomorphic-git 为桌面 CLI | 仅 1.1.6.8 **探索**，非承诺 |

---

## 1.1.6.5 细化（建议下一 patch）

**问题**：1.1.6.1 截断避免卡死，但用户仍可能打开「中等偏大」diff 感到卡顿。

**方向**（二选一或组合）：

1. **Monaco**：`renderSideBySide: false` 默认 inline diff（大文件）  
2. **分块**：仅加载 diff 前 N 行 +「在终端查看完整 diff」链接（与截断 banner 一致）

**DoD**：10MB 单文件 staged diff 打开 &lt; 3s 可交互；`test:local` 全绿。

---

## 1.1.6.6 细化

- 历史列表顶部：搜索框（filter 已加载 commits，不重新 walk 全 repo）  
- 可选：按文件路径过滤「包含 path 的 commit」（需按需 `git log -- path`，WebContainer 成本需 profiling）

---

## 1.1.6.7 细化

- `useGitStatus` / GitPanel `refresh`：**debounce** 文件保存风暴（如 300ms）  
- 已有 `shouldShowGitStatusPerfHint`：补充「跳过自动刷新，仅手动」开关（localStorage）

---

## 1.1.6.8 细化（P2 spike）

- Electron：检测工作区为本地目录时，**可选**调用 `git` CLI 只读 `status` / `branch`  
- 失败回退 isomorphic-git；文档记录限制（Windows PATH、无 git 安装）

---

## 发版检查

```bash
npm run test:local
# bump package.json 第四段
npm run deploy          # 可选
npm run smoke:report    # 部署后
```

**不** 创建 `v1.1.6.5` tag（除非团队约定 patch tag；默认仅第四段版本号 + CHANGELOG 小节）。

---

## 与 v1.1.7 边界

| 放 **1.1.6.x** | 放 **v1.1.7**（B 轨） |
|----------------|----------------------|
| Git UI、diff、log、i18n | **调试器** 面板 · gutter 断点 |
| status / refresh 性能 | variables · call stack · step |
| Electron git 只读探索 | WebContainer / 预览 **attach** 择一 |
| 热修 regression | 与 Run 按钮 / 终端执行链路集成 |

---

## 文档

| 文档 | 用途 |
|------|------|
| [V1.1.6_MASTER_PLAN.md](./V1.1.6_MASTER_PLAN.md) | B 轨 GA 归档 |
| [V1.1.7_KICKOFF.md](./V1.1.7_KICKOFF.md) | 下一 B 轨开波 |
| [NEXT_EXECUTION.md](./NEXT_EXECUTION.md) | 当前执行入口 |
