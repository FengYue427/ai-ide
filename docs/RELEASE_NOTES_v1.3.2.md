# Release Notes — v1.3.2 日用抛光

> **日期**：2026-06-05  
> **上一版**：v1.3.1  
> **类型**：patch · 零宣传

---

## 一句话

**Tab 补全少打扰**、**条件断点文档与 CDP 单测**、**社区插件样例 + 审核走通文档**。

---

## 用户可见变化

| 主题 | 说明 |
|------|------|
| **Tab** | 短行/空白早退；默认 debounce 350ms；EOF 缓存键；失败原因可观测 |
| **断点** | 侧栏 condition/hitCount 可编辑（testid）；`BROWSER_LIMITATIONS` 补充 CDP vs inject |
| **插件** | `fixtures/plugins/community-sample` · [PLUGIN_COMMUNITY_SAMPLE.md](./PLUGIN_COMMUNITY_SAMPLE.md) |

---

## 验证

```bash
npm run test:local
npm run test:e2e:local
```

---

## 下一版

v1.3.x 收口 → 起草 v1.4（Tab 生产级 · 索引 2k · Git 实用化）。
