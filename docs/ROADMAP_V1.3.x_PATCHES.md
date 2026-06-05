# v1.3.x 补丁（轨道 A）

> **前置**：v1.3.0 F1–F7 代码完成 — [RELEASE_NOTES_v1.3.0.md](./RELEASE_NOTES_v1.3.0.md)  
> **策略**：**零宣传、零上架**；patch 只做收口与日用抛光，不扩 v1.4 范围  
> **下一质量线**：v1.4 基础填坑 — 待 v1.3.2 GA 后启动

---

## 定位

| 子版本 | 主题 | 文档 |
|--------|------|------|
| **v1.3.0** | F1–F7 大版本能力 | [V1.3_KICKOFF.md](./V1.3_KICKOFF.md) |
| **v1.3.1** | **GA 收口 + CI/生产门禁** | [V1.3.1_KICKOFF.md](./V1.3.1_KICKOFF.md) |
| **v1.3.2** | **日用抛光**（Tab · 断点 · 插件样例） | [V1.3.2_KICKOFF.md](./V1.3.2_KICKOFF.md) |

轨道 B（v1.4）在 **v1.3.2 tag + 生产 smoke 连续 2 周绿** 后启动。

---

## CI 发版门禁（两 patch 共用）

| Job | 命令 | v1.3.0 | v1.3.1 目标 | v1.3.2 目标 |
|-----|------|:------:|:-----------:|:-----------:|
| build | `test:local` | ✅ | ✅ | ✅ |
| e2e-ui | `test:e2e` | 🔶 39 项 | **39/39** | **39/39** |
| e2e-stack | `test:e2e:stack` | 🔶 云工作区 | **2/2** | **2/2** |
| e2e-collab | `test:e2e:collab` | ✅ | ✅ | ✅ |
| 生产 smoke | `smoke:production` | 🔶 版本校验 | **5/5** | **5/5** |

本地发版前：

```bash
npm run test:local
npm run test:e2e:local
npm run test:e2e:stack    # 需 Postgres + dev:stack
npm run smoke:production -- https://ai-ide-flame.vercel.app
```

---

## v1.3.1 摘要（热修 · 约 1 周）

**北极星**：让 v1.3.0 成为**可 tag、可部署、可周更 smoke** 的稳定基线。

| ID | 项 | 验收 |
|----|-----|------|
| P1 | E2E UI 全绿 | `plugin-ops` 审核筛选 + `v13-features` + `py-cross-file-navigation` |
| P2 | Stack E2E 全绿 | `registers and saves a cloud workspace` 稳定（乐观 cloud 不被轮询覆盖） |
| P3 | 生产 smoke 适配 1.3.x | `scripts/smoke-production.mjs` 接受 `1.3.*` |
| P4 | 生产特性策略文档 | [V1.3_ENV.md](./V1.3_ENV.md) 写明 prod 默认（Python nav / embedding） |
| P5 | GA 清单收口 | tag `v1.3.1` · CHANGELOG · GitHub Release 正文 |
| P6 | `NEXT_EXECUTION` 切换 | 入口指向 v1.3.1 → v1.3.2 |

**非目标**：新 F 阶段 · Tab 行为大改 · 开放插件上传

---

## v1.3.2 摘要（抛光 · 约 2 周）

**北极星**：把 ROADMAP 里写的「v1.3.x 抛光」落成**用户可感知**的三条，仍不碰 v1.4。

| ID | 项 | 验收 |
|----|-----|------|
| T1 | **Tab 补全抛光** | 默认 debounce 调优；空 suffix / 短 prefix 早退；设置页指标有单测覆盖的新路径 |
| T2 | **条件断点完善** | 断点列表可编辑 condition / hitCount；CDP 同步单测 + 文档一句「inject 模式限制」 |
| T3 | **插件第三方案例** | `fixtures/plugins/` 社区样例 manifest +「发布→审核→安装」文档 + plugin-ops E2E 可读 fixture |

**非目标**：FIM 生产默认全开 · VSIX · 后台 Agent 默认可用 · 宣传

---

## 综合分影响（估）

| 版本 | 综合分变化 | 说明 |
|------|:----------:|------|
| v1.3.1 | +0.02～0.05 | 可靠性 / 合规（smoke、CI） |
| v1.3.2 | +0.03～0.06 | Tab 跟手、调试可用性、插件生态文档 |
| **累计** | **~3.1～3.2** | 距 3.4 宣传线仍差 v1.4 |

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [V1.3.1_KICKOFF.md](./V1.3.1_KICKOFF.md) | 1.3.1 任务与验收 |
| [V1.3.2_KICKOFF.md](./V1.3.2_KICKOFF.md) | 1.3.2 任务与验收 |
| [V1.3_GA_EXECUTION.md](./V1.3_GA_EXECUTION.md) | v1.3.0 原始 GA 清单 |
| [ROADMAP_V1.3.md](./ROADMAP_V1.3.md) | v1.3 世代总览 |
