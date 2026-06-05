# 当前执行入口

> **更新**：2026-06-05 — **v1.3.1 代码就绪** · 待 CI 绿 + tag

---

## 策略（已拍板）

- **不做**：短期渠道宣传、发文、上架推广节奏
- **要做**：代码与体验 — 综合分 **≥ 3.4** 后再考虑对外
- **Git**：Agent 可直接 `git push`，无需每次确认

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.3.0** | ✅ F1–F7 能力 | [RELEASE_NOTES_v1.3.0.md](./RELEASE_NOTES_v1.3.0.md) |
| **v1.3.1** | 🔨 待 tag `v1.3.1` | [V1.3.1_GA_EXECUTION.md](./V1.3.1_GA_EXECUTION.md) |
| **v1.3.2** | ⏳ 待 1.3.1 GA | [V1.3.2_KICKOFF.md](./V1.3.2_KICKOFF.md) |

---

## v1.3.1 门禁（P1–P6）

| ID | 项 | 状态 |
|----|-----|:----:|
| P1 | `test:e2e` 39/39 | 🔶 CI |
| P2 | `test:e2e:stack` 2/2 | 🔶 CI |
| P3 | `smoke:production` 1.3.x | ✅ 代码 |
| P4 | `V1.3_ENV.md` 生产策略 | ✅ |
| P5 | 版本 1.3.1 + RELEASE_NOTES | ✅ |
| P6 | 文档索引 | ✅ |

**Patch 总览**：[ROADMAP_V1.3.x_PATCHES.md](./ROADMAP_V1.3.x_PATCHES.md)

---

## 发版命令

```bash
npm run test:local
npm run test:e2e:local
npm run test:e2e:stack
npm run smoke:production -- https://ai-ide-flame.vercel.app

git tag v1.3.1
git push origin main
git push origin v1.3.1
```

---

## 本地验证

```bash
npm run test:local
npm run test:e2e:local
npm run test:e2e:stack
```
