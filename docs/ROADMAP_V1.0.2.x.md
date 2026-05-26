# 1.0.2.x 附属路线图（1.0.2.1 → 1.0.2.7）

> **主版本**：**1.0.2** GA，见 [V1.0.2_STATUS_SUMMARY.md](./V1.0.2_STATUS_SUMMARY.md)  
> **版本策略**：[VERSIONING.md](./VERSIONING.md)  
> **收官主版本**：[ROADMAP_V1.0.3.md](./ROADMAP_V1.0.3.md)（1.0.2.x 全部完成后冲击）  
> **竞品**：[COMPETITOR_COMPARISON_V1.0.2.md](./COMPETITOR_COMPARISON_V1.0.2.md)

---

## 总览

| 版本 | 状态 | 主题 | 竞品分 |
|------|:----:|------|:------:|
| **1.0.2** | ✅ | GA + 支付 + 桌面端 | 2.55 |
| **1.0.2.1** | ✅ 已发 | 运维与信任 | 2.57 |
| **1.0.2.2** | ✅ 已发 | 块级 Diff | 2.62 |
| **1.0.2.3** | ✅ 已发 | Tab FIM 入门 | 2.68 |
| **1.0.2.4** | ✅ 已发 | 索引第二档 | 2.72 |
| **1.0.2.5** | ✅ 已发 | Agent 工具链 | 2.74 |
| **1.0.2.6** | ✅ 已发 | 任务清单 + 域名 + Toast | 2.75 |
| **1.0.2.7** | 📋 | macOS 构建 + 1.0.2 收官 | 2.75 |
| **1.0.3** | 规划中 | 主版本收官 | 2.75+ |

---

## 1.0.2.5 — Agent 工具链 ✅

见 [PHASE_V1.0.2.5_AGENT_TOOLS.md](./PHASE_V1.0.2.5_AGENT_TOOLS.md)。

| ID | 内容 |
|----|------|
| 2.5-1 | `grep_repo` |
| 2.5-2 | `run_command` 安全策略 + 桌面/Web |
| 2.5-3 | system prompt 工具说明 |
| 2.5-4 | `MAX_TOOL_OUTPUT` 落地 |

---

## 1.0.2.6 — 任务清单 + 域名 + Toast ✅

见 [PHASE_V1.0.2.6_TASKS_DOMAIN.md](./PHASE_V1.0.2.6_TASKS_DOMAIN.md)。

| ID | 内容 |
|----|------|
| 2.6-1 | `.aide/tasks.md` + UI 预览 |
| 2.6-2 | [CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md) |
| 2.6-3 | 欢迎页 + `APP_URL` / origin |
| 2.6-4 | L16 配额 toast |

---

## 1.0.2.7 — 1.0.2 附属收官

| ID | 内容 |
|----|------|
| 2.7-1 | Electron macOS CI |
| 2.7-2 | 竞品 live 对比补全 |
| 2.7-3 | Release `v1.0.2.7`（可选 tag） |
| 2.7-4 | README/ROADMAP 对齐终稿 |

完成后进入 **[ROADMAP_V1.0.3.md](./ROADMAP_V1.0.3.md)**。

---

## 发布节奏

| 渠道 | 说明 |
|------|------|
| Web | 合并 `main` 后 Vercel 自动部署 |
| 桌面 tag | **1.0.2.7** 可选打 tag |
| `package.json` | `1.0.2.N` 随附属递增 |

```powershell
npm run go-live:preflight
```
