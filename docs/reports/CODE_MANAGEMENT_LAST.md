# 代码管理报告（最新）

- 生成时间：2026-05-27T08:30:15.376Z

## 关键指标

- 源码文件数（src+lib，排除 test）：**258**
- 测试文件数：**70**
- 测试文件比值：**0.27**
- 脚本总数：**30**
- 未被 package scripts 直接引用：**2**

## 大文件热点（>=700 行）

| 文件 | 行数 |
|------|----:|
| `api/index.js` | 4044 |
| `src/i18n/translations.ts` | 2489 |
| `src/components/ChatPanel.tsx` | 997 |

## TODO/FIXME/HACK 信号（Top 20）

| 文件 | 数量 |
|------|----:|
| `scripts/governance-report.mjs` | 7 |
| `docs/V1.0.5.x_RETROSPECTIVE_AND_GOVERNANCE.md` | 5 |
| `docs/AUDIT_FULL_2026-05.md` | 3 |
| `src/services/codeReviewService.ts` | 3 |
| `src/i18n/translations.ts` | 2 |
| `docs/PHASE_V1.0.2.5_AGENT_TOOLS.md` | 1 |
| `scripts/ops-verify-p1.mjs` | 1 |

## 未直接挂载的脚本

- `scripts/load-env-local.mjs`
- `scripts/split-styles.mjs`

## 下一步动作（建议）

- 优先拆分热点文件前 3 个（按模块边界，不做机械拆分）。
- 对 TODO 信号前 10 个文件补 issue 编号与到期版本。
- 为关键治理脚本建立统一入口：`governance:report`、`check:skeleton`、`deploy:check`。
