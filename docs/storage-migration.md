# 存储服务迁移指南

## 概述

已将项目从旧的 `localStorageService` 和 `storageService` 迁移到新的统一存储服务 `unifiedStorage`。

## 迁移文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `recentFilesService.ts` | ✅ 已迁移 | 最近文件/项目 |
| `snippetService.ts` | ✅ 已迁移 | 代码片段 |
| `cloudSyncService.ts` | ✅ 已迁移 | 工作区备份 |
| `formatService.ts` | ✅ 已迁移 | 格式化配置 |
| `terminalHistoryService.ts` | ✅ 已迁移 | 终端历史 |
| `authService.ts` | ✅ 已迁移 | 用户会话 |
| `i18n/index.tsx` | ✅ 已迁移 | 语言设置 |
| `workspaceContextService.ts` | ✅ 已迁移 | 工作区上下文 |
| `CollaborationPanel.tsx` | ✅ 已迁移 | 协作面板 |
| `App.tsx` | ✅ 已迁移 | 主应用组件 |

## 存储层级说明

- `StorageLayer.MEMORY` - 内存缓存，最快但重启后丢失
- `StorageLayer.LOCAL` - localStorage，适用于小数据
- `StorageLayer.INDEXED` - IndexedDB，适用于大数据
- `StorageLayer.CLOUD` - 云同步，自动选择最佳方案

## 使用示例

```typescript
import { unifiedStorage, StorageLayer } from './unifiedStorage'

// 获取数据
const value = await unifiedStorage.get('key', defaultValue)

// 保存数据（自动选择最佳层级）
await unifiedStorage.set('key', value)

// 保存到指定层级
await unifiedStorage.set('key', value, { layer: StorageLayer.LOCAL })

// 批量操作
await unifiedStorage.batchSet([
  { key: 'a', value: 1 },
  { key: 'b', value: 2 }
])

// 导入/导出
const exported = await unifiedStorage.exportAll()
await unifiedStorage.importAll(json)
```

## 向后兼容

所有已存储的数据会自动迁移到新系统，无需用户手动操作。

## 废弃文件

以下文件已废弃，保留作参考：
- `localStorageService.ts`
- `storageService.ts`

## 注意事项

1. 新 API 是异步的，调用时需要 `await`
2. 缓存层会自动清理，无需手动管理
3. 所有存储操作支持可选的 AbortSignal

## 相关提交

- `dc798e3` refactor: migrate App.tsx to unifiedStorage and fix lint errors
- `c0a0fef` refactor: migrate workspaceContextService and CollaborationPanel to unifiedStorage
- `21e4866` refactor: migrate all services to unifiedStorage
