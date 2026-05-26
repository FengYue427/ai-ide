# V2EX 发布稿

> 发布地址：https://www.v2ex.com/create/discussion  
> **节点建议**：`分享创造` 或 `程序员`  
> **注意**：V2EX 不喜欢纯广告，正文要有信息量；链接放一次即可。

---

## 标题

```
[分享] AI IDE v1.0 正式版：浏览器 Agent 改本机仓库，支付宝 ¥19，开源 + Windows 便携版
```

备选（更短）：

```
开源 AI IDE 正式版上线 — 浏览器开箱 / BYOK / 支付宝订阅 / 可选桌面大仓
```

---

## 正文（纯文本，直接粘贴）

大家好，我们开源项目 **AI IDE** 刚从 RC 走到 **v1.0 正式版**，来发个帖记录一下，也欢迎试用挑刺。

**它解决什么问题？**

我自己主要是前端/脚本小项目，经常遇到：
- 不方便装桌面 IDE（公司机、机房、临时环境）
- 想用 Agent 改本地盘上的代码，但 Cursor 等是美元订阅
- 已经有 DeepSeek Key，希望 Key 自己保管（BYOK）

所以做了这个：**浏览器打开就能用**，也可以下 **Windows 便携版** 扫大一点的文件夹 + 本机终端。

**现在能做什么（正式版）**

- 工具 Agent：读写在、搜索、跑命令（多轮 + Diff 预览）
- 本机文件夹（浏览器 FS Access；桌面版最多约 2000 文件）
- 支付宝订阅：专业版 ¥19/月、团队版 ¥49/月（生产已验收 Path B）
- 自带 API Key；免费版每日约 200 次 AI 配额

**链接**

- 在线：https://ai-ide-flame.vercel.app
- 源码：https://github.com/FengYue427/ai-ide
- Windows：https://github.com/FengYue427/ai-ide/releases/latest

**和 Cursor 的关系**

没打算吹「替代 Cursor」。我们更合适：
不能装软件 / 要人民币付费 / 小仓 + BYOK 的场景。
专业 C++、插件生态、调试器还是 Cursor/Windsurf 更强。

**限制（先说清楚）**

- 浏览器里是 WebContainer，不是完整本机 Node
- 浏览器版建议 <500 文件，大仓用桌面版
- 无 VS Code 插件、无全语言调试器
- vercel.app 国内个别网络慢，在考虑自定义域名

**技术向**

React + Vite + Monaco，API 在 Vercel + Prisma，支付支付宝，桌面 Electron。
仓库里有竞品对比文档（Cursor/Kiro/Windsurf），测试 197 单元 + 生产 smoke 5/5。

欢迎 Star、Issue。支付/Agent/访问问题可以直接在 GitHub Issues 里提，我会跟。

---

## 发帖后建议

1. 自己沙发回复一条：**试用步骤**（打开站 → 本机文件夹 → Agent 一句话改文件）  
2. 有人质疑时别硬刚 Cursor，用场景回复（见上表）  
3. 24h 内尽量回复前几条评论
