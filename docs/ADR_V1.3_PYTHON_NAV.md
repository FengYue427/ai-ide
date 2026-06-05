# ADR：Python 跨文件导航（v1.3 F1）

> **状态**：Accepted  
> **替代**：浏览器 内完整 Pyright LSP（v1.3 非目标）

---

## 背景

v1.2.x 已用 Monaco TS Worker 做 TypeScript 语义导航。Python 在浏览器内跑完整 LSP 成本高（包体积、Worker 启动）。

## 决策

1. **符号索引 + `goToDefinition`**：复用 `extractSymbolsFromContent` 的 `def` / `class` 正则（v1.3 增强）。
2. **Monaco Provider**：在 `VITE_PYTHON_NAV` / dev / localStorage 开启时，为 `python` 注册 definition/reference provider。
3. **TS 优先不变**：非 Python 文件仍走 TS Worker。

## 后果

- ✅ 零额外依赖、与现有索引一致  
- ✅ E2E 可稳定（`main.py` → `lib/util.py`）  
- ⚠️ 无类型推断、无 import 重导出解析  
- 📋 桌面 Electron 可后续接 Pyright 子进程

## 参考

- `src/editor/registerCrossFileDefinition.ts`
- `src/services/projectIndexService.ts` SYMBOL_PATTERNS
