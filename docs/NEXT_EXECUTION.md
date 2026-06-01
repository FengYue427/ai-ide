# 当前执行入口

> **更新**：2026-06-01 — **v1.1.9 开发完成（待 tag / deploy）**

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.1.8** | ✅ GA · tag `v1.1.8` | [RELEASE_NOTES_v1.1.8.md](./RELEASE_NOTES_v1.1.8.md) |
| **v1.1.8.x** | ✅ 抛光合入 1.1.9 | [ROADMAP_V1.1.8.x_PATCHES.md](./ROADMAP_V1.1.8.x_PATCHES.md) |
| **v1.1.9** | 🚧 **待 tag** `v1.1.9` | [RELEASE_NOTES_v1.1.9.md](./RELEASE_NOTES_v1.1.9.md) |
| **v1.2+** | 📋 大拓展占位 | [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) |

---

## 立即执行（v1.1.9 GA）

```bash
npm run test:local
git commit -m "release: v1.1.9 plugin SDK 2.0"
git tag v1.1.9
git push origin main --tags
npm run smoke:report   # 可选
```

### 手工冒烟

1. 插件市场 → 安装 **SDK v2 状态** → 启用 → 工具栏按钮
2. 已登录 + 平台 AI：通知显示 `platform`
3. 开始调试后再次点击：显示 `paused` / `active=true`

---

## 下一迭代建议

- **1.1.8.4**：设置页 `health.platformAi` 展示
- **1.1.7.x**：条件断点、Watch
- **v1.2**：插件签名 / 更大平台能力
