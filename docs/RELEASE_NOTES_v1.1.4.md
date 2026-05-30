# Release Notes — v1.1.4（编辑器深度 + UX 跃迁）

**日期**：2026-05-30 · **类型**：大更新（轨道 B）

---

## 亮点

- **大工作区**：云端 autosave 预览与 413 裁剪；≥250 文件侧栏默认折叠；Monaco TS lib ≤80
- **编辑器**：format-on-save、Ctrl+Shift+I / 命令面板格式化、F12 跨文件定义上限 120 文件
- **i18n Phase 2**：**ja-JP** 第三 UI 语言（Phase 2 前缀 100% 覆盖 + API message ja）
- **全局 UX**：Welcome 首登引导、统一空态/错误 Toast（503 可跳转设置）、大工作区性能 hint

---

## 升级说明

- 从 **1.1.3.x** 升级：设置与 autosave 行为兼容；新增 `settings.formatOnSave` 默认 **关**
- UI 语言可选 **日本語**（设置 → 外観）
- 协作 M1 行为不变（见 v1.1.3 Release Notes）

---

## 环境

无新增必填 env。协作 / Livekit 配置同 [V1.1.3_ENV.md](./V1.1.3_ENV.md)。

---

## 限制

- ja bulk 层为术语 gloss，非 Phase 2 区域仍可能显示英文
- 大工作区云端同步仍可能跳过二进制/超大文件（见 [WORKSPACE_CLOUD_SAVE.md](./WORKSPACE_CLOUD_SAVE.md)）
- AI 网关 → **v1.1.5 / v1.2** 路线

---

## 文档

- [V1.1.4_MASTER_PLAN.md](./V1.1.4_MASTER_PLAN.md)
- [I18N_PHASE2_AUDIT.md](./I18N_PHASE2_AUDIT.md)
- [WORKSPACE_F1_AUDIT.md](./WORKSPACE_F1_AUDIT.md)
- [CHANGELOG.md](../CHANGELOG.md#114--2026-05-30)

---

## 测试

```bash
npm run test:unit
npm run test:local          # 含 integration
npm run test:e2e            # UI smoke
npm run smoke:report        # 生产 health（部署后）
```

---

## 发版

```bash
git tag v1.1.4
npm run deploy              # 或 vercel --prod
```
