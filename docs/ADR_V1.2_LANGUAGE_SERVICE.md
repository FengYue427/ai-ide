# ADR: Language Service Host（v1.2.1）

**状态**：已接受（2026-06-01）  
**背景**：跳定义 today 由 `registerCrossFileDefinition.ts` 直接注册 Monaco Provider；Python 等语言无 LSP。v1.2.1 需要 **统一入口**，便于命令面板、插件只读 `goToDefinition`、日后接 TS server。

---

## 决策

新增 **`languageServiceHost`** 模块：

```ts
goToDefinition(request: { file, line, column, files }): Location | null
registerMonacoProviders(files, activeFile): IDisposable
```

- **v1.2.1 实现**：委托现有 `extractSymbolsFromContent` + `registerCrossFileDefinition`（TS/JS/TSX/JSX）
- **非目标**：启动 `typescript-language-server` 子进程；Python LSP

---

## 迁移步骤（F4）

1. 抽出 `findDefinition` 到 `languageServiceHost.ts`
2. `registerCrossFileDefinition` 变薄包装
3. 命令面板 `editor.action.revealDefinition` 调用 host（若尚未统一）

---

## 后果

- **正面**：单一 API 文档化；插件 SDK 可暴露只读 definition
- **负面**：符号索引精度仍低于真 LSP（已知限制写入 RELEASE_NOTES）

---

## 参考

- `src/editor/registerCrossFileDefinition.ts`
- `src/services/projectIndexService.ts` — `extractSymbolsFromContent`
