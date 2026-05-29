# GitHub Release 模板（v1.1+）

> 用途：给每次发版提供可复制的 Release 正文结构，避免临时发挥导致信息缺失。

## Title（示例）

`v1.1.1`

## Body

### Summary（1 句话）

- （1 句话：这版解决什么“用户能感知”的问题）

### Highlights（3-6 条）

- （3～6 条：最重要的功能/体验/稳定性变化）

### Verification（必填）

- 本地：`npm run test:local`
- （可选）生产 env：`npm run check:release`
- （可选）生产冒烟：`npm run smoke:production -- --url https://<domain>`

### Notes（必填）

- （是否包含破坏性变更？若无，写“无”）
- （如果是路径 A 公测：明确“未接商户 / 不收款”）

### Upgrade Focus（v1.1+ 建议）

- Plan/Spec 执行链路是否有行为变化（队列、回填、失败策略）
- 是否涉及持久化结构变化（localStorage / store）
- 是否新增可观测项（统计、导出、日志字段）

## 附：建议来源

- 主要事实来源：`CHANGELOG.md` 对应版本段落
- 部署与回滚：`docs/RELEASE_RUNBOOK.md`

