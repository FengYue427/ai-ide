# i18n 英文冒烟清单

在 **设置 → English** 后按序勾选（约 15 分钟）。部署前建议在生产 URL 再跑一遍关键路径。

## 准备

- [ ] 浏览器语言可为中文；以 IDE 内 **设置 → 语言 → English** 为准
- [ ] 硬刷新页面（Ctrl+F5）或新开隐身窗口
- [ ] 可选：DevTools → Network 确认 API 请求带 `X-App-Language: en-US`

## 壳层与导航

- [ ] 欢迎页标题、快捷入口描述为英文
- [ ] 工具栏：Files / Search / Run / Settings 等
- [ ] 设置中心各 Tab 标题与说明为英文
- [ ] 命令面板（Ctrl+Shift+P）条目为英文

## AI 与编辑器

- [ ] Chat 欢迎语与快捷按钮（Explain / Refactor 等）为英文
- [ ] 新建工作区默认 `index.js` 首行：`// Welcome to AI IDE`
- [ ] AI 设置：提供商名称与描述为英文
- [ ] 未启动 Ollama 时发消息：错误含 `Ollama is not running`
- [ ] 配额用尽时提示为英文（guest 可快速耗尽免费额度验证）

## 工作区与存储

- [ ] 工作区管理：保存时空名称 → `Name is required`
- [ ] 云保存失败（断网模拟）→ 英文网络/保存失败文案
- [ ] 加载「自动保存」快照时显示名称为 **Autosave project**（非中文「自动保存项目」）
- [ ] 从模板新建 Vanilla/Node：生成文件内注释为英文

## 认证与订阅

- [ ] 登录/注册失败：英文错误（非原始中文 API 串）
- [ ] 忘记密码：英文 demo 说明
- [ ] 订阅弹窗：dev 升级 / 取消 / 恢复成功横幅为英文
- [ ] 套餐说明与计费 footnote 为英文（含公测说明）

## 插件

- [ ] 插件市场：hello-sandbox / workspace-hints 描述为英文
- [ ] 安装并启用 hello-sandbox → 通知 **Plugin sandbox is working**
- [ ] 启用 workspace-hints → 工具栏 **Files N**，弹窗标题 **Workspace**
- [ ] 手动安装页底部可见 `manifest.i18n` / `context.t()` 提示

## API 成功消息（可选，需登录）

- [ ] 注册/登录后（若 UI 展示 message）：服务端返回英文 `message`
- [ ] 创建工作区成功（若 toast 使用 API message）：`Workspace created`

## 已知不验收项

- 源码内中文**注释**与 `console.*` 日志
- 微信支付异步通知 `message: 成功`（第三方协议）
- 第三方自行安装的插件未提供 `manifest.i18n` 时的文案

## 相关文档

- [I18N_STATUS.md](./I18N_STATUS.md) — 批次与架构
- [PLUGIN_I18N.md](./PLUGIN_I18N.md) — 插件作者
