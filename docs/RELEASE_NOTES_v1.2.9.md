# Release Notes — v1.2.9 引用精度 · 动态 MCP · 插件审核运维

> **日期**：2026-06-05  
> **站点**：https://ai-ide-flame.vercel.app  
> **上一稳定版**：v1.2.8

---

## 一句话

**ReferencesPeekBar 与 TS Worker 行号对齐**、**MCP 表计按工具数动态预留**、**插件审核只读 API + 设置筛选 + publish E2E** — 工程深度，无营销 rollout。

---

## 用户可见变化

| 主题 | 说明 |
|------|------|
| **引用 Peek** | Shift+F12 列表行号与 Monaco 跳转一致；点击引用保留列号 |
| **Chat 表计** | Agent + MCP 时按已连接工具数估算预留（上限 12KB） |
| **插件运维** | 设置 → 功能 → 审核列表可按「待审核」筛选 |
| **API** | `GET .../reviews?status=pending` · `GET .../reviews/:reviewId` |

---

## 验证

```bash
npm run test:local          # 656 tests
npm run test:e2e:local
npm run test:integration:local
```

---

## 文档

- [V1.2.9_F1_REFERENCES_PRECISION.md](./V1.2.9_F1_REFERENCES_PRECISION.md)
- [V1.2.9_F2_MCP_METER.md](./V1.2.9_F2_MCP_METER.md)
- [V1.2.9_F3_PLUGIN_OPS.md](./V1.2.9_F3_PLUGIN_OPS.md)
