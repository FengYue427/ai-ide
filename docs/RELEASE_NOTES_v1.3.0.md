# Release Notes — v1.3.0 语言 · 索引 · Agent · 平台

> **日期**：2026-06-05  
> **上一稳定版**：v1.2.9

---

## 一句话

**Python 跨文件 F12**、**语义 embedding 持久缓存 + 索引遥测**、**Agent 索引上下文**、**Tab/后台 Agent/插件/v1.3 设置卡** — 大版本工程深度。

---

## 用户可见变化

| 主题 | 说明 |
|------|------|
| **Python** | `main.py` F12 跳转到 `lib/*.py`（需 `VITE_PYTHON_NAV` 或 dev） |
| **索引** | 设置页显示上次索引耗时；语义检索可复用本地 embedding |
| **Agent** | 系统提示含项目索引摘要；后台 Agent 状态卡 |
| **Tab** | 设置 → Tab 补全指标与重置 |
| **插件** | 审核列表显示待审核数量 |
| **v1.3** | 设置 → 功能 → v1.3 能力只读状态 |

---

## 部署

见 [V1.3_ENV.md](./V1.3_ENV.md) · [V1.1_FEATURE_FLAGS.md](./V1.1_FEATURE_FLAGS.md)

---

## 验证

```bash
npm run test:local
npm run test:e2e:local
```
