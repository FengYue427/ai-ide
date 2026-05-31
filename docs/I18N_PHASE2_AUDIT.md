# i18n Phase 2 审计（v1.1.4 F3 → F4）

> **更新**：2026-05-30 · **F4 ✅** ja 前缀 ≥95% + API message ja

---

## 架构

| 项 | 说明 |
|----|------|
| UI 第三语言 | **`ja-JP`**（设置 → 外観 → 日本語） |
| 词条 | `translationsJa.ts`（精校 MVP）+ `translationsJaBulk.ts`（F4 批量 gloss） |
| 回退链 | ja 显式覆盖 → **en-US** → zh-CN → key |
| API | `apiMessagesJa.generated.ts` + `resolveRequestLocale` 支持 **`ja-JP`** |

**再生成 bulk/API ja**（修改 en 词条后）：

```bash
node scripts/build-ja-phase2-bulk.mjs
```

---

## Phase 2 前缀覆盖率（F4 实测）

| 前缀 | 总 key | ja 覆盖 | 覆盖率 |
|------|--------|---------|--------|
| `settings.` | 84 | 84 | **100%** |
| `subscription.` | 74 | 74 | **100%** |
| `collab.` | 61 | 61 | **100%** |
| `auth.` | 45 | 45 | **100%** |
| `welcome.` | 50 | 50 | **100%** |
| `toolbar.` | 25 | 25 | **100%** |
| `command.` | 61 | 61 | **100%** |
| `chat.` | 86 | 86 | **100%** |
| `agent.` | 28 | 28 | **100%** |

**显式 ja 覆盖总数**：~647 keys（`countJaOverrides()`）

**说明**：bulk 层为 en→ja **术语 gloss**（保留 `{param}`）；高流量文案以 `translationsJa.ts` 精校为准。非 Phase 2 前缀仍回退 en-US。

---

## 手测（ja）

1. 设置 → **日本語** → Welcome / 设置 / 协作 / 订阅 / Chat 主流程为日文或日英混合 gloss  
2. 登录成功 toast 为日文 gloss（`api.auth.loginOk`）  
3. 命令面板、format-on-save、协作 Viewer Banner  
4. Chat 错误态（413 / 网络 / 配额）可读  

---

## 测试

```bash
npm run test:unit -- src/i18n lib/i18n
```

`i18nPhase2.test.ts` 断言各 Phase 2 前缀 **≥95%**（当前 100%）。

---

## F5+ 剩余

- ~~非 Phase 2 区域 ja（Git 面板）~~ → **v1.1.6.4 ✅**（`git.*` + `empty.git` + `status.gitTitle`）
- gloss 质量人工润色（可选）
- E2E 三语 smoke（可选 CI job）
