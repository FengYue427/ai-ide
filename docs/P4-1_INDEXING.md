# P4-1 — 代码库理解（首包）

## 已交付

| 项 | 说明 |
|----|------|
| 索引上限 | `src/services/indexLimits.ts`：最多 200 文件、单文件 120KB、总量约 2MB |
| 忽略规则 | 默认目录 + 合并工作区内所有 `.gitignore` |
| 语义检索 | 与索引同源过滤；设置 → 功能 → **语义检索** 开关（localStorage） |
| 生产冒烟 | `smoke:production` 在 `health` 要求 `database=connected` |

## 常量（调优入口）

```ts
// src/services/indexLimits.ts
MAX_INDEX_FILES = 200
MAX_INDEX_FILE_BYTES = 120_000
MAX_INDEX_TOTAL_BYTES = 2_000_000
```

## 生产 DB 不可用

若冒烟显示 `db=unavailable`：

1. Vercel 项目 → Environment Variables → `DATABASE_URL`（Neon **pooler** URL，`sslmode=require`）
2. `AUTH_SECRET`、`APP_URL` 与部署域一致
3. Redeploy 后再跑 `npm run smoke:production`

## 下一步（P4-1 续）

- 索引截断时 UI 提示（「已索引 N/M 个文件」）
- 向量检索按目录分片 / 增量 embedding
- 与 `BROWSER_LIMITATIONS.md` 交叉链接
