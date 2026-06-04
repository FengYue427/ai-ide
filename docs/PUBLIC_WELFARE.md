# 公益免费 IDE 模式

> **定位**：永久 **不收取订阅费** 的开源 AI IDE；先解决「收费」与「国内打不开网页」两大痛点，再谈增长与捐赠。

---

## 1. 开启方式（Vercel + 本地）

| 变量 | 作用 |
|------|------|
| `PUBLIC_WELFARE_MODE=true` | **API**：关闭支付宝/微信/Stripe/dev_mock 结账；登录用户配额按 **专业版**；`/api/subscription` 返回公益说明 |
| `VITE_PUBLIC_WELFARE=true` | **前端构建**：隐藏「升级套餐」按钮，显示「公益免费」徽标 |

**生产建议**（Vercel Environment Variables）：

```env
PUBLIC_WELFARE_MODE=true
VITE_PUBLIC_WELFARE=true
# 不要配置 STRIPE_*、ALIPAY_*、WECHAT_*（除非关闭公益模式）
```

本地 `.env.local` 同样加上上述两项后 `npm run dev:stack`。

验证：

```bash
curl https://你的域名/api/health
# billing.publicWelfare: true

curl https://你的域名/api/subscription/payment-methods
# publicWelfare: true, alipay/stripe/devMock: false
```

---

## 2. 配额（当前代码）

| 计划 | AI / 日 | 工作区 |
|------|---------|--------|
| 免费（游客与未登录） | **5000** | **不限** |
| 登录 + 公益模式 | 按 **pro** 限额（同上） | 不限 |

平台 AI 仍消耗你的 API Key 成本 → 长期靠 **BYOK** 与赞助分担。

---

## 3. 国内访问（与收费分开）

| 问题 | 做法 |
|------|------|
| 浏览器打不开 vercel.app | 见 [CHINA_ACCESS.md](./CHINA_ACCESS.md) |
| **桌面版（推荐）** | `npm run electron:pack` → 内置 **本地 UI**，仅 API 走 `VITE_API_BASE_URL` |
| API 仍被墙 | 将 `VITE_API_BASE_URL` / `AI_IDE_APP_URL` 改为 **香港镜像** 后重新 `build:electron` + 打包 |

远程壳（旧行为）：`AI_IDE_DESKTOP_REMOTE=1 npm run electron:start`

---

## 4. 变现替代（不收费）

- **GitHub Sponsors / 爱发电** — 自愿支持  
- **BYOK** — 用户自付模型费  
- **企业定制 / 培训** — 合同收入，不走订阅系统  

出售/收购见 [EXIT_AND_VALUATION.md](./EXIT_AND_VALUATION.md)（可选，非当前重点）。

---

## 5. 恢复收费（若将来需要）

1. 去掉 `PUBLIC_WELFARE_MODE` / `VITE_PUBLIC_WELFARE`  
2. 配置 Stripe 或国内商户  
3. 重新部署  

计费代码保留在仓库中，仅被公益开关关闭。
