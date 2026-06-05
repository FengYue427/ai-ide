# Activity Line RFC — v1.4.8

> **状态**：Draft（stub） · **ADR**：[ADR_V1.5_AIDE_RUNTIME.md](./ADR_V1.5_AIDE_RUNTIME.md) D6  
> **实现阶段**：v1.4.8 线框 + 事件总线 · v1.5 F5 生产 UI

---

## 目标

对标 Windsurf Cascade 的 **轻量活动条**：让用户看见队列、Agent 写文件、Hook 执行与验收失败——**不阻塞** Chat 主流程。

---

## 事件总线（`runtimeEventBus`）

| 事件 | 说明 |
|------|------|
| `queue.progress` | 队列排水进度（如 `2/5`） |
| `agent.fileWrite` | Agent 应用文件变更 |
| `hook.start` / `hook.end` | Hook 生命周期 |
| `verify.fail` | acceptance 失败 |

- 内存 pub/sub，最多保留 50 条
- v1.4.8：**仅 stub 发布**（orchestrator 不接 ideStore）

---

## Orchestrator stub（`runtimeOrchestrator`）

```typescript
enqueueRuntimeIntent(intent) → { accepted, mode: 'stub', intentId }
```

- **不**写入 `ideStore` 队列
- 发布 `queue.progress` 到事件总线
- v1.5 F4：双写迁移 + `hookRunner`

---

## UI（`ActivityLine.tsx`）

- 落点：Chat 面板顶部（`RightPanel`）
- 默认 **折叠**
- `data-testid="aide-activity-line"`
- 特性开关：`VITE_AIDE_RUNTIME_UI` / `ai-ide:feature:aideRuntimeUi`（**默认关**）

---

## 上下文快照（`runtimeContextSnapshot`）

只读 API（ADR D7），供 Tab++ F2：

- `activeSpecPath`
- 第一条未完成 task 文本
- 最近 5 条 Activity 摘要

---

## v1.5 交付边界

| 项 | v1.4.8 | v1.5 F5 |
|----|:------:|:-------:|
| 事件总线 | stub | 生产 Hook/队列发布 |
| Activity Line UI | 折叠线框 | 默认策略 + 样式抛光 |
| orchestrator | stub | 真实排水 |

---

## 相关

- [AIDE_RUNTIME.md](./AIDE_RUNTIME.md) §5
- [V1.4.8_KICKOFF.md](./V1.4.8_KICKOFF.md)
