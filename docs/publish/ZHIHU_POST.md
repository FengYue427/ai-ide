# 知乎发布稿

> **形式**：建议发 **专栏文章**（可同步到想法引流）  
> **封面**：复用 [juejin-cover-ai-ide-v1.png](./juejin-cover-ai-ide-v1.png) 或产品截图  
> **话题**：#AI编程 #开源 #独立开发 #前端 #DeepSeek

---

## 专栏标题（选 1）

1. 我做了一个浏览器里的 AI IDE：不用装软件，Agent 能改你电脑上的项目（已开源）
2. 16 岁课余写的 AI IDE 正式版：BYOK + 本机文件夹 + 可选 Windows 桌面版
3. 和 Cursor 错开赛道：浏览器开箱的 Agent IDE 上线实录

---

## 专栏正文（Markdown，直接粘贴）

### 开头（建议放摘要框）

从去年课余开始捣鼓，今年刚满十六岁，把 **AI IDE** 从 RC 推到 **v1.0 正式版**。  
它是一个**开源**的浏览器 IDE：打开网页就能让 Agent 读写你**本机项目文件夹**，也可以下载 Windows 便携版处理更大的仓库。

- 在线体验：https://ai-ide-flame.vercel.app  
- 开源仓库：https://github.com/FengYue427/ai-ide  

---

### 我为什么要做它？

做前端小项目时，我遇到三个很现实的问题：

1. **机房 / 临时电脑不方便装 Cursor、VS Code**  
2. **想用 Agent 改本地盘上的真实仓库**，而不是只能玩在线 Demo  
3. **手里已有 DeepSeek 等 API Key**，希望 Key 留在本地（BYOK），按量自己控成本  

所以路线很明确：**浏览器优先 + 工具 Agent + 可选桌面增强**，不跟 Cursor 拼插件生态和全语言调试器。

---

### 它现在能做什么？

**核心能力：**

| 能力 | 说明 |
|------|------|
| 工具 Agent | `list_files` / `read_file` / `write_file` / `search_repo` / `run_command` |
| 多轮改码 | 先理解仓库再改；默认 **Diff 预览** 再写入（可关「自动应用」） |
| 本机文件夹 | 浏览器用 File System Access；桌面版 **Ctrl+O** 扫盘（约 2000 文件） |
| BYOK | API Key 存浏览器本地 |
| 索引 / Tab | 增量索引、`@` 检索、Tab 补全（入门档，非 Copilot++） |

**3 分钟试用：**

1. 打开站点 →「打开本机项目」  
2. 右侧 **AI Chat → Agent**：「给 index.js 加一个 hello 函数」  
3. 设置里填 **DeepSeek** API Key  
4. 看 Diff，确认后应用  

**Windows 桌面版（可选）：**

- https://github.com/FengYue427/ai-ide/releases/latest  
- 大一点的仓库 + **本机终端**（`node -v`、`npm test`）  
- UI 仍走线上，登录与 Web 一致  

---

### 和 Cursor、Windsurf 怎么比？

**一句话：入门 Agent + 浏览器开箱 + BYOK；不是 VS Code 替代。**

| 场景 | 更合适 |
|------|--------|
| 插件链、调试器、大团队规范 | Cursor / Windsurf |
| 不能装软件、课堂、临时环境 | **AI IDE** |
| 小仓脚本、个人练手、自带 Key | **AI IDE** |
| 国内支付宝订阅（¥19/¥49） | **AI IDE**（已生产验收） |

我们**不追**：Tab++、30 分钟云 Agent、VSIX 市场。  
**在追**（路线图）：块级 Diff、Tab FIM、索引 Worker — 见仓库 `docs/PLAN_IDE5_AND_COMPETITORS.md`。

---

### 技术栈（给同行）

- 前端：React + Vite + Monaco  
- 后端：Vercel Serverless + Prisma + Neon  
- 桌面：Electron remote shell + electron-updater  
- 测试：197 单元测试 + 生产 smoke 5/5  

欢迎 **Star / Issue / PR**。我还是学生，更新频率取决于课业，但 Issue 会看。

---

### 已知限制（请先看再喷）

- 浏览器内是 **WebContainer**，不是完整本机 Node  
- 浏览器版建议 **&lt;500 文件**；大仓用桌面版  
- **无**全语言 DAP、**不兼容** VS Code 插件  
- 部分网络访问 `*.vercel.app` 可能慢  

---

### 链接汇总

| | |
|--|--|
| 体验 | https://ai-ide-flame.vercel.app |
| 源码 | https://github.com/FengYue427/ai-ide |
| 反馈 | https://github.com/FengYue427/ai-ide/issues |
| 付费说明 | 站内 `/legal/payment.html` |

---

## 可选：去相关问题下「回答」（短版）

遇到「有哪些浏览器 IDE」「Cursor 国内替代」类问题时，可贴：

```text
我自研开源了一个 AI IDE（v1.0），浏览器打开就能用 Agent 改本机文件夹，支持 BYOK。

亮点：不用装 IDE、工具 Agent 多轮改码 + Diff 预览、可选 Windows 便携版（大仓+本机终端）。

体验：https://ai-ide-flame.vercel.app
仓库：https://github.com/FengYue427/ai-ide

定位是入门 Agent + 浏览器开箱，不是 Cursor 全替代（无调试器/插件市场）。欢迎试用提 Issue。
```

---

## 发布设置

- **声明**：原创  
- **转载**：未经允许禁止转载（或按知乎默认）  
- **评论区置顶**：贴三个链接汇总  

---

## 评论区话术

| 问题 | 回复要点 |
|------|----------|
| 和 Cursor 比？ | 场景不同：浏览器+BYOK+国内支付 vs 专业 IDE 全栈 |
| 多少岁？ | 今年十六，课余项目，欢迎 constructive feedback |
| 收费吗？ | 有免费额度；专业版 ¥19/月 支付宝，详见站内付费说明 |
| 安全吗？ | 开源可审；桌面版本机命令需谨慎；Agent 默认 Diff 预览 |
