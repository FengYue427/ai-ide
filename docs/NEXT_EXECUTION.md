# 当前执行入口

> **更新**：2026-06-05 — **v1.3.2 开发完成** · 待 tag

---

## 策略（已拍板）

- **不做**：短期渠道宣传、发文、上架推广节奏
- **要做**：综合分 **≥ 3.4** 后再考虑对外
- **Git**：Agent 可直接 `git push`

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.3.1** | ✅ GA · `v1.3.1` | [RELEASE_NOTES_v1.3.1.md](./RELEASE_NOTES_v1.3.1.md) |
| **v1.3.2** | 🔨 待 tag | [V1.3.2_GA_EXECUTION.md](./V1.3.2_GA_EXECUTION.md) |
| **v1.4** | ⏳ v1.3.2 GA 后 | 待起草 `V1.4_KICKOFF.md` |

---

## v1.3.2 交付（T1–T3）

| ID | 项 | 状态 |
|----|-----|:----:|
| T1 | Tab 补全抛光 | ✅ |
| T2 | 条件断点完善 | ✅ |
| T3 | 插件社区样例 | ✅ |

---

## 发版

```bash
npm run test:local
git tag v1.3.2
git push origin main
git push origin v1.3.2
```
