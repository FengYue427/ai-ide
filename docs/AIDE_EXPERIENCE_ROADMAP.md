# AIDE 体验路线图（Phase 1–8）

> 总规划：[AIDE_MASTER_PLAN.md](./AIDE_MASTER_PLAN.md)

## Phase 5 — 联动编排（已落地）

| 小项 | 说明 |
|------|------|
| 5.1 联动事件总线 | `aideLinkBus` + `useAideLinkEmitters` |
| 5.2 模式智能建议 | `TodayFocusBar` 一键切换建议模式 |
| 5.3 Spec → 证明包 | `SpecProofLinkageBanner` |
| 5.4 Git 提交联动 | banner + 审查模式 + Autopilot 空状态 |
| 5.5 学习路径 ↔ 回顾 | 周回顾含路径进度 |
| 5.6 命令面板联动组 | `command.cat.linkage` |

## Phase 6 — 舒适抛光（已落地）

| 小项 | 说明 |
|------|------|
| 6.1 空状态联动 | Git 干净 + Spec 待办 → Autopilot 提示 |
| 6.2 今日焦点条 | 合并模式 · Spec · Resume · 建议 |
| 6.3 项目级布局 | `projectLayoutPrefs` |
| 6.4 窄屏联动 | 模式切换时收辅助栏 |

## Phase 7 — 协作外延（已落地）

| 小项 | 说明 |
|------|------|
| 7.1 Share 进度增强 | Spec 树 · 证明包列表 |
| 7.2 轻量备注 | 只读页 localStorage 评论 |
| 7.3 进度关注 | 本地 watch 列表（邮件待备案后） |

## Phase 8 — 国内 GA 门（部分 · 运维项）

| 小项 | 说明 | 状态 |
|------|------|:----:|
| 8.1 备案域名 + SSL | [CN_LAUNCH_P0.md](./CN_LAUNCH_P0.md) | 待备案 |
| 8.2 正式订阅文案 | `PUBLIC_WELFARE_MODE=false` | 内测已 false |
| 8.3 支付宝 live smoke | ¥39/¥79 | 待配置 |
| 8.4 产品文案 | `app.tagline` 多功能 AI 智能开发空间 | ✅ |

## 验证清单（Phase 5–7）

- [x] 今日焦点条显示模式建议并可切换
- [x] Spec 全验收后出现证明包联动条
- [x] Git 提交区：审查模式 + Autopilot 提示
- [x] 命令面板「联动」分组可用
- [x] 只读 Share 页：Spec 树 · 备注 · 关注
- [x] 切换项目后布局按项目恢复
- [x] `tsc` + 联动相关单测通过
