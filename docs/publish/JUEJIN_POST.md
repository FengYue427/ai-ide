# 掘金发布稿（复制到编辑器）

> **建议分类**：前端 / 开源 / 人工智能  
> **建议标签**：`AI` `开源` `IDE` `Agent` `DeepSeek` `独立开发`  
> **封面**：使用同目录 [juejin-cover-ai-ide-v1.png](./juejin-cover-ai-ide-v1.png)（16:9，掘金编辑器 → 上传封面）  
> **仓库链接**：https://github.com/FengYue427/ai-ide

---

## 标题（二选一）

1. **AI IDE v1.0 正式上线：浏览器里用 Agent 改你电脑上的项目，支持支付宝 ¥19**
2. **不用装 Cursor 也能玩 Agent：开源 AI IDE 正式版，BYOK + 本机文件夹 + Windows 桌面版**

---

## 正文（Markdown）

### 前言

做独立项目或前端脚本时，我经常遇到三个痛点：

1. **机房 / 公司电脑不让随便装 IDE**
2. **Cursor 等工具是美元订阅，国内支付不方便**
3. **已有 DeepSeek / 通义 Key，希望 Key 留在自己手里**

所以我们把 **AI IDE** 从 RC 公测推进到了 **v1.0.4.4**（1.0.4.x 收官）：在浏览器里打开就能用，也可以下载 **Windows 便携版** 处理更大的本地仓库。

- 在线体验：https://ai-ide-flame.vercel.app
- 开源仓库：https://github.com/FengYue427/ai-ide
- Windows 下载：https://github.com/FengYue427/ai-ide/releases/latest

---

### 这是什么？

**AI IDE** 是一个开源的 **AI 原生轻量 IDE**：

- **浏览器优先**：Chrome / Edge 打开即用，基于 Monaco 编辑器
- **工具 Agent**：`list_files` / `read_file` / `write_file` / `search_repo` / `run_command`，多轮改码 + Diff 预览
- **本机项目**：通过 File System Access（浏览器）或桌面版直接扫盘
- **BYOK**：API Key 存在本地，默认不强制走平台模型
- **国内订阅**：专业版 **¥19/月**、团队版 **¥49/月**，**支付宝**（Path B 已生产验收）

---

### 3 分钟试用路径

1. 打开 https://ai-ide-flame.vercel.app  
2. **打开本机项目**（或新建模板）  
3. 右侧 **AI Chat → Agent**，例如：「给 index.js 加一个 hello 函数并写单测」  
4. 设置里填入 **DeepSeek**（或其他已支持提供商）的 API Key  
5. （可选）订阅页查看 **支付宝** 升级专业版配额（约 5000 次/日 AI 用量）

---

### Windows 桌面版（IDE-4b）

适合 **>500 文件** 或需要 **本机 shell** 的场景：

- 便携版 / 安装包见 [GitHub Releases](https://github.com/FengYue427/ai-ide/releases/latest)
- **Ctrl+O** 打开文件夹，最多约 2000 文件导入
- Agent `run_command` 在项目根执行（如 `node -v`、`npm test`）
- UI 仍加载线上站点，登录与支付与 Web 一致

---

### 和 Cursor / Windsurf 怎么比？

我们**不**主打「替代 VS Code + 全语言调试器 + 插件市场」。

| 场景 | 更合适 |
|------|--------|
| 专业 C++/Java + 调试器 + 插件链 | Cursor / Windsurf |
| 浏览器开箱、人民币订阅、自带 Key | **AI IDE** |
| 教室 / 不能装软件 | **AI IDE** |
| 小仓前端 / 脚本 / 个人项目 | **AI IDE** |

一句话：**Cursor 入门档 Agent 体验的约 70%，加上国内支付宝和 BYOK。**

---

### 技术栈（给开发者）

- 前端：React + Vite + Monaco + Zustand  
- 后端：Vercel Serverless + Prisma + Neon  
- 支付：支付宝生产（`billingPath=B`）  
- 桌面：Electron + remote shell + electron-updater  
- 测试：`test:local` 197 项 + 生产 smoke 5/5  

欢迎 Star、提 Issue、PR。路线图见仓库 `docs/PLAN_IDE5_AND_COMPETITORS.md`（块级 Diff、Tab FIM 等）。

---

### 已知限制（诚实说）

- 浏览器内运行依赖 **WebContainer**，不是完整本机 Node  
- 浏览器版本机文件夹建议 **<500 文件**；大仓请用桌面版  
- 暂无全语言 DAP 调试器、不兼容 VSIX  
- 部分网络访问 `*.vercel.app` 可能较慢，自定义域名在规划中  

---

### 链接

- 站点：https://ai-ide-flame.vercel.app  
- 仓库：https://github.com/FengYue427/ai-ide  
- 反馈：https://github.com/FengYue427/ai-ide/issues  
- 付费说明：站点内 `/legal/payment.html`  

如果试用后有问题，欢迎在 Issue 里带复现步骤，我们会按 72h 值班节奏跟进。

---

 *本文由项目维护者发布，版本 v1.0.4.4。*
