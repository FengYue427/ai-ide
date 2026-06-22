# AI IDE — 阿里云备案与国内部署指南

面向：**放弃 Vercel、在中国大陆运营**。本文覆盖 **备案前必须准备的前置条件**；备案通过后的部署步骤见文末。

> **P0 快速清单**：迁云前请先完成 [CN_LAUNCH_P0.md](./CN_LAUNCH_P0.md)，并运行 `npm run aliyun:p0 --env`。

> **重要**：ICP 备案必须由备案主体本人在 [beian.aliyun.com](https://beian.aliyun.com/) 提交，仓库无法代办。16 岁以下请提前确认所在省管局规则（常需监护人或个体户主体）。

---

## 一、备案前前置条件（按顺序做）

### 1. 阿里云账号

- [ ] [实名认证](https://account.aliyun.com/)（个人身份证或企业营业执照）
- [ ] 备案主体 = 实名主体（一个账号一个主体）

### 2. 域名

- [ ] 在 [阿里云域名](https://dc.console.aliyun.com/) 注册或 **转入** `.com` / `.cn`
- [ ] **域名实名认证**完成
- [ ] **持有人** = 未来 ICP 备案主体（姓名/证件号一致）
- [ ] 域名有效期 **距到期 >45 天**
- [ ] **备案提交前不要**把域名 A 记录解析到大陆 ECS 公网 IP

### 3. 中国内地云服务器（二选一）

| 产品 | 推荐规格 | 用途 |
|------|----------|------|
| **轻量应用服务器** | 2 核 4 GB，80 GB SSD，**内地地域** | 单人运维最简单 |
| **ECS** | ecs.c6.large 或同级 | 需更多扩展时用 |

- [ ] 系统：**Ubuntu 22.04 LTS**
- [ ] 地域：选与你 **身份证户籍/管局** 对应的省份（如「华东 1」「华北 2」— 以控制台说明为准）
- [ ] 安全组：放行 **22**（SSH，建议限自己的 IP）、**80**、**443**
- [ ] 记录 **公网 IP**（备案材料要用）

### 4. 备案服务号

- [ ] 打开轻量/ECS 控制台 → **备案** → 申请 **备案服务号**（绑定当前实例）
- [ ] 一台实例通常 5 个服务号；一个网站备案消耗 1 个

### 5. 云数据库 RDS PostgreSQL

- [ ] [RDS 控制台](https://rdsnext.console.aliyun.com/) 创建 **PostgreSQL 14+**
- [ ] **与 ECS 相同地域**
- [ ] 规格：`pg.n2.small.1` 或更高（开发期可最小规格）
- [ ] 创建数据库 `ai_ide` 与账号
- [ ] **白名单**：仅 ECS 内网 IP / 安全组（不要对 0.0.0.0/0 开放 5432）
- [ ] 连接串写入 `DATABASE_URL`（见 `deploy/aliyun/env.production.example`）

> 迁移说明：从 Neon 迁出时用 `pg_dump` / `pg_restore`；Prisma 在 ECS 上执行 `npm run db:migrate:deploy`。

### 6. 备案材料（个人主体 — 以系统实时提示为准）

- [ ] 身份证正反面
- [ ] 部分省：手持身份证、居住证、网站建设方案书
- [ ] **网站名称**：避免「平台、社区、论坛、在线 IDE」等敏感词；个人备案宜中性（如「某某的技术分享」）
- [ ] **网站简介**：如实描述；完整「注册+支付+SaaS」个人主体易被驳 — 见 [备案主体策略](#备案主体策略)

### 7. 本地仓库检查

```bash
node scripts/cn-preflight.mjs
node scripts/cn-preflight.mjs --env   # 准备好 .env.production 后
npm run aliyun:p0 --env               # P0 文档 + Flag + 支付回调检查
```

---

## 二、推荐采购清单（首年预算参考）

| 项目 | 约费用 |
|------|--------|
| 域名 `.com` | ¥60–80/年 |
| 轻量 2C4G | ¥50–100/月（新用户常有券） |
| RDS PostgreSQL 最小规格 | ¥100–200/月 |
| SSL 证书 | 免费 DV |
| **合计** | **约 ¥2000–4000/首年**（按活动价浮动） |

备案本身：**阿里云 ICP 代备案免费**。

---

## 三、备案主体策略（与 AI IDE 产品相关）

| 目标 | 建议主体 | 说明 |
|------|----------|------|
| 仅官网 + 下载 + 文档 | 个人（或监护人） | 网站先不上线用户注册 |
| Web IDE + 登录 + 云同步 | **个体工商户** | 个人备案长期风险高 |
| 支付宝订阅 | **个体工商户/企业** | 需商户号 + 已备案域名 |

产品功能与备案类型不匹配时，管局或云厂商可能 **驳回或注销备案**。

---

## 四、备案期间能否部署？

可以 **内测**，但不要对公网域名解析：

1. ECS 上安装 Node 20、Nginx、PM2
2. 用 **公网 IP** 或本机 `hosts` 指向 IP 测试（仅自己访问）
3. `curl http://ECS_IP/api/health` 应返回 JSON

**不要**在未备案时把正式域名解析到大陆 IP。

---

## 五、备案通过后 48 小时部署清单

### 1. 服务器初始化

```bash
# Ubuntu 22.04
sudo apt update && sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
sudo mkdir -p /opt/ai-ide
sudo chown $USER:$USER /opt/ai-ide
```

### 2. 上传构建产物

在开发机（推荐一键部署）：

```bash
cp .env.aliyun.example .env.aliyun          # ALIYUN_SSH、APP_URL、迁库 URL
cp deploy/aliyun/env.production.example .env.production
# 编辑 DATABASE_URL、AUTH_SECRET、APP_URL、支付宝等

npm run aliyun:deploy -- --with-env --skip-smoke   # 备案前
# 或分步: aliyun:build → aliyun:sync -- --with-env → aliyun:remote-install
```

手动 rsync 等价于 `npm run aliyun:sync`。Neon → RDS：`npm run db:migrate:neon-to-rds`（见 [CN_LAUNCH_P0.md](./CN_LAUNCH_P0.md)）。

### 3. 数据库迁移

```bash
cd /opt/ai-ide
npm run db:migrate:deploy
```

### 4. 启动 API

```bash
pm2 start deploy/aliyun/ecosystem.config.cjs
pm2 save && pm2 startup
```

本地等价命令：

```bash
npm run start:api:production
```

### 5. Nginx

```bash
sudo cp deploy/aliyun/nginx.conf.example /etc/nginx/conf.d/ai-ide.conf
# 编辑 YOUR_DOMAIN、root /opt/ai-ide/dist
sudo nginx -t && sudo systemctl reload nginx
```

### 6. DNS + SSL

- 域名 A 记录 → ECS 公网 IP
- 阿里云申请免费 SSL，或 `certbot`
- 更新 `APP_URL`、`AUTH_URL` 为 `https://域名`
- 配置 `deploy/aliyun/crontab.example` 中的定时任务（可选 `healthcheck.cron.example`）

### 7. 前端构建变量（生产）

复制 `.env.production.example` → `.env.production`，完整说明见 [ENV_PRODUCTION.md](./ENV_PRODUCTION.md)。至少：

```env
VITE_AI_GATEWAY=true
VITE_ALLOW_BYOK_LEGACY=false
VITE_TAB_PLUS_PLUS=true
VITE_AIDE_SPEC_ARTIFACTS_V2=true
VITE_AIDE_RUNTIME=true
VITE_AIDE_ACTIVITY_LINE=true
VITE_GA_LIVE=true
```

服务端 `.env.production` 另设 `PUBLIC_WELFARE_MODE=false`、`CRON_SECRET`、支付宝密钥。支付回调：

```bash
APP_URL=https://你的域名 node scripts/payment-notify-urls.mjs
```

重新 `npm run build:deploy` 并同步 `dist/`。

### 8. 首页 ICP 备案号

备案通过后，在网站底部悬挂 **ICP 备案号**，链接至 `https://beian.miit.gov.cn/`（代码中后续可加 Footer 组件）。

### 9. 验收

```bash
npm run smoke:production -- https://你的域名
npm run aliyun:p0 --env --url https://你的域名
node scripts/verify-env.mjs --production --v16-production --url https://你的域名
```

---

## 六、与 Vercel 的差异

| Vercel | 阿里云 |
|--------|--------|
| `vercel deploy` | rsync + PM2 + Nginx |
| `vercel.json` headers | `nginx.conf.example` |
| Vercel Cron | `crontab.example` |
| Neon 美区 | RDS 同地域 |
| Serverless `api/index.js` | 常驻 `scripts/local-dev-server.ts` |

---

## 七、常见问题

**Q：香港轻量要不要备案？**  
A：香港节点 **不需要** 大陆 ICP，但国内访问速度与合规性不如内地备案 + 内地机。

**Q：桌面版 API 地址？**  
A: 构建 Electron 时 `VITE_API_BASE_URL=https://你的备案域名`。

**Q：WebContainer 国内仍失败？**  
A：与备案无关，Stackblitz CDN 限制；推 **桌面版 + BYOK** 作为国内主路径。

---

## 相关链接

- [阿里云备案入口](https://beian.aliyun.com/)
- [备案流程概述](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/icp-filing-application-overview)
- [备案所需材料](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/required-materials)
