# 当前执行入口

> **更新**：2026-06-04 — **宣传/上架搁置** · 工程线 **v1.2.5 质量/生态**

---

## 策略（已拍板）

- **不做**：短期渠道宣传、发文、上架推广节奏
- **要做**：代码与体验 — 产品足够好时自然会被发现
- **Git**：Agent 可直接 `git push`，无需每次确认

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.2.0** | ✅ GA（功能开关默认关） | [RELEASE_NOTES_v1.2.0.md](./RELEASE_NOTES_v1.2.0.md) |
| **v1.2.2** | ✅ Workbench Shell | [RELEASE_NOTES_v1.2.2.md](./RELEASE_NOTES_v1.2.2.md) |
| **v1.2.3** | ✅ 产品深度 | [RELEASE_NOTES_v1.2.3.md](./RELEASE_NOTES_v1.2.3.md) |
| **v1.2.4** | ✅ Agent/索引/E2E | [RELEASE_NOTES_v1.2.4.md](./RELEASE_NOTES_v1.2.4.md) |
| **v1.2.5** | 🔄 **质量/生态** | [V1.2.5_KICKOFF.md](./V1.2.5_KICKOFF.md) |

---

## 当前迭代：v1.2.5 F1 UI E2E 扩展

1. [V1.2.5_KICKOFF.md](./V1.2.5_KICKOFF.md)
2. **F1** 📋 命令面板 · 引用/大纲 smoke
3. **F2** 📋 插件市场可信 E2E
4. **F3** 📋 1.2.x patch 热修对齐

**门禁**：`npm run test:local` · `npm run test:e2e` · `npm run test:e2e:stack`

---

## v1.2.4 交付（已完成）

见 [RELEASE_NOTES_v1.2.4.md](./RELEASE_NOTES_v1.2.4.md) · [V1.2.4_KICKOFF.md](./V1.2.4_KICKOFF.md)

| 阶段 | 文档 |
|------|------|
| F1 | [V1.2.4_F1_REFERENCES.md](./V1.2.4_F1_REFERENCES.md) |
| F2 | [V1.2.4_F2_AGENT_CONTEXT.md](./V1.2.4_F2_AGENT_CONTEXT.md) |
| F3 | [V1.2.4_F3_FULLSTACK_E2E.md](./V1.2.4_F3_FULLSTACK_E2E.md) |

---

## 本地验证

```bash
npm run test:local
npm run dev:stack
```
