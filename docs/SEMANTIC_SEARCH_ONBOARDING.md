# 语义检索 Onboarding 规格（1.0.4.3 · E3）

> **路线图**：[ROADMAP_V1.0.4.x.md](./ROADMAP_V1.0.4.x.md) §4  
> **执行**：[V1.0.4.3_EXECUTION.md](./V1.0.4.3_EXECUTION.md)

---

## 1. 目标

让用户在 **工作区模式 + BYOK** 下，**3 步内**理解并开启语义检索，避免「开了 Agent 却不知道要配 Key / 开关」。

---

## 2. 触发条件（设置页）

| 状态 | UI |
|------|-----|
| 无 API Key（非 Ollama） | 语义 Toggle **禁用** + 文案「需先在 AI 配置中填写 API Key」 |
| 有 Key、开关关 | 显示 **开启引导** 1～2 句 + 链到 [BROWSER_LIMITATIONS.md](./BROWSER_LIMITATIONS.md) 索引上限 |
| 有 Key、开关开 | 仅保留现有 `settings.feature.semantic.desc` |

---

## 3. Chat 侧（可选 4.3-2 共用）

- 用户首次 `@` 且无索引：提示「请先导入项目并等待索引完成」
- 语义开启但 `canUseEmbeddings` 为 false：不报错，静默跳过（保持现状）；设置页负责教育

---

## 4. 验收

- [ ] 中英文 i18n 键：`settings.semantic.onboarding.*`
- [ ] 手测：无 Key → 看到引导；填 Key 开 Toggle → Chat 工作区提问能出现语义块（或日志无 error）
- [ ] 文档本页与 [V1.0.4.3_EXECUTION.md](./V1.0.4.3_EXECUTION.md) 4.3-1 勾选

---

## 5. 非目标

- 新 embedding 模型
- 服务端向量库
- 自动帮用户填 Key
