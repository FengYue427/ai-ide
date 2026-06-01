# 当前执行入口

> **更新**：2026-06-01 — **v1.2.0 GA** ✅

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.1.9.x** | ✅ 收口 | [ROADMAP_V1.1.9.x_PATCHES.md](./ROADMAP_V1.1.9.x_PATCHES.md) |
| **v1.2.0** | ✅ **已上架** | [LAUNCH_V1.2.0_FULL.md](./LAUNCH_V1.2.0_FULL.md) · [RELEASE_NOTES_v1.2.0.md](./RELEASE_NOTES_v1.2.0.md) |
| **v1.2.1 / v1.2.2** | 📋 **下一 B 轨** | [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) |

---

## 当前迭代：v1.2.1 预览（DAP / LSP）

1. 读 [V1.2_MASTER_PLAN.md](./V1.2_MASTER_PLAN.md) §3 v1.2.1
2. DAP ADR · 条件断点/Watch 升格 · LSP 统一跳定义

**v1.2.0 功能开关**（生产逐步开）：[V1.2_ENV.md](./V1.2_ENV.md)

---

## 本地验证

```bash
npm run test:local
npm run build
npm run test:e2e
```

生产（部署后）：

```bash
$env:APP_URL="https://ai-ide-flame.vercel.app"
npm run smoke:production -- $env:APP_URL
git tag -a v1.2.0 -m "v1.2.0: multi-root workspace and plugin trust market"
```

---

## 勿并行

- SSH / 企业 SSO（→ v1.2.2）
- 完整 DAP 多目标（→ v1.2.1）
