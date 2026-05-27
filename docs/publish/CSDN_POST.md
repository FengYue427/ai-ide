# CSDN 发布稿

> **形式**：博客 → 发布文章 → **原创**  
> **分类**：人工智能 / 开发工具（或 开源）  
> **封面**：复用 [juejin-cover-ai-ide-v1.png](./juejin-cover-ai-ide-v1.png)  
> **SEO**：标题含「AI IDE」「浏览器」「Agent」「开源」

---

## 文章标题（选 1，偏搜索）

1. 【开源】AI IDE v1.0 发布：浏览器 Agent 改本机代码，BYOK + Windows 桌面版 + 支付宝订阅
2. 不用装 Cursor？浏览器 AI IDE 正式版上手：本机文件夹、工具 Agent、DeepSeek API
3. AI IDE 开源实录：从 RC 到 v1.0，197 单测 + 生产 smoke 全绿

---

## 摘要（CSDN「文章摘要」栏，≤256 字）

```text
AI IDE 是一款开源的浏览器 AI IDE，当前稳定运营版 **v1.0.3.4**（1.0.3.x 收官）。支持工具 Agent 多轮读写本机项目、BYOK、增量索引与 Tab 补全；可选 Windows 便携版（约 2000 文件 + 本机终端）。技术栈：React+Vite+Monaco、Vercel Serverless、Prisma、Electron。在线体验 https://ai-ide-flame.vercel.app ，源码 https://github.com/FengYue427/ai-ide 。定位入门 Agent，非 VS Code 替代。
```

---

## 标签（CSDN 文章标签，选 5～8 个）

```
AI IDE, 人工智能, Agent, 开源, 前端, DeepSeek, Cursor, 独立开发
```

---

## 正文（Markdown）

> 下文可直接粘贴；CSDN 若不支持表格，可删掉对比表改为列表。

### 一、项目简介

**AI IDE** 是开源的 AI 原生轻量 IDE，**v1.0.3.4**（1.0.3.x 运营稳定化收官）已发布。

- **在线体验**：https://ai-ide-flame.vercel.app  
- **GitHub**：https://github.com/FengYue427/ai-ide  
- **Windows 便携版**：https://github.com/FengYue427/ai-ide/releases/latest  

特点概览：

- 浏览器打开即用（Chrome / Edge）  
- **工具 Agent**：读 / 写 / 搜 / 跑命令，多轮 + Diff 预览  
- **本机项目文件夹**（浏览器 FS Access 或桌面扫盘）  
- **BYOK**：API Key 本地保存  
- 国内 **支付宝** 订阅（专业版 ¥19/月、团队版 ¥49/月，生产 Path B 已验收）  

---

### 二、为什么做（痛点）

1. 机房、公司机不方便安装重型 IDE  
2. 希望 Agent 改**真实磁盘**上的仓库  
3. 已有 DeepSeek / 通义 Key，不想绑死平台模型  

目标用户：个人开发者、前端/脚本小仓、不能装软件的环境。**不是** Cursor / Windsurf 的全量替代。

---

### 三、功能与试用步骤

**Agent 工具：**

- `list_files` — 列文件  
- `read_file` — 读文件（支持行号）  
- `write_file` — 写文件（默认先 Diff 预览）  
- `search_repo` — 仓库内搜索  
- `run_command` — 终端命令（WebContainer 或桌面本机 shell）  

**试用 5 步：**

1. 打开 https://ai-ide-flame.vercel.app  
2. 点击「打开本机项目」选目录  
3. 打开 **AI Chat → Agent**  
4. 输入：「给 index.js 添加 hello 函数」  
5. 在 **设置** 配置 DeepSeek API Key  

**桌面版（IDE-4b）：**

- `Ctrl+O` 打开文件夹，最多约 **2000** 文件  
- Agent 可在项目根执行 `npm test` 等  
- 支持 GitHub Releases 自动更新  

---

### 四、与 Cursor 的定位差异

| 维度 | Cursor / Windsurf | AI IDE |
|------|-------------------|--------|
| 安装 | 桌面为主 | **浏览器优先** |
| 插件 / 调试器 | 强 | 无 VSIX / 无 DAP |
| Agent | Composer / Cascade | 工具 Agent 入门档 |
| 支付 | USD 为主 | **支付宝 CNY** |
| 模型 | 平台绑定为主 | **BYOK** |

---

### 五、技术实现

- **前端**：React 18 + Vite 5 + Monaco Editor + Zustand  
- **后端**：Vercel Serverless，`api/index.js` esbuild 打包  
- **数据库**：Prisma + Neon（PostgreSQL）  
- **支付**：支付宝异步通知 + 订阅生命周期（宽限期 / 到期降级）  
- **桌面**：Electron remote shell + preload IPC + electron-updater  
- **质量**：`npm run test:local` **197** 测试；生产 `smoke:report` **5/5**  

---

### 六、已知限制

- 浏览器运行时依赖 **WebContainer**  
- 浏览器版本机目录建议 **&lt;500 文件**（大仓用桌面版）  
- 暂无全语言调试器  
- 国内访问 `vercel.app` 偶发较慢  

---

### 七、总结与链接

适合：**浏览器开箱、BYOK、小仓 Agent、国内订阅** 的场景。  
不适合：重度插件、C++/Java 调试、要无人值守云 Agent 30 分钟的任务。

- 站点：https://ai-ide-flame.vercel.app  
- 仓库：https://github.com/FengYue427/ai-ide  
- Issue：https://github.com/FengYue427/ai-ide/issues  
- 付费说明：https://ai-ide-flame.vercel.app/legal/payment.html  

觉得有用欢迎 **点赞 + 收藏 + Star**，有问题评论区或 GitHub Issue 留言。

---

*原创文章，转载请注明出处：AI IDE / GitHub FengYue427/ai-ide*

---

## CSDN 发布 checklist

- [ ] 文章类型：**原创**  
- [ ] 可见性：**全部可见**  
- [ ] 封面图上传  
- [ ] 摘要粘贴  
- [ ] 标签填写  
- [ ] 发布后在评论区置顶链接（防部分读者不看文末）  

---

## 评论区置顶模板

```text
链接直达：
体验 https://ai-ide-flame.vercel.app
源码 https://github.com/FengYue427/ai-ide
Windows https://github.com/FengYue427/ai-ide/releases/latest
```
