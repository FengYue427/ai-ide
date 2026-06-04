# 当前执行入口

> **更新**：2026-06-04 — **宣传/上架搁置** · 工程线 **v1.2.3 产品深度**

---

## 策略（已拍板）

- **不做**：短期渠道宣传、发文、上架推广节奏
- **要做**：代码与体验 — 产品足够好时自然会被发现
- **Git**：Agent 可直接 `git push`，无需每次确认

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.2.0** | ✅ GA（功能开关默认关） | [RELEASE_NOTES_v1.2.0.md](./RELEASE_NOTES_v1.2.0.md) |
| **v1.2.2** | ✅ Workbench Shell | [RELEASE_NOTES_v1.2.2.md](./RELEASE_NOTES_v1.2.2.md) |
| **v1.2.3** | 🔄 **产品深度** | [V1.2.3_KICKOFF.md](./V1.2.3_KICKOFF.md) |

---

## 当前迭代：v1.2.3 收口 / 下一工程线

1. [V1.2.3_KICKOFF.md](./V1.2.3_KICKOFF.md) — **F1–F5 已全部交付**
2. **F5** ✅ 协作 E2E — [V1.2.3_F5_COLLAB_E2E.md](./V1.2.3_F5_COLLAB_E2E.md)
3. **可选**：打 `v1.2.3` tag · 继续 v1.2.4（SSH/SSO 仍搁置）

| 阶段 | 文档 |
|------|------|
| F1 | ADR + 转到定义 |
| F2 | [V1.2.3_F2_MULTI_ROOT.md](./V1.2.3_F2_MULTI_ROOT.md) |
| F3 | [V1.2.3_F3_TAB_COMPLETION.md](./V1.2.3_F3_TAB_COMPLETION.md) |
| F4 | [V1.2.3_F4_PLATFORM_USAGE.md](./V1.2.3_F4_PLATFORM_USAGE.md) |
| F5 | [V1.2.3_F5_COLLAB_E2E.md](./V1.2.3_F5_COLLAB_E2E.md) |

**门禁**：`npm run test:local` 全绿；改 `lib/api` 后 `npm run build:api`

---

## v1.2.2 交付（已完成）

见 [RELEASE_NOTES_v1.2.2.md](./RELEASE_NOTES_v1.2.2.md) · [V1.2.2_KICKOFF.md](./V1.2.2_KICKOFF.md)

---

## 本地验证

```bash
npm run test:local
npm run dev:stack
```
