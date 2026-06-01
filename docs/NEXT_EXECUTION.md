# 当前执行入口

> **更新**：2026-05-31 — **v1.1.8 开发完成（待 deploy）**

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.1.7** | ✅ GA · tag `v1.1.7` | [RELEASE_NOTES_v1.1.7.md](./RELEASE_NOTES_v1.1.7.md) |
| **v1.1.7.x** | ✅ 1.1.7.2/3 合入 1.1.8 | [ROADMAP_V1.1.7.x_PATCHES.md](./ROADMAP_V1.1.7.x_PATCHES.md) |
| **v1.1.8** | 🚧 **待 deploy / tag** | [V1.1.8_KICKOFF.md](./V1.1.8_KICKOFF.md) |
| **v1.1.9+** | 📋 插件 SDK 等 | [ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) |
| **v1.2+** | 📋 大拓展占位 | [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) |

---

## 立即执行（v1.1.8 GA）

### 1. 本地验证

```bash
npm run test:local
# 可选：dev:full + DATABASE_URL
API_BASE=http://localhost:3000 node scripts/integration-api.mjs
```

### 2. Vercel Production 环境变量

```bash
VITE_AI_GATEWAY=true
PLATFORM_DEEPSEEK_API_KEY=sk-...
```

### 3. 发版

```bash
git add -A
git commit -m "release: v1.1.8 platform AI, auth SEO, debug patches"
git tag v1.1.8
git push origin main --tags
npm run deploy
npm run smoke:report
```

### 4. 手工冒烟

1. https://ai-ide-flame.vercel.app/signup → 注册 → IDE 内 Chat（无 Key）
2. Agent：让 AI 改一个文件
3. 设置切换 BYOK 仍可用
4. （桌面）打开本地文件夹 → 调试

### 5. SEO

- Google Search Console 提交 `https://ai-ide-flame.vercel.app/sitemap.xml`

---

## 下一世代（v1.1.9 建议）

- 插件 SDK 2.0（原 v1.1.8 长期规划）
- Tab 补全走平台网关（可选）
- 条件断点 / Watch（1.1.7.x P1/P2）
