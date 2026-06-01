# ADR: v1.2 插件信任与市场

> **状态**：提议（Accepted for F3/F4）  
> **日期**：2026-06-01  
> **前置**：[PLUGIN_SDK_V2.md](./PLUGIN_SDK_V2.md)

---

## 背景

v1.1.9 交付 SDK 2.0 API，但 **无签名、无第三方审核**。任意 JSON 可粘贴安装（开发模式）。v1.2 需 **官方可信 + 可扩展审核**。

---

## 决策

### trustTier

| 值 | 含义 | 安装策略 |
|----|------|----------|
| `official` | 仓库内置目录 | 始终允许 |
| `verified` | 签名匹配官方/合作公钥 | 允许 |
| `community` | 已审核未签名或弱签名 | 需用户确认 |
| `unsigned` | 无签名 | **拒绝**（`VITE_PLUGIN_TRUST_MARKET=true` 时） |

### Manifest 扩展

```json
{
  "id": "com.example.demo",
  "sdkVersion": 2,
  "publisher": "ai-ide",
  "signature": {
    "keyId": "official-2026",
    "value": "<base64 ed25519>"
  }
}
```

签名载荷：canonical JSON of `{ id, version, permissions, entry }`（不含 `signature` 字段）。

### 验证流程

1. `installCatalogEntry` 读取 catalog 行
2. 若 `trustTier === 'official'` → 跳过签名校验
3. 否则 `verifyPluginSignature(manifest, PLUGIN_OFFICIAL_PUBLIC_KEY)`
4. 失败 → toast + 审计日志（客户端 console / 未来 API）

### 发布（F4 ✅ 草案）

- `POST /api/plugins/publish` → 202 + `reviewId`（`PLUGIN_PUBLISH_ENABLED=true`）
- 人工合并到 `PLUGIN_CATALOG` 或 DB 表（v1.2.0 仍用静态 catalog + PR 流程）
- `GET /api/health` → `plugins.publishEnabled` · `plugins.officialKeyConfigured`

---

## 非目标（v1.2.0）

- VSIX
- 运行时 npm 动态加载未审核 URL
- 插件收入分成

---

## 后果

- `pluginCatalogService.ts` 扩展类型
- 新脚本 `scripts/sign-plugin-manifest.mjs`（维护者）
- 示例插件 `sdk-v2-status` 带官方签名样例
