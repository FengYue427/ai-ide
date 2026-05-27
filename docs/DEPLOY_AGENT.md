# 部署约定（Agent 执行）

> **约定**：发版与生产部署由 **Cursor Agent** 在对话中代为执行（用户无需手跑 `vercel`）。  
> **生产 URL**：https://ai-ide-flame.vercel.app

---

## 标准流程（每次 `1.0.x.N` 或主版本）

1. `npm run test:local`
2. `npm run mcp:smoke`（`MCP_SMOKE_SKIP_LIVE=1` 仅当 API 未起）
3. `npm run go-live:preflight`
4. `git commit` + `git push origin main`（**优先**：触发 Vercel Git 自动部署）
5. 若本机已 `vercel login`：`npm run deploy`（`vercel --prod`）；CLI token 失效时 **仅依赖步骤 4**
6. 等待 1～3 分钟后 `npm run rc:live-spotcheck`（期望 `health.version` 与 `package.json` 一致）
7. `git tag v<version>` + `git push origin v<version>`
8. 更新 [NEXT_EXECUTION.md](./NEXT_EXECUTION.md) 与对应 EXECUTION checklist

---

## 命令（在 `ai-ide/`）

```powershell
cd C:\Users\18663\IDE\ai-ide
npm run go-live:preflight
npm run deploy
npm run rc:live-spotcheck
```

---

## 注意

- 不修改 git config；不 force push `main`
- 密钥仅通过 Vercel 环境变量，不入库
- 部署失败时查 Vercel 构建日志，修后重跑 preflight
