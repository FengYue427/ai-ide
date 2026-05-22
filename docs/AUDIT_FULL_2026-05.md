# 地毯式审查报告（2026-05）

> 范围：`ai-ide` 全栈 · 安全 · 视觉 · 设置功能 · 本地化  
> 方法：静态代码审查 + 子模块探索 + 关键路径人工核对  
> **本次已修复项**见文末「已落地修复」

---

## 1. 执行摘要

| 维度 | 结论 | 风险等级 |
|------|------|----------|
| **安全** | 无 React `dangerouslySetInnerHTML`；Prisma 防 SQL 注入良好；**MCP 代理 SSRF** 与插件沙箱为最大风险 | P0～P1 |
| **视觉 / 层级** | 设置层 z-index 曾挡住确认框；Toast 在设置之下 | 已修 1 项 |
| **设置中心** | AI/主题/自动保存/MCP/规则可用；语言曾无效；功能列表仅为展示 | 部分已修 |
| **本地化** | **无完整 i18n**；大量硬编码中文；`I18nProvider` 仅 ~15 个 key | 架构债 |

---

## 2. 安全审查

### 2.1 P0 — 必须处理

| # | 问题 | 位置 | 状态 |
|---|------|------|------|
| S1 | **`POST /api/mcp/proxy` 无登录即可 SSRF** | `lib/api/handlers/mcp/proxy.ts` | ✅ 已加 `requireAuth` |
| S2 | SSRF 仅拦 localhost，未拦内网段 | `lib/api/mcpProxy.ts` | ✅ 已拦 10/8、172.16–31、169.254 等 |
| S3 | 客户端可传 `Authorization`/`Cookie` 到上游 | `mcp/proxy.ts` headers | ✅ `sanitizeMcpProxyHeaders` |
| S4 | 插件 `new Function` 执行 + 权限未强制 | `pluginSandboxRunner.ts` | 🔶 Worker 隔离 + 权限网关；禁止 `terminal` 全权 |
| S5 | 生产 `AUTH_SECRET` 未设时开发回退密钥 | `src/lib/jwt.ts` | ✅ 生产缺 secret 抛错 + baseline 检查 |

### 2.2 P1 — 应尽快处理

| # | 问题 | 说明 |
|---|------|------|
| S6 | `POST /api/usage/ai` 信任客户端 `amount` | ✅ 服务端固定每次 +1 |
| S7 | 配额失败时前端可继续用本地额度 | `usageService.ts` | ✅ 登录用户 fail-closed + 会话缓存 |
| S8 | `dev_mock` 结账在错误 env 可假升级 | `billingMode.ts` | ✅ `VERCEL_ENV`/`NODE_ENV` production 禁用 |
| S9 | 插件 `terminal` 权限可执行任意命令 | `pluginTerminalPolicy.ts` | ✅ 仅 safe 白名单；禁止 `terminal` 全权 |
| S10 | API 500 曾返回内部 `error.message` | ✅ 生产环境已隐藏 `detail` |

### 2.3 做得好的地方

- 工作区 API：`requireAuth` + `userId` 归属校验
- 支付：Stripe/支付宝/微信签名校验 + `fulfillOrder` 幂等
- 无 `/api/admin` 公开路由；管理仅 CLI `scripts/admin-lookup.ts`
- XSS：插件弹窗、聊天内容走 React 文本节点；CSP 在 `vercel.json`
- 注册/登录/忘记密码/workspace 写操作有限流

---

## 3. 视觉与布局

### 3.1 z-index 层级（修复后）

| 层 | z-index | 文件 |
|----|---------|------|
| Auth | 2500 | `auth.css` |
| **Confirm** | **2200** | `overlays.css` ← 原 1700，会被设置挡住 |
| Settings / Welcome | 2000 | `settings.css`, `welcome.css` |
| Toast | 1800 | `overlays.css` |
| ModalShell | 1000 | `overlays.css` |

**现象（已修）**：在设置中心点「清理本地数据」时，确认框在设置蒙层**下面**，用户以为无响应。

### 3.2 溢出与比例

| 区域 | 风险 | 建议 |
|------|------|------|
| `.settings-dialog` `overflow:hidden` | 窄屏侧栏可能被裁切 | 已有 `@media (max-width: 860px)` 堆叠 |
| `.agent-apply-layout` `min-height:420px` | 矮屏 Agent 弹窗拥挤 | 小屏可再降 min-height |
| `.sidebar-outline` `max-height:42vh` | 大纲列表偏短 | 可接受 |
| 欢迎页 + 设置同为 2000 | 同时打开时依赖 DOM 顺序 | 一般互斥，低风险 |

### 3.3 建议人工点检（浏览器）

1. 1280×720、390×844 下打开 **设置中心** 五 Tab 是否都能滚动到底  
2. **订阅弹窗** 三列套餐是否换行正常  
3. **Chat + Agent 条** 是否与输入框重叠  
4. **协作 Beta 面板** 在线列表是否被右侧面板裁切  

---

## 4. 设置中心功能核对

| Tab | 控件 | 是否生效 | 备注 |
|-----|------|----------|------|
| AI | 提供商 / Key / 模型 / Ollama | ✅ | 保存 → `ideStore` + `unifiedStorage` |
| AI | 配额展示 | ✅ 只读 | `QuotaIndicator` |
| 外观 | 浅色/深色 | ✅ | 通过 `onToggleTheme`（与打开时不一致时翻转） |
| 外观 | 界面语言 | ✅ **已修** | `zh-CN`/`en-US` + `useI18n().setLanguage` |
| 编辑器 | 自动保存 Toggle | ✅ | |
| 编辑器 | 「编辑偏好」 | ⬜ 占位 | 无子项 |
| 功能 | 五项能力列表 | ✅ **能力说明** | 已标注非开关；MCP/规则可配置 |
| 功能 | 项目规则 | ✅ | 跳转 `.aide/rules.md` |
| 功能 | MCP + Agent 跟进 | ✅ | 保存时 `persistMcpRef` |
| 高级 | 清理本地数据 | ✅ | 确认框层级已修 |
| 高级 | 恢复默认 | ✅ **已修** | 现同步写入 `ai-config` |
| 高级 | 实验功能 | ⬜ 文案「暂未开放」 | |

### 4.1 重复入口（产品债）

- **AI 设置**：`SettingsCenter` AI Tab 与 `AISettingsModal`（状态栏）重复  
- **主题**：设置「外观」与 `ThemeSelector` 命令面板重复  

---

## 5. 本地化（i18n）

### 5.1 现状

- 存在 `src/i18n/index.tsx`（`I18nProvider` + 约 15 个 `t()` key）
- **绝大多数 UI 仍为硬编码中文**（欢迎页、工具栏、Chat、各 Modal）
- 切换「English」**不会**翻译整站，仅影响：
  - 存储的 `language` 值（`zh-CN` / `en-US`）
  - 状态栏语言 pill 文案
  - 未来接入 `t()` 的少量位置

### 5.2 硬编码集中区（优先国际化）

| 优先级 | 文件 |
|--------|------|
| P0 | `WelcomeScreen.tsx`, `AppToolbar.tsx`, `ChatPanel.tsx` |
| P1 | `SettingsCenter.tsx`, `AuthModal.tsx`, `SubscriptionModal.tsx` |
| P2 | `CommandPalette.tsx`, `WorkspaceManager.tsx`, `PluginManager.tsx` |
| P3 | `services/*` 错误字符串、`notify` 文案 |

### 5.3 中英混用示例

- `AuthModal`：中文标题 + 英文 placeholder `name@example.com`
- `SettingsCenter` 侧栏 kicker：`Settings Center`（英文）+ 中文标题
- `StatusBar`：`Untitled`、Monaco 语言名英文

### 5.4 建议路线

1. 扩展 `translations/zh-CN` 与 `en-US` JSON（或按模块拆分）  
2. 用 `t('key')` 替换组件字符串（可按页面分批）  
3. 设置保存时只调 `setLanguage`，**不要** `location.reload()`（已移除）  

---

## 6. 其它代码质量

| 项 | 说明 |
|----|------|
| TODO 扫描 | 仅 `codeReviewService` 检测用户代码里的 TODO，无大量工程 TODO |
| 离线登录 | `VITE_ALLOW_OFFLINE_AUTH` 生产必须关闭 |
| API Key | BYOK 存浏览器，依赖 CSP + 用户环境安全 |
| E2E | 12 项 UI 通过；集成 22 项 API 通过 |

---

## 7. 已落地修复（本轮代码）

| 修复 | 文件 |
|------|------|
| MCP 代理需登录 + SSRF 加固 + 头过滤 | `mcp/proxy.ts`, `mcpProxy.ts` |
| 确认框 z-index 高于设置 | `overlays.css` |
| 语言 `zh`/`en` → `zh-CN`/`en-US`，接通 `useI18n` | `language.ts`, `PanelHost.tsx`, `SettingsCenter.tsx`, `i18n/index.tsx` |
| 重置默认写入 `ai-config` | `PanelHost.tsx` |
| 用量 POST 服务端固定 +1 | `usage/ai.ts` |
| 登录配额 fail-closed + 缓存 | `usageService.ts` |
| 禁止 terminal 全权 / safe 白名单收紧 | `pluginPermissions.ts`, `pluginTerminalPolicy.ts` |
| dev_mock 禁 Vercel production | `billingMode.ts` |
| Worker API 权限网关 | `pluginSandboxRunner.ts` |
| 生产 API 500 不泄露 stack | `api/index.ts` |
| 设置打开时同步 props | `SettingsCenter.tsx` useEffect |

---

## 8. 建议后续排期

| 周 | 内容 |
|----|------|
| W1 | 插件沙箱改 iframe/WASM 或禁用生产 `Function`；usage 服务端计量 |
| W2 | i18n 第一批：工具栏 + 欢迎页 + Auth |
| W3 | 设置「功能」改为真实开关或改文案为「能力说明」 |
| W4 | 视觉回归截图 CI（Playwright visual 可选） |

---

## 9. 人工验收清单（请你本地勾选）

- [ ] 设置 → 外观 → 切 English → 状态栏显示 English（整站仍中文属预期，直到 i18n 铺完）  
- [ ] 设置 → 高级 → 清理数据 → **确认框在最上层**  
- [ ] 设置 → AI 改 Key → 保存 → Chat 可用  
- [ ] 设置 → 功能 → MCP 增删 → 保存 → 仍生效  
- [ ] 未登录访问 MCP：应 401（需登录后才能在设置里测 MCP）  
- [ ] 移动端宽度下设置五 Tab 无遮挡  

---

*审查人：自动化 + 静态分析；生产行为以你当前 Ready 部署为准。*
