# v1.0.2.4 — 索引第二档

## 交付

| ID | 内容 |
|----|------|
| 2.4-1 | 索引上限 **500**（浏览器）/ **2000**（桌面） |
| 2.4-2 | `projectIndex.worker.ts` 分批构建（≥80 文件） |
| 2.4-3 | Chat 显示 `正在索引 x/y` 进度 |
| 2.4-4 | 失败可 **重试**；索引总字节约 **4MB** |

## 代码

- `src/services/indexLimits.ts`
- `src/services/projectIndexManager.ts`
- `src/workers/projectIndex.worker.ts`
- `src/services/projectIndexBuildCore.ts`

## 手测

1. 导入 100+ 文件工作区 → Chat 栏应出现索引进度。
2. `@` 提及符号应覆盖更多文件（桌面 2000 上限）。
