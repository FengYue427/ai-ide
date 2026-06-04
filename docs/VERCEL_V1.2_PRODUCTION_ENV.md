# Vercel Production — v1.2.0 环境变量清单

> **基线**：[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) · **开关说明**：[V1.2_ENV.md](./V1.2_ENV.md)  
> **客户端生产默认（v1.2.6）**：[V1.2.6_F3_PROD_FLAGS.md](./V1.2.6_F3_PROD_FLAGS.md) · **设置页运维卡（v1.2.7）**：功能 → 插件运维  
> **原则**：v1.2.0 **默认行为与 v1.1.9 相同**；新能力通过 env **渐进开启**。

---

## 1. 必填（与 v1.1 相同）

| 变量 | Production 示例 | 备注 |
|------|-----------------|------|
| `DATABASE_URL` | `postgresql://...@...-pooler.../...?sslmode=require` | Neon **Pooled** |
| `AUTH_SECRET` | 随机 base64 32+ 字节 | 勿用本地 dev 值 |
| `APP_URL` | `https://ai-ide-flame.vercel.app` | OAuth / 支付回调依赖 |

验证：`GET /api/health` → `database: connected` · `checks.authSecretConfigured: true`

---

## 2. 构建命令（确认 Vercel 项目设置）

| 项 | 值 |
|----|-----|
| Build Command | `npm run build:deploy` |
| Output | `dist`（以 `vercel.json` 为准） |
| Node | 20.x |

`build:deploy` = migrate（若有 DB）+ `build:api` + `vite build` + `copy:website`

---

## 3. v1.2 客户端开关（默认 **不设** = 关）

在 Vercel → Settings → Environment Variables → **Production**：

| 变量 | 推荐初值 | 效果 |
|------|----------|------|
| `VITE_MULTI_ROOT` | v1.2.6 起生产默认 **开**（不设则开） | 多根工作区 UI |
| `VITE_PLUGIN_TRUST_MARKET` | （不设） | 市场签名校验门控 |
| `VITE_VIRTUAL_FILE_TREE` | 随 multi-root 默认开 | 大仓虚拟滚动 |
| `VITE_PLUGIN_OFFICIAL_PUBLIC_KEY` | （可选） | 覆盖内置官方公钥 |

**开启后必须 Redeploy Production。**

### 建议 rollout

1. **第 1 周**：保持全关，仅发 `1.2.0` 代码（bugfix / 性能在关开关下也可用）  
2. **第 2 周**：`VITE_MULTI_ROOT=true` → 观察侧栏与 autosave  
3. **第 3 周**：`VITE_PLUGIN_TRUST_MARKET=true` + 目录已签名条目齐全  
4. 大仓用户多时再开 `VITE_VIRTUAL_FILE_TREE=true`（或与 multi-root 同开）

---

## 4. v1.2 服务端（可选）

| 变量 | 推荐初值 | 效果 |
|------|----------|------|
| `PLUGIN_PUBLISH_ENABLED` | `false` 或不设 | `POST /api/plugins/publish` |
| `PLUGIN_OFFICIAL_PUBLIC_KEY` | base64 32-byte Ed25519 raw | health `plugins.officialKeyConfigured` |

与仓库 `src/lib/pluginTrustOfficialKey.ts` 中 `OFFICIAL_PLUGIN_PUBLIC_KEY_B64` 一致（或轮换后两边同步更新）。

CI 集成测试示例：

```env
PLUGIN_PUBLISH_ENABLED=true
PLUGIN_OFFICIAL_PUBLIC_KEY=<与签名脚本生成的公钥一致>
```

---

## 5. 禁止项（Production）

| 变量 | 原因 |
|------|------|
| `VITE_ALLOW_OFFLINE_AUTH` | 假登录风险 |
| `ALLOW_DEV_BILLING` | 绕过真实支付 |
| `ALIPAY_SANDBOX` | 沙箱误收款 |

本地校验：`node scripts/verify-env.mjs --production`（路径 A，不要求商户）

---

## 6. 部署后核对

```powershell
$env:APP_URL="https://ai-ide-flame.vercel.app"
npm run smoke:production -- $env:APP_URL
```

期望 health 一行含：

```text
v=1.2.0 ok db=connected ... plugins.publish=false officialKey=false
```

（`officialKey=true` 仅当设置了 `PLUGIN_OFFICIAL_PUBLIC_KEY`。）

---

## 7. 与支付宝 / OAuth（沿用 v1.1.8+）

- 支付宝：`ALIPAY_APP_ID` · 私钥 · 公钥 · notify URL → [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md)  
- OAuth：`VITE_ENABLE_OAUTH` + `AUTH_GITHUB_*` → [OAUTH_SETUP.md](./OAUTH_SETUP.md)  

v1.2.0 **不新增**支付或 OAuth 必填项。
