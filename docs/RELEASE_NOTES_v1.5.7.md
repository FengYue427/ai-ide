# Release Notes — v1.5.7 · Activity Line · Spec UI

> **Tag**：`v1.5.7`

## 北极星

Spec 工程 **像产品** — hooks 创建引导 · Activity Line 默认折叠合理。

## 交付

| 项 | 说明 |
|----|------|
| Activity Line | 默认折叠 · 偏好持久化 · 折叠时「点击展开」提示 |
| Spec 目录 | `spec-catalog-hooks-guide` 三步 hooks.yaml 引导 |
| 文案 | Spec 目录描述强调 Runtime / hooks |
| E2E | `spec-catalog-ui.spec.ts` · activity-line 折叠断言 |

## 门禁

```bash
npm run test:unit
npm run test:e2e:local -- e2e/activity-line.spec.ts e2e/spec-catalog-ui.spec.ts
```

## 下一 patch

**v1.5.8** — E2E 回归 · i18n · 见 [ROADMAP_V1.5.x_PATCHES.md](./ROADMAP_V1.5.x_PATCHES.md)
