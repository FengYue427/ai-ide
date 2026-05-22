# P0 / P1 安全加固（2026-05 续）

> 承接 [AUDIT_FULL_2026-05.md](./AUDIT_FULL_2026-05.md) 地毯审查未闭环项。

## P0（已落地）

| 项 | 改动 |
|----|------|
| 插件沙箱 | Worker 内仍 `Function`，但主线程 **API 权限网关**；生产禁止主线程 `runPluginActivate` |
| terminal 全权 | 清单禁止 `terminal`，仅 `terminal:safe`；生产插件终端恒为 safe 白名单 |
| 危险源码模式 | 扩展 `validatePluginSource` 拦截 Proxy/Reflect/globalThis 等 |
| AUTH_SECRET | `jwt.ts` 生产缺 secret 抛错；`security-baseline.mjs` 静态校验 |
| dev_mock | `VERCEL_ENV=production` 与 `NODE_ENV=production` 双禁 |

## P1（已落地）

| 项 | 改动 |
|----|------|
| 用量 POST | 忽略客户端 `amount`，服务端每次固定 `consumeAiUsage(..., 1)` |
| 登录配额 | `recordAIUsageEvent` 失败抛 `QuotaSyncError`，不再偷偷写 localStorage |
| 配额读取 | 登录用户优先服务端；离线用 **当日 session 缓存**，无缓存则 fail-closed |
| 终端 safe | 禁 `npx`、`node -e`；`npm` 仅允许 test/install/run 等子命令 |
| 设置「功能」Tab | 增加「能力说明」文案，标明非开关 |

## 仍属架构债（未在本轮消除）

- Worker 内 `new Function`（需 iframe/WASM 或仅内置插件才能彻底去掉）
- AI 请求不经服务端 BFF 代理（密钥仍在浏览器）；**已改为请求前预扣配额**，降低并发超额

## 续：i18n 第一批（同周）

见 `src/i18n/translations.ts` — 欢迎页、工具栏、登录弹窗、Chat 欢迎语已接入 `t()`。

## 验证

```bash
npm run test:local
npm run p0:gate
```
