# 当前执行入口

> **更新**：2026-05-29 — **v1.1.7 GA ✅**

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.1.6** | ✅ GA · tag `v1.1.6` | [RELEASE_NOTES_v1.1.6.md](./RELEASE_NOTES_v1.1.6.md) |
| **v1.1.6.x** | ✅ **1.1.6.8** 完成 · patch 线收口 | [ROADMAP_V1.1.6.x_PATCHES.md](./ROADMAP_V1.1.6.x_PATCHES.md) |
| **v1.1.7** | ✅ **GA** · tag `v1.1.7` | [RELEASE_NOTES_v1.1.7.md](./RELEASE_NOTES_v1.1.7.md) |
| **v1.1.8～9** | 📋 长期 | [ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) |

---

## 建议下一步

### 轨道 A — v1.1.7.x patch（可选）

| 顺序 | 主题 |
|:----:|------|
| 1 | Electron 桌面 `--inspect-brk` attach |
| 2 | 条件断点 · step 抛光 |
| 3 | `debug.*` ja 漏翻扫尾 |

### 轨道 B — v1.1.8 插件 SDK 2.0

见 [ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md)。

---

## 发版命令（待执行）

```bash
npm run test:local
git tag v1.1.7
npm run deploy
npm run smoke:report
```
