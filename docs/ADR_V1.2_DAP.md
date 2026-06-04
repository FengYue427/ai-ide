# ADR: Debug Adapter 层（v1.2.1）

**状态**：已接受（2026-06-01）  
**背景**：v1.1.7 以 **CDP 直连**（`DebugCdpClient` + `debugSessionService`）交付调试 MVP；v1.2.1 需要可扩展边界，以便后续 Watch、条件断点、桌面/Web 双运行时共用一套 UI。

---

## 决策

引入 **`DebugSession` 接口**（受 DAP 概念启发，**不**引入完整 `vscode-debugadapter` 依赖）：

```
UI (DebugPanel, Editor gutter)
        ↓
debugSessionService (lifecycle, breakpoints file sync)
        ↓
DebugSession  ←—— CdpDebugSession（现有 WebSocket CDP）
        ↓
DebugCdpClient
```

### 接口能力（v1.2.1）

| 能力 | 方法 | 备注 |
|------|------|------|
| 连接 | `connect(url)` | inspect WebSocket URL |
| 断点 | `setBreakpoints(bps)` | 含可选 `condition` |
| 执行 | `resume()` / `stepOver()` / `stepIn()` / `stepOut()` | 映射 CDP |
| 事件 | `onPaused` / `onResumed` / `onEnded` | 与 store `debugSession` 对齐 |
| 求值 | `evaluate(expression, frameId?)` | Watch F3 |

### 非目标（本 ADR）

- 不实现完整 DAP JSON-RPC 服务端
- 不新增 Python/Java debug adapter
- 不修改变量（`setVariable`）

---

## 现有代码映射

| 现有 | v1.2.1+ |
|------|---------|
| `src/services/debugCdpClient.ts` | 保留；由 `CdpDebugSession` 封装 |
| `src/services/debugSessionService.ts` | 保留；逐步依赖 `DebugSession` 类型 |
| `src/lib/debugBreakpoints.ts` | 扩展 `condition` / `hitCount` |
| `src/lib/debugBreakpointPatterns.ts` | CDP 参数含 `condition` |

---

## 条件断点

- **CDP**：`Debugger.setBreakpointByUrl` 的 `condition` 字符串（V8）
- **hitCount**：客户端在 `Debugger.paused` 时递增计数，未达阈值则自动 `resume`（不依赖 CDP hitCount）

---

## 后果

- **正面**：F2/F3 可在接口上扩展而不扩散 CDP 细节到 UI
- **负面**：短期存在「接口 + 旧函数」并存；F1 仅加类型与文档，迁移在 F2/F3 迭代完成

---

## 参考

- [V1.1.7_MASTER_PLAN.md](./V1.1.7_MASTER_PLAN.md)
- [ROADMAP_V1.1.7.x_PATCHES.md](./ROADMAP_V1.1.7.x_PATCHES.md)（1.1.7.1 / 1.1.7.4）
