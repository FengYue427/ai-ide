# 竞品对比：AI IDE（2026-05）

> **我方**：AI IDE `v1.0.0-rc.1`（浏览器、开源、BYOK、Vercel+Prisma）  
> **对照**：**Cursor**、**Kiro**、并简要提及 **Windsurf**、**GitHub Copilot（IDE 内）**、**VS Code + 扩展**  
> **评分**：0 无 · 1 演示 · 2 可用 · 3 生产 · 4 领先（与 [IDE_GAP_CHECKLIST.md](./IDE_GAP_CHECKLIST.md) 一致）

---

## 1. 定位对比（一句话）

| 产品 | 定位 | 运行时 | AI 计费 |
|------|------|--------|---------|
| **AI IDE（我们）** | 开源浏览器轻量 IDE + 可选云工作区 | 浏览器 + WebContainer | BYOK；服务端仅配额 |
| **Cursor** | VS Code 分支，全仓 AI 主力 IDE | 桌面（Electron） | 订阅含模型额度 + BYOK 选项 |
| **Kiro** | 规格（Spec）驱动 + Agent 工作流 IDE | 桌面（基于 VS Code 系） | 平台/厂商集成为主 |
| **Windsurf** | Codeium 系 AI 原生 IDE | 桌面 | 平台订阅 |
| **Copilot in VS Code** | 插件增强传统 IDE | 桌面 | GitHub 订阅 |
| **VS Code** | 通用编辑器 + 扩展生态 | 桌面 / web 有限 | 依赖扩展 |

---

## 2. 综合评分表

| 维度 | AI IDE | Cursor | Kiro | 说明 |
|------|:------:|:------:|:----:|------|
| 编辑器核心 | **2.5** | 4.0 | 3.5 | 我们 Monaco 够用；缺多光标/重构深度 |
| 语言服务 / LSP | **1.5** | 4.0 | 3.5 | 我们 TS/JS extraLibs；无全语言 LSP |
| 代码库理解 | **1.5** | 4.0 | 3.0 | Cursor Index 领先；我们正则+可选 embedding |
| AI 编辑融合 | **2.0** | 4.0 | 3.5 | Tab 补全、Composer 他们更强 |
| Agent / 自动化 | **1.5** | 3.5 | **3.5** | Kiro 规格→任务链；我们 Agent+确认应用 |
| 运行 / 调试 / Git | **2.0** | 4.0 | 3.5 | 我们 WebContainer；他们原生调试 |
| 扩展 / MCP | **1.0** | 3.5 | 3.0 | 我们沙箱+官方插件目录；他们 VS Code 生态/MCP 成熟 |
| 协作 / 团队 | **1.0** | 2.5 | 2.0 | 我们 Beta；Cursor 有共享但非核心 |
| 商业化 / 部署 | **2.0** | 4.0 | 2.5 | 我们骨架全、收款未 live；Cursor 成熟订阅 |
| 开源 / 自托管 | **3.5** | 1.0 | 1.5 | **我方明显优势** |
| 零安装 / Web | **3.5** | 1.0 | 1.0 | **我方明显优势** |
| 国内支付友好 | **2.5** | 1.0 | 1.0 | 我们 CNY/支付宝微信骨架 |
| **综合（主力 IDE）** | **~1.8** | **~3.6** | **~3.0** | 约 **一代差距** |

---

## 3. 分项对照（用户可见能力）

### 3.1 编辑器与导航

| 能力 | AI IDE | Cursor | Kiro |
|------|--------|--------|------|
| 多文件 / 主题 | ✅ | ✅ | ✅ |
| 全局搜索替换 | ✅ 工作区级 | ✅ 更强 | ✅ |
| 跳定义 / 查引用 | 🔶 TS/JS | ✅ 全 LSP | ✅ |
| @ 文件/符号进 Chat | ✅ P3 注入 | ✅ | ✅ |
| 内联 Diff / Apply | ✅ 块级 | ✅ 更强 | ✅ |

### 3.2 AI 工作流

| 能力 | AI IDE | Cursor | Kiro |
|------|--------|--------|------|
| Chat + 选中上下文 | ✅ | ✅ | ✅ |
| 多文件 Composer/Agent | 🔶 Agent+确认 | ✅ Composer | ✅ Spec 驱动 |
| 项目 Rules | ✅ `.aide/rules.md` | ✅ `.cursorrules` | ✅ 规格文件 |
| Tab 补全 | 🔶 行级 | ✅ Copilot++ | 🔶 |
| 后台长任务 Agent | ❌ | ✅ | ✅ |
| MCP | 🔶 代理+设置 | ✅ | 🔶 |

### 3.3 平台与商业

| 能力 | AI IDE | Cursor | Kiro |
|------|--------|--------|------|
| 桌面原生 | ❌（长期 Electron） | ✅ | ✅ |
| 浏览器开箱 | ✅ | ❌ | ❌ |
| 账号云同步 | 🔶 API 有 | ✅ | ✅ |
| 插件市场 | 🔶 官方目录 M3 | ✅ VS Code | 🔶 |
| 实时协作 | 🔶 Beta | 🔶 | 🔶 |
| 定价透明 BYOK | ✅ | 混合 | 偏平台 |

---

## 4. SWOT（相对 Cursor / Kiro）

### 优势（S）

- **开源可审计、可 fork**，适合教学与国内二次部署。
- **真正的 Web IDE**：分享链接即可编码，无需安装。
- **BYOK**：数据与模型选择留在用户侧，适合隐私敏感团队。
- **国内支付与 CNY 套餐骨架**，Cursor/Kiro 几乎空白。
- **RC 已具备**：账号、云工作区、配额、Agent、插件沙箱与官方市场 UI。

### 劣势（W）

- **非桌面**，无完整 LSP/调试器，大仓与 native 工具弱。
- **代码库智能**明显弱于 Cursor Index。
- **品牌与社区**远小于 Cursor；Kiro 在规格驱动叙事上有鲜明标签。
- **插件**非 VS Code 兼容，生态从零开始。
- **协作**仅实验 Beta，不能对标 Live Share 级承诺。

### 机会（O）

- 国内开发者需要 **免翻墙、支付宝付款、自部署** 的 AI IDE 叙事。
- 企业 **内网部署 + BYOK** 与开源许可证组合销售服务。
- 课程/训练营 **一键模板 + 浏览器实验室**。
- MCP 与 Agent 协议标准化，我们已有代理层可加深。

### 威胁（T）

- Cursor / Windsurf 持续压低价格、加强 Tab 与 Agent。
- Kiro 占领「需求→规格→实现」心智，我们 Agent 故事偏通用。
- GitHub Copilot 免费档侵蚀轻量用户。
- 浏览器厂商与 StackBlitz 等 Web IDE 场景重叠。

---

## 5. 建议竞争策略（可执行）

1. **不正面打「替代 Cursor 做主力桌面 IDE」**；打 **「5 分钟 Web 开编 + 开源 + BYOK + 国内就绪」**。
2. **短期卖点**：模板、Agent 确认应用、`.aide/rules`、官方插件市场、配额透明公测。
3. **中期补齐**：P4 索引与 Tab 补全（缩小「一代差距」到 ~2.2 综合分）。
4. **对 Kiro 差异化**：强化 **轻量 Agent + 多文件 Diff**，暂不复制完整 Spec 工作流，除非单独立项。
5. **对 Copilot 差异化**：全 IDE 而不仅是补全；对 **VS Code** 强调零安装与一体化 AI 面板。

---

## 6. 评分更新记录

| 日期 | 综合分 | 变更 |
|------|--------|------|
| 2026-05（P3 前） | ~1.7 | IDE-3 + 差距清单初版 |
| 2026-05（P3 后） | **~1.8** | +C5b @ 注入、E5 Beta、E4 市场 M3、扩展维 0.5→1.0 |

下一轮目标（见 [PLAN_NEXT_2026.md](./PLAN_NEXT_2026.md)）：**≥ 2.2**（P4-1 索引 + P0' 上市稳定）。

---

## 7. 参考链接（官方/主流，2026）

- Cursor: [https://cursor.com](https://cursor.com)
- Kiro: [https://kiro.dev](https://kiro.dev)（AWS 系规格驱动 IDE 叙事）
- Windsurf: [https://codeium.com/windsurf](https://codeium.com/windsurf)
- GitHub Copilot: [https://github.com/features/copilot](https://github.com/features/copilot)
- 我方演示: [https://ai-ide.vercel.app](https://ai-ide.vercel.app)

*竞品功能以各厂商当期公开能力为准；私有路线可能领先公开文档。*
