# 当前执行入口

> **更新**：2026-06-05 — **v1.4.9 ✅** · **v1.4 世代收官** · 待 smoke 2 周后 **v1.5.0 F1**

---

## 策略

- **零宣传 / 不上架**
- **v1.4.x**：1.4.1～1.4.9 ✅ **句号**
- **v1.5.0**：smoke **连续 2 周** 5/5 后启动 F1 编码

**v1.5 入口**：[V1.5_KICKOFF.md](./V1.5_KICKOFF.md) · [ROADMAP_V1.5.md](./ROADMAP_V1.5.md)

---

## 当前：v1.5.0 启动门（等待 smoke）

| 条件 | 状态 |
|------|:----:|
| v1.4.0～1.4.9 tag | ✅ |
| `V1.5_KICKOFF` 评审 | ✅ |
| smoke 连续 2 周 5/5 | ⬜ |
| CI e2e + stack + collab 绿 | ⬜ |

**周更**：[V1.4.9_SMOKE_WEEKLY.md](./V1.4.9_SMOKE_WEEKLY.md)

---

## v1.5.0 首包（smoke 绿后）

| 阶段 | 主题 |
|------|------|
| **F1** | Tab++ Core（多行 ghost · 生产开关） |
| **F2** | Tab++ Context |
| **F3–F6** | AIDE Runtime 生产实现 |

---

## v1.4.x 进度（收官）

| 版本 | 主题 | 状态 |
|------|------|:----:|
| **1.4.1**～**1.4.8** | … | ✅ |
| **1.4.9** | 收官 · v1.5 门 | ✅ |

---

## 门禁

```bash
npm run test:local
npm run test:e2e:local
npm run test:e2e:stack
npm run test:e2e:collab
npm run smoke:production -- https://ai-ide-flame.vercel.app
```
