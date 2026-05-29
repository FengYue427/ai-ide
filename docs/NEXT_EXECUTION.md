# 当前执行清单

> **当前稳定**：**v1.1.0.16** · **下一 patch**：**v1.1.0.17**（Plan ↔ Spec 溯源）  
> **详细规划**：[ROADMAP_V1.1.0_PLAN_SYSTEM.md](./ROADMAP_V1.1.0_PLAN_SYSTEM.md) · 发版：[RELEASE_RUNBOOK.md](./RELEASE_RUNBOOK.md)

---

## 当前：v1.1.0.x 计划系统（功能优先）

### 已完成（0.5～0.13）

Plan → Spec → Chat 闭环、双队列持久化、可观测统计、报告保存与目录管理。见 [ROADMAP_V1.1.0_PLAN_SYSTEM.md](./ROADMAP_V1.1.0_PLAN_SYSTEM.md) §1。

### 下一步（按顺序做）

| 版本 | 功能（一句话） |
|------|----------------|
| **v1.1.0.14** | ✅ 从报告解析并恢复失败/待执行队列 |
| **v1.1.0.15** | ✅ Spec 目录（搜索/排序/打开，对齐 Plan） |
| **v1.1.0.16** | ✅ 队列完成自动保存报告 + 可选通知 |
| **v1.1.0.17** | Plan ↔ Spec 溯源展示 |
| **v1.1.0.18** | 多计划总览卡片 |
| **v1.1.0.19** | 计划模板新建 |
| **v1.1.0.20** | 报告归档/批量清理 |
| **v1.1.1** | 计划系统 GA（文档 + tag） |
| **v1.1.0.21～23** | 优化：性能 / 持久化 / i18n |

---

## 发版步骤（PowerShell）

```powershell
cd C:\Users\18663\IDE\ai-ide

npm run test:local
npm run build:deploy
npx vercel --prod --yes   # 需已配置 .vercelignore

git add .
git commit -m "feat(plan): v1.1.0.14 ..."
git push origin main
git tag v1.1.0.14
git push origin v1.1.0.14
```

GitHub Release：网页创建 tag，正文抄 `CHANGELOG.md`。

---

## 门禁

```powershell
npm run test:local
npm run go-live:preflight
```

---

## v1.1.2+（计划系统 GA 之后）

后台 Agent 队列（P0）或协作 M1 — 见 [ROADMAP_V1.1.md](./ROADMAP_V1.1.md)，**最多同时 1 个 P0**。
