# 上线前深度审查（非明显 Bug）

> **日期**：2026-05-26  
> **方法**：静态代码 + 已有 [AUDIT_FULL_2026-05.md](./AUDIT_FULL_2026-05.md) + 生产探测 + `go-live:preflight`  
> **结论**：**无 P0 阻塞上线**；下列为风险接受、文档债与上线后改进项。

---

## 1. 自动化复验（刚执行）

| 项 | 结果 |
|----|------|
| `test:local` | ✅ 197/197 |
| `smoke:report` | ✅ 5/5 |
| 生产 `billingPath=B` | ✅ |
| `npm run build` | ✅（此前已通过） |

---

## 2. 安全与滥用（非表面 Bug）

| # | 项 | 级别 | 说明 |
|---|-----|:----:|------|
| R1 | **桌面版 `run_command` 本机 shell** | 🟡 | Electron `spawn(..., { shell: true })`，Agent/用户可执行任意命令；**设计如此**，需在对外说明「仅打开可信项目」 |
| R2 | **Agent `write_file` 默认不自动写入** | ✅ | `autoApplyWrites` 默认 `false`，先 Diff 再应用；降低误删库风险 |
| R3 | **路径穿越** | ✅ | `normalizeProjectPath` + `resolveUnderRoot` 双重校验 |
| R4 | **MCP 代理 SSRF** | ✅ 已修 | 需登录 + 内网段拦截（见 AUDIT） |
| R5 | **插件沙箱** | 🟡 | Worker + 权限网关；`terminal` 全权已禁；第三方 JSON 插件仍需谨慎 |
| R6 | **支付宝 `formHtml` → innerHTML** | 🟡 | 仅信任自家 API 返回；若 API 被攻破可 XSS — 依赖 Vercel 与密钥安全 |
| R7 | **API Key 存 localStorage** | 🟡 | BYOK 行业标准做法；依赖 CSP + 无 XSS；提醒用户勿在公共机登录 |
| R8 | **glob 转 RegExp** | 🟢 | Agent `list_files` 的 glob 由模型传入，极端模式可能 ReDoS；影响面小 |
| R9 | **多实例限流** | 🟢 | KV 不可用时回落内存桶，Serverless 多实例时限流略弱 |
| R10 | **协作 WebRTC Beta** | 🟢 | 非主路径；未作为 GA 卖点 |

---

## 3. 产品与体验债（用户会感到「不好用」但不是 Bug）

| # | 项 | 影响 |
|---|-----|------|
| P1 | **文档与实现不一致** | `BROWSER_LIMITATIONS.md` 仍写浏览器 500 文件；桌面已 2000 — 易误导 |
| P2 | **无全语言 LSP/调试器** | 专业用户会差评，需在宣传中写清边界 |
| P3 | **WebContainer 冷启动** | 首次 `npm install` 慢，演示视频需剪等待 |
| P4 | **国内 vercel.app** | 部分网络超时 — 非代码问题 |
| P5 | **i18n 未 100%** | 仍有零散硬编码；英文路径可用但不如中文完整 |
| P6 | **块级 Diff / Tab FIM** | IDE-5 未做；Agent 体验弱于 Cursor/Windsurf |
| P7 | **health `prismaRouter=unavailable`** | Vercel 路由形态，DB 仍 connected |

---

## 4. 运维与合规（上线后 72h）

| # | 项 | 状态 |
|---|-----|:----:|
| O1 | Sentry 生产 DSN | 🔶 未配则盲飞 |
| O2 | `payment.html` 运营主体 | 🔶 法务 |
| O3 | 支付宝对账 cron | 🔶 需确认 Vercel Cron + secret |
| O4 | 邮件找回密码 SMTP | 🔶 未配则功能不可用 |
| O5 | `billing:reconcile` 日常 | 🔶 有单后必跑 |

---

## 5. 宣传合规（尤其小红书 / 未成年创作者）

| 建议 | 说明 |
|------|------|
| 不提付费/价格/副业 | 已写入 XIAOHONGSHU_POST 自查表 |
| 16 岁表述 | 用「课余」「刚满十六」，避免夸大商业性质 |
| 平台年龄规则 | 部分平台对未成年人账号/实名有要求，以平台规则为准 |
| 勿承诺「替代 Cursor」 | 减少争议与期望落差 |

---

## 6. 代码结构健康度

| 维度 | 评价 |
|------|------|
| 测试覆盖 | 核心 billing/agent/index 有单测；E2E 覆盖壳层 UI |
| 类型 | `tsc --noEmit` 通过；少量 `any` 在非关键 UI |
| 依赖 | Electron/updater 仅桌面；Web 包体 Monaco 较大（已知） |
| 密钥 | `.env.local` 已 ignore；生产 env 在 Vercel |

---

## 7. 总评

| 问题类型 | 能否上线 |
|----------|:--------:|
| P0 安全漏洞（未修） | 无 |
| 明显功能 Bug | 测试未检出 |
| 体验/竞品差距 | 有，已文档化 |
| 运维盲区 | 可上线，72h 内补 Sentry/对账 |

**可以维持对外运营**；宣传时坚持边界话术，桌面版提醒「本机命令行权限」，Agent 默认 Diff 预览保持开启。

---

## 8. 建议上线后 2 周内修（非紧急）

1. 同步更新 `BROWSER_LIMITATIONS.md`（500 vs 2000）  
2. 配 `VITE_SENTRY_DSN`  
3. 自定义域名（国内访问）  
4. IDE-5-1 块级 Diff（减少 Agent 误改焦虑）
