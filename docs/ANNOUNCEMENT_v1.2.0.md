# AI IDE v1.2.0 发布公告（草稿）

> 可复制到 GitHub Release、博客或社群。英文版见 Release Notes 英文小节。

---

## 标题建议

**AI IDE v1.2.0：多根工作区 + 可信插件市场**

---

## 正文（中文）

我们发布了 **v1.2.0**，聚焦「像大型 IDE 一样管仓库」和「更可信的插件安装」。

### 多根工作区

- 在侧栏添加、切换多个工作区根目录  
- 每个根独立 autosave，切换时文件列表互不覆盖  
- 协作房间绑定主根，避免多人编辑串文件  

> 生产环境默认仍与 v1.1.9 相同；团队可在 Vercel 配置 `VITE_MULTI_ROOT=true` 后逐步开放。

### 大文件树

- 250+ 文件时默认折叠并提示  
- 500+ 可见行时虚拟滚动，大仓浏览更流畅  

### 插件可信市场

- 官方目录支持 **信任等级**（官方 / 已签名 / 社区）  
- 开启 `VITE_PLUGIN_TRUST_MARKET` 后，安装前校验 Ed25519 签名  
- 示例插件 **SDK v2 状态** 含官方签名样例  
- 服务端草案：`POST /api/plugins/publish` 提交审核（需运维开启）  

### 升级说明

- 在线版：https://ai-ide-flame.vercel.app  
- 无需数据库迁移  
- 从 v1.1.9.x 拉取最新 `main` 即可  

### 文档

- [Release Notes](./RELEASE_NOTES_v1.2.0.md)  
- [插件 SDK 2.0 + 签名](./PLUGIN_SDK_V2.md)  
- [环境开关](./V1.2_ENV.md)  

### 已知限制

- 多根 / 信任市场默认 **关闭**，需环境变量开启  
- 插件发布 API 为人工审核队列，无自动上架  
- VSIX、SSH 远程根 → v1.2.1 / v1.2.2  

感谢试用与 Issue 反馈。

---

## Title (EN)

**AI IDE v1.2.0: multi-root workspace & trusted plugin marketplace**

## Body (EN, short)

- **Multi-root workspace**: switch roots in the sidebar; per-root autosave (opt-in via `VITE_MULTI_ROOT`).  
- **Large trees**: fold hints at 250+ files; virtual scroll at 500+ rows.  
- **Plugin trust**: `trustTier`, Ed25519 signatures, marketplace badges (`VITE_PLUGIN_TRUST_MARKET`).  
- **Publish API stub**: `POST /api/plugins/publish` when `PLUGIN_PUBLISH_ENABLED=true`.  

Live: https://ai-ide-flame.vercel.app · Docs: [RELEASE_NOTES_v1.2.0.md](./RELEASE_NOTES_v1.2.0.md)
