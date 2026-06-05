# 社区插件样例 — 发布到审核（v1.3.2）

> 固定样例：`fixtures/plugins/community-sample/community-sample.plugin.json`  
> **非目标**：开放公开上传洪水 · VSIX · 自动过审

---

## 1. 准备包

样例为最小 **community** 插件：仅 `ui` 权限、无签名（审核队列用）。

```bash
# 在仓库根目录
cat fixtures/plugins/community-sample/community-sample.plugin.json
```

---

## 2. 本地 stack 提交审核

1. 启动：`npm run dev:stack`
2. 设置 `PLUGIN_PUBLISH_ENABLED=true`（`.env.local`）
3. 注册/登录测试账号
4. 插件面板 → **手动安装** Tab 旁的发布表单，或 `POST /api/plugins/publish`：

```http
POST /api/plugins/publish
Content-Type: application/json
Cookie: <session>

{ "package": <粘贴 community-sample.plugin.json 内容> }
```

5. 设置 → **功能** → **插件运维** 卡：筛选 **待审核**，应看到 `community-sample` pending。

### 可选：本地 seed（无 API 时演示）

```bash
node scripts/seed-plugin-review.mjs
```

在浏览器刷新设置页后，运维卡可显示一条本地 pending 记录（localStorage）。

---

## 3. 手动安装（开发环境）

开发构建默认允许手动 JSON：

1. 插件面板 → 手动安装
2. 粘贴 `community-sample.plugin.json` 全文
3. 安装后工具栏出现 **社区样例** 按钮

生产默认禁用手动第三方 JSON；须走审核 + 官方目录流程。

---

## 4. 验收清单

- [ ] 提交后 pending 计数 +1（或列表出现 `community-sample`）
- [ ] 开发环境可手动安装并点击工具栏按钮
- [ ] 样例 permissions 仅 `ui`，无 `run_command` / `files:write`

---

## 相关文档

- [PLUGIN_SDK_V2.md](./PLUGIN_SDK_V2.md)
- [V1.3.2_KICKOFF.md](./V1.3.2_KICKOFF.md) T3
