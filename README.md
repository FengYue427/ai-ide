# ⚡ AI IDE

> 开源 AI 原生轻量 IDE —— 在浏览器里跑完整开发环境

**[🚀 立即体验](https://aide1019.netlify.app)**

## ✨ 核心亮点

- 🤖 **9大AI模型支持** — GPT-5.4、Claude Opus 4.7、Gemini 3.1 Pro、DeepSeek V4、Qwen 3.5、GLM-5、MiniMax M2.5、Grok 4.20、Ollama本地模型
- 📂 **工作区上下文** — 上传整个项目让AI理解完整代码库，跨文件修改
- 💻 **浏览器内运行** — WebContainer 支持在浏览器中运行 Node.js
- 🎨 **VS Code 同款编辑器** — Monaco Editor，语法高亮、智能补全
- 🌙 **9种主题** — 深色、浅色、Monokai、Dracula 等
- 🔄 **实时协作** — WebRTC 多人在线编辑
- 📦 **零安装** — 打开浏览器即可使用

## 快速开始

```bash
npm install
npm run dev
```

## 功能特性

### 🤖 AI 功能
- 多模型对话（9大主流AI模型）
- 工作区上下文模式（AI理解整个项目）
- 代码解释 / 重构 / 优化 / 生成
- 内联 AI 编辑（选中代码直接修改）
- 智能代码补全
- AI 代码审查（质量评分、问题检测）
- AI 单元测试生成

### 💻 编辑器
- Monaco Editor（VS Code 同款）
- 多文件管理 + 多标签页
- 全局搜索替换（正则支持）
- 代码 Diff 对比
- 代码格式化
- 9种编辑器主题
- 键盘快捷键系统

### 🚀 运行环境
- WebContainer 浏览器内 Node.js
- 终端命令历史
- HTML 实时预览
- 性能分析面板

### 📂 项目管理
- 项目模板（React/Vue/Node/Vanilla）
- 文件拖拽上传
- ZIP 项目导出
- IndexedDB 自动保存
- 工作区管理（保存/导入/导出）
- GitHub 仓库导入
- 代码分享（生成链接）

### 🤝 协作
- WebRTC 实时协作编辑
- Git 基础支持（init/add/commit/log）

### 🎨 UI/UX
- Glassmorphism 毛玻璃风格
- 命令面板（Ctrl+Shift+P）
- 底部状态栏
- 欢迎引导页面
- i18n 国际化（中/英）
- 代码片段库
- 插件系统架构

## 使用说明

1. **配置 AI**: 点击顶部「AI」按钮，选择模型并输入 API Key
2. **工作区**: 点击「工作区」按钮上传项目文件，让AI理解完整上下文
3. **运行代码**: 编写代码后点击「运行」按钮，在底部终端查看输出
4. **AI 对话**: 在右侧面板输入问题，AI 会根据当前代码或工作区上下文回答
5. **自动保存**: 项目会自动保存到浏览器本地存储
6. **导出项目**: 点击「导出」按钮下载文件，或「导出ZIP」打包整个项目

## 支持的 AI 模型

| 提供商 | 模型 | 说明 |
|--------|------|------|
| OpenAI | GPT-5.4 / GPT-5 / GPT-4o | 2026年3月旗舰模型 |
| Anthropic | Claude Opus 4.7 / Sonnet 4.6 | 编程能力领先 |
| Google | Gemini 3.1 Pro / 3 Flash | 性价比极高 |
| DeepSeek | V4 Pro / V4 Flash | 2026年4月发布 |
| 阿里通义 | Qwen 3.5 Max / Plus | 开源生态丰富 |
| 智谱AI | GLM-5 / GLM-5.1 | 华为昇腾训练 |
| MiniMax | M2.5 / M2.5 Lightning | SWE-bench高分 |
| xAI | Grok 4.20 | 推理能力强 |
| Ollama | Llama 4 / Qwen / 本地模型 | 无需API Key |

## 部署

### Netlify（推荐）

```bash
npm install -g netlify-cli
npm run deploy:netlify
```

### Vercel

```bash
npm install -g vercel
npm run deploy:vercel
```

### 手动部署

```bash
npm run build
# 将 dist 目录上传到任意静态托管服务
```

## 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite 5
- **编辑器**: Monaco Editor
- **运行环境**: WebContainer API
- **状态管理**: Zustand
- **存储**: IndexedDB
- **协作**: Yjs + WebRTC

## License

MIT

