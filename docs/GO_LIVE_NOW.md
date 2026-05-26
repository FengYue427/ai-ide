# 上线就绪确认（2026-05-26）

> **生产站**：https://ai-ide-flame.vercel.app  
> **最新代码**：`main` @ `314ce6c`（含 E2E/CI 修复与 IDE-4b-5）

---

## 自动验收（已通过）

| 检查 | 结果 | 时间 |
|------|------|------|
| `npm run smoke:report` | **5/5** | 见 [PRODUCTION_SMOKE_LAST.md](./PRODUCTION_SMOKE_LAST.md) |
| `GET /api/subscription/payment-methods` | `billingPath=B`, `alipay=true`, `devMock=false` | 2026-05-26 |
| 本地 `test:integration:local` | **22/22** | 你已跑通 |
| 生产支付宝真单 | ✅ | 历史验收 |

**结论：Web 正式版可以对外运营。**

---

## 发布当天（你手动，约 30 分钟）

### 1. Web（Vercel）

- [ ] Vercel → Deployments → 最新 `main` 为 **Ready**（`314ce6c` 或更新）
- [ ] 无痕打开站点 → 欢迎页有 **正式版** 徽章（`VITE_GA_LIVE`）
- [ ] 订阅弹窗：支付宝 + ¥19 / ¥49 + [付费说明](/legal/payment.html)

### 2. 对外公告

复制 [GA_ANNOUNCEMENT.md](./GA_ANNOUNCEMENT.md) **短版** 发到：

- [ ] GitHub Discussions / Issues 置顶
- [ ] 社群 / 朋友圈（可选）

### 3. 桌面版（可选第二渠道）

- [ ] GitHub → **Releases** → `v1.0.2` 含 `AI-IDE-*-win-portable.exe`（tag 推送后 Actions 构建）
- [ ] 公告中加一句：「Windows 可下载便携版，大项目 + 本机终端」

### 4. 72h 值班

按 [GA_POST_LAUNCH_72H.md](./GA_POST_LAUNCH_72H.md) 勾选 D0～D3。

---

## 非阻塞项（上线后可补）

| 项 | 说明 |
|----|------|
| `payment.html` 运营主体 | 法务填齐，避免合规追问 |
| `VITE_SENTRY_DSN` | 生产错误观测 |
| 自定义域名 | 改善国内 `vercel.app` 访问 |
| IDE-4b 真机验收 | Ctrl+O 大仓 + Agent 终端 |

---

## 一键复验命令

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run smoke:report
npm run test:local
```

```powershell
# 生产计费摘要（PowerShell）
(Invoke-RestMethod https://ai-ide-flame.vercel.app/api/subscription/payment-methods) | ConvertTo-Json -Depth 5
```

---

## 回滚

Vercel → 上一稳定 Deployment → **Promote to Production**。详见 [GA_POST_LAUNCH_72H.md](./GA_POST_LAUNCH_72H.md) §事故回滚。
