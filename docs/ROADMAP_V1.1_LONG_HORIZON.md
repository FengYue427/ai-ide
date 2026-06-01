# v1.1.x 长期路线（1.1.5 → 1.1.9.x）

> **更新**：2026-05-29 — **v1.1.6 GA** · **1.1.6.x 前瞻** · **v1.1.7 调试器规划**  
> **北极星**：**多维度、创新式** 比肩大型 IDE，而非单一竞品分数或硬性功能表对打。

---

## 1. 能力雷达（参照维度）

大型 IDE 作为 **参照系**，我们在以下轴上持续投入：

| 维度 | AI IDE 差异化 | 大型 IDE 参照 |
|------|---------------|---------------|
| **AI 原生** | Agent、Plan、Inline、BYOK 一体 | Copilot / Cursor 类 |
| **协作** | Livekit + Yjs、轻量房间、浏览器即用 | Live Share / CodeTogether |
| **编辑器** | Monaco + LSP、轻量可部署 | VS Code / JetBrains |
| **扩展** | 插件目录、后续 SDK | VSIX / 插件生态 |
| **部署** | Vercel + Neon、开源可自托管 | 桌面安装包为主 |
| **国际化** | Phase 2+ 多语言 | 成熟 10+ 语言 |

每版 GA 后更新 **雷达记录**（定性 + 可选 1～5 自评），**不设**「到 2.90 即停」类硬指标。

---

## 2. B 轨里程碑（草案）

| 对外 tag | 主题 | 轨道 | 状态 |
|----------|------|:----:|:----:|
| **v1.1.3** | 协作 M1 | B | ✅ |
| **v1.1.4** | 编辑器深度 + UX 跃迁 + i18n Phase 2 | B | ✅ [RELEASE_NOTES_v1.1.4.md](./RELEASE_NOTES_v1.1.4.md) |
| **v1.1.5** | **终端 + 任务**（集成 shell、npm scripts 面板） | B | ✅ [RELEASE_NOTES_v1.1.5.md](./RELEASE_NOTES_v1.1.5.md) |
| **v1.1.6** | **Git 可视化**（diff、stage、log 基础） | B | ✅ [RELEASE_NOTES_v1.1.6.md](./RELEASE_NOTES_v1.1.6.md) |
| **v1.1.7** | **调试器 MVP**（Node / WebContainer attach 优先） | B | ✅ [RELEASE_NOTES_v1.1.7.md](./RELEASE_NOTES_v1.1.7.md) |
| **v1.1.8** | **平台 AI + 注册 SEO + 调试 patch** | B | ✅ tag `v1.1.8` |
| **v1.1.8.x** | 平台 AI 抛光（插件/Tab/登录提示） | A | 🚧 |
| **v1.1.9** | **插件 SDK 2.0** + 市场示例 | B | ✅ 待 tag |
| **v1.2+** | 多根工作区 · SSH · DAP 深化 · 企业 | B | 📋 见 [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) |

每个 B 轨版本配套 **1.1.N.x** patch 线（轨道 A），用于热修与小抛光。

**平台 AI 网关**已并入 **v1.1.8**；[ROADMAP_V1.2.md](./ROADMAP_V1.2.md) 现为 **大拓展占位**（插件、DAP、SSH 等）。

---

## 3. 创新式差异化（非对打清单）

- **Plan + Agent + 协作** 三角：计划文档、后台 Agent、实时代码同屏的 **工作流融合**（大型 IDE 多为单点强）  
- **浏览器优先 + 可选 Electron**：零安装演示与协作链接  
- **BYOK 与平台 Key 双轨**：个人与团队部署灵活  
- **开源 + 可自托管 API**：对比闭源云 IDE  

---

## 4. 1.1.3.x 剩余（轨道 A）

见 [ROADMAP_V1.1.3.x_PATCHES.md](./ROADMAP_V1.1.3.x_PATCHES.md)：**1.1.3.8～9**（e2e、413）。

---

## 5. 文档索引

| 文档 | 范围 |
|------|------|
| [V1.1.4_MASTER_PLAN.md](./V1.1.4_MASTER_PLAN.md) | v1.1.4 B 轨 |
| [ROADMAP_V1.1.6.x_PATCHES.md](./ROADMAP_V1.1.6.x_PATCHES.md) | 1.1.6.x Git patch |
| [ROADMAP_V1.1.7.x_PATCHES.md](./ROADMAP_V1.1.7.x_PATCHES.md) | 1.1.7.x 调试 patch |
| [ROADMAP_V1.1.x.md](./ROADMAP_V1.1.x.md) | 世代总览 |
| [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) | 网关 |

---

## 6. 复评模板（每 B 轨 GA 填一行）

| 版本 | 日期 | AI | 协作 | 编辑器 | 扩展 | 部署 | i18n | 备注 |
|------|------|:--:|:----:|:------:|:----:|:----:|:----:|------|
| v1.1.3 | 2026-05 | — | — | — | — | — | — | 协作 M1 生产验证 |
| v1.1.7 | 2026-05-31 | 4 | 4 | 4 | 3 | 4 | 4 | 调试 MVP · Git patch 收口 |
