# 国内访问方案（必读）

> **问题**：`https://ai-ide-flame.vercel.app` 等 `*.vercel.app` 在中国大陆经常 **慢、超时或完全打不开**（需代理）。  
> **影响**：浏览器入口不稳定；登录/云同步依赖 API 可达。  
> **结论**：国内主推 **桌面离线 UI**（`npm run electron:pack`）+ 日后 **香港 API**；见 [PUBLIC_WELFARE.md](./PUBLIC_WELFARE.md)（公益免费、已关闭订阅收款）。

---

## 1. 先搞清楚「坏在哪」

| 层级 | 是否依赖 Vercel 域名 | 国内典型情况 |
|------|----------------------|--------------|
| 打开网页 / 加载 JS | ✅ 是 | 最容易挂 |
| 调用 `/api/*`（登录、AI、云工作区） | ✅ 同域 | 网页能开但登录失败 = API 也挂了 |
| 仅 BYOK + 本地 IndexedDB | 🔶 页面能加载才行 | 页面打开后部分能力可离线编辑 |
| Neon 数据库 | 服务端出国访问 | 一般可连，但 API 必须先能访问 |
| 桌面版 Electron | ⚠️ **默认仍加载线上 URL** | 见 `electron/main.mjs`，**不自动解决** |

在境内手机 4G/WiFi 上自测（关代理）：能打开 / 不能打开 / 要加载多久 —— 录屏留证，视频里用真实结果说话。

---

## 2. 短期（发视频前必做）

### A. 视频与简介 **诚实引流**

口播建议：

> 国内访问 `vercel.app` 可能不稳定。  
> **推荐**：点 GitHub  Releases 桌面版，或按文档 **本地一键启动**；  
> 我们在做 **国内可访问镜像域名**（见下方）。

简介 **不要只放一个 vercel 链接**。至少：

```text
【国内网络】在线站可能需代理 → 优先：
· GitHub：https://github.com/FengYue427/ai-ide
· Releases 桌面版：（贴最新 release 链接）
· 本地运行：见仓库 README「本地开发」npm run dev:stack

【可访问时】在线体验：https://ai-ide-flame.vercel.app
```

### B. 本地一键启动（给愿意折腾的观众）

```powershell
git clone https://github.com/FengYue427/ai-ide.git
cd ai-ide
npm ci
# 配置 .env.local：DATABASE_URL、AUTH_SECRET（见 .env.example）
npm run dev:stack
# 浏览器打开 http://127.0.0.1:3000
```

适合：开发者观众、教程向内容。**不适合**「点开就玩」的小白（步骤多）。

### C. 自定义域名（**缓解，非根治**）

见 [CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md)：绑定自己的 `ide.xxx.com` → CNAME 到 Vercel。

- 有时比 `*.vercel.app` 好一点点  
- **不保证**大陆直连稳定（流量仍可能走境外）  
- 仍须改 `APP_URL`、OAuth、支付宝回调

---

## 3. 中期推荐：香港 / 新加坡节点（性价比最高）

**思路**：用户访问 **境内更友好的域名** → 解析到 **香港轻量服务器** → Nginx 托管 `dist/` + 反代 Node API。

| 项 | 建议 |
|----|------|
| 机器 | 腾讯云 / 阿里云 **香港** 轻量 2C2G（学生价常有优惠） |
| 系统 | Ubuntu 22.04 |
| 进程 | `node` 跑 API（`npm run dev:api` 或 PM2 + 生产构建） |
| 静态 | `dist/` 由 Nginx `root` |
| 数据库 | 继续 **Neon**（服务器在境外连 Neon 通常没问题） |
| 域名 | `ide.你的域名.com` A 记录到 HK IP |
| 备案 | **香港服务器通常不需要大陆 ICP 备案** |

**环境变量**：`APP_URL=https://ide.你的域名.com`（与浏览器栏一致）

**不必立刻抛弃 Vercel**：可保留 Vercel 作海外/备用；国内主宣传用 HK 域名。

### 部署骨架（运维备忘）

```bash
# 服务器上
git clone https://github.com/FengYue427/ai-ide.git && cd ai-ide
npm ci
cp .env.example .env  # 填 DATABASE_URL、AUTH_SECRET、AI Key 等
npm run build:deploy
# API：PORT=3001 node 或 pm2 启动 scripts/local-dev-server 同等生产入口
# Nginx：/ → dist/index.html；/api/ → proxy_pass http://127.0.0.1:3001
```

（具体 Nginx 配置可按发版时补进 `docs/deploy/nginx-hk.example.conf`。）

---

## 4. 长期：大陆节点 + 备案（可选）

若要做到 **绝大多数大陆用户无感**：

| 项 | 说明 |
|----|------|
| 前端 | 阿里云 OSS + CDN / 腾讯云静态托管 |
| API | 云函数 SCF / 函数计算 FC / 容器服务 |
| 备案 | `.cn` 或 mainland 解析 **需要 ICP**（个人/企业流程） |
| 支付 | 支付宝 notify 必须 **大陆可访问的 HTTPS 域名** |

16 岁个人开发者备案可能受限 → **优先 HK + 桌面版 + 本地文档**，备案可等合作方/公司主体。

---

## 5. 国内友好 PaaS（可调研）

以下需自行注册、测速、对照项目 `build:deploy`：

- **Zeabur**（部分团队用于两岸访问优化）
- **腾讯云 CloudBase / Web 应用托管**
- **阿里云轻量 + 容器**
- **Sealos** 等开源云操作系统

无「一键迁移」；都要改 `APP_URL` 与环境变量。

---

## 6. 桌面版说明（避免误导）

当前 Electron **默认加载** `https://ai-ide-flame.vercel.app`（`electron/main.mjs`）。

- 国内用户装桌面版 **若线上打不开，桌面同样打不开**  
- 改进方向（产品待做）：`build:electron` 打包 **内置 dist**，`loadFile` 本地 UI，仅 API 走可配置域名  

发视频前若未改代码：**不要宣传「下载桌面版就能绕过翻墙」**。

---

## 7. 检查清单（发 B 站前）

- [ ] 境内网络（关 VPN）测 `ai-ide-flame.vercel.app` 并录屏  
- [ ] 简介含 GitHub + 本地启动 +（若有）国内镜像域名  
- [ ] 视频口播说明 vercel 限制  
- [ ] 支付宝 / OAuth 回调域名与 **用户实际访问域名** 一致  
- [ ] 欢迎页网络提示已显示（`welcome.networkTips`）  

---

## 8. 相关文档

| 文档 | 内容 |
|------|------|
| [CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md) | Vercel 自定义域 |
| [BROWSER_LIMITATIONS.md](./BROWSER_LIMITATIONS.md) | 含国内 vercel 一行 |
| [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) | 通用上线 |
| [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) | 支付宝 notify 必须公网可达 |
