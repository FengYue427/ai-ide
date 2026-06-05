# 当前执行入口

> **更新**：2026-06-05 — **v1.3.9 收官 GA** · 下一世代 **v1.4.0**（待启动条件）

---

## 策略

- **v1.3.x 已收官**（1.3.0～1.3.9 ✅）
- **v1.4.0** 编码待：smoke **连续 2 周** 5/5 + Kickoff 评审
- **不做**宣传 / 上架

**主规划**：[V1.4_KICKOFF.md](./V1.4_KICKOFF.md) · [ROADMAP_V1.4.md](./ROADMAP_V1.4.md)

---

## v1.3.x 进度（收官）

| 版本 | 状态 |
|------|:----:|
| 1.3.0～1.3.8 | ✅ |
| **1.3.9** | ✅ 收官 — [RELEASE_NOTES_v1.3.9.md](./RELEASE_NOTES_v1.3.9.md) |

---

## v1.4 启动门

| 条件 | 状态 |
|------|:----:|
| v1.3.0～1.3.9 tag | ✅ |
| `V1.4_KICKOFF` 起草 | ✅ |
| 生产 smoke 连续 2 周 5/5 | ⏳ 自 v1.3.9 部署日起 |
| CI E2E 绿 | ⏳ 持续 |

周更 playbook：[V1.3.9_SMOKE_WEEKLY.md](./V1.3.9_SMOKE_WEEKLY.md)

---

## 发版（v1.3.9）

```bash
npm run test:local
git tag v1.3.9
git push origin main
git push origin v1.3.9
```

---

## 下一动作

满足启动门后 → [V1.4_KICKOFF.md](./V1.4_KICKOFF.md) **F1** 编码
