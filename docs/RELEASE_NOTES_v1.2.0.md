# Release Notes — v1.2.0

**主题**：多根工作区 · 大文件树 · 插件可信市场  
**版本**：`1.2.0`  
**建议 tag**：`v1.2.0`  
**日期**：2026-06-01

---

## 面向用户

### 多根工作区（F1）

- 侧栏 **工作区根切换器**：可同时管理多个项目根，切换后文件与 autosave **按根隔离**
- 协作房间绑定 **主根**；在房间内不可随意切换根（避免串文件）
- 开发期默认关闭；本地开启：`VITE_MULTI_ROOT=true` 或 `localStorage ai-ide:feature:multiRoot=1`

### 大文件树（F2）

- **≥250** 文件：默认折叠子目录 + 性能提示
- **≥500** 可见行：虚拟滚动（多根或 `VITE_VIRTUAL_FILE_TREE=true` 时）
- 项目索引 `projectIndexManager` 按 **activeRootId** 分桶

### 插件可信市场（F3～F4）

- 官方目录 **`trustTier`**：`official` / `verified` / `community` / `unsigned`
- `VITE_PLUGIN_TRUST_MARKET=true` 时：安装前校验签名或用户确认
- 市场卡片显示 **信任徽章**（官方 / 已签名 / 社区）
- 示例 **`sdk-v2-status`** 带 Ed25519 官方签名
- 服务端草案：`POST /api/plugins/publish` → **202** + `reviewId`（`PLUGIN_PUBLISH_ENABLED=true`）

---

## 功能开关（默认关）

见 [V1.2_ENV.md](./V1.2_ENV.md) · 代码：`src/lib/v12Features.ts`

| 变量 | 说明 |
|------|------|
| `VITE_MULTI_ROOT` | 多根 UI + store |
| `VITE_VIRTUAL_FILE_TREE` | 大仓虚拟列表 |
| `VITE_PLUGIN_TRUST_MARKET` | 市场安装信任门控 |

生产建议：GA 后先观察 1 周，再逐步在 Vercel 打开 `VITE_MULTI_ROOT` 与 `VITE_PLUGIN_TRUST_MARKET`。

---

## 面向插件作者

- Manifest 可选：`publisher`、`signature: { keyId, value }`
- 维护者签名：`node scripts/sign-plugin-manifest.mjs <package.json>`
- 提交审核：`POST /api/plugins/publish`（需登录 + 服务端开关）
- 文档：[PLUGIN_SDK_V2.md](./PLUGIN_SDK_V2.md) · [ADR_V1.2_PLUGIN_TRUST.md](./ADR_V1.2_PLUGIN_TRUST.md)

---

## 升级自 v1.1.9.x

1. **无需** 数据库 schema 变更（插件 publish 为 stub，无新表）
2. 拉取 `main` · `npm ci` · `npm run test:local`
3. 部署后可选：`npm run smoke:production -- https://your-app.vercel.app`
4. 打 tag：`git tag -a v1.2.0 -m "v1.2.0: multi-root workspace and plugin trust market"`

---

## 测试与 E2E

- 单元：**573+**（`npm run test:local`）
- E2E 新增：`multi-root.spec.ts` · `plugin-market.spec.ts` · `v12-workspace-plugins.spec.ts`

---

## 已知限制（v1.2.0）

- 多根 / 信任市场 **默认未在生产开启**（需 env 或 localStorage）
- 插件 publish API 为 **人工审核队列**，无自动上架
- 无 VSIX · 无 SSH 远程根（→ v1.2.2）· 无完整 DAP（→ v1.2.1）

---

## 下一世代

- **v1.2.1**：DAP 骨架 · 条件断点/Watch · LSP 统一层
- **v1.2.2**：SSH 远程 · 平台 AI 成本仪表盘 · 企业 SSO

规划：[ROADMAP_V1.2.md](./ROADMAP_V1.2.md) · [V1.2_MASTER_PLAN.md](./V1.2_MASTER_PLAN.md)
