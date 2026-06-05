# 四竞品能力矩阵 — Cursor · Kiro · Windsurf · AI IDE

> **日期**：2026-05-26（GA + IDE-4b 后）  
> **方法**：与 [COMPETITOR_SCORE_2026-05.md](./COMPETITOR_SCORE_2026-05.md) 相同 11 维度，1～5 分等权平均。  
> **参照分**：Cursor **~3.6**（桌面全栈标杆，固定不随我们版本变）。  
> **战略**：[PLAN_STRATEGY_2026_Q3.md](./PLAN_STRATEGY_2026_Q3.md) · [PLAN_IDE5_AND_COMPETITORS.md](./PLAN_IDE5_AND_COMPETITORS.md)

---

## 1. 综合分（估算）

| 产品 | 定位 | **综合分** | 与 AI IDE 分差 |
|------|------|:----------:|:--------------:|
| **Cursor** | VS Code 系 + Composer + Tab++ + 云 Agent | **~3.6** | +1.25 → +1.05 |
| **Windsurf** | VS Code 系 + Cascade 实时感知 Agent | **~3.45** | +1.10 → +0.90 |
| **Kiro** | AWS Code OSS 系 + Spec/Hook + Bedrock | **~3.30** | +0.95 → +0.75 |
| **AI IDE v1.0.2** | GA + 桌面 + 支付宝 | **~2.55** | — |
| **AI IDE v1.0.9（目标）** | 智能第二档收官 | **~2.75** | — |

> **详细对比**：[COMPETITOR_COMPARISON_V1.0.2.md](./COMPETITOR_COMPARISON_V1.0.2.md) · **版本计划**：[ROADMAP_V1.0.3-V1.0.9.md](./ROADMAP_V1.0.3-V1.0.9.md)

**结论**：我们不与三者争「专业 IDE 全替代」；在 **国内 CNY + 浏览器开箱 + BYOK + 工具 Agent** 上保持差异化；桌面版缩小 **终端/大仓** 差距后，智能第二档（IDE-5）对标 **Cascade/Composer 入门**，不追 **Kiro Spec 工程化** 或 **Cursor Tab++**。

---

## 2. 产品画像（一句话）

| | **Cursor** | **Kiro** | **Windsurf** | **AI IDE** |
|--|------------|----------|--------------|------------|
| **母公司/背景** | Anysphere | AWS（Bedrock） | Codeium | 独立开源 |
| **壳** | VS Code fork | Code OSS fork | VS Code fork | **浏览器** + Electron 可选 |
| **核心 Agent** | Composer + Background | Spec 驱动 + Hooks + Cloud Agent | **Cascade**（实时上下文） | 5 工具 + Diff 预览 |
| **模型** | 平台绑定 | Claude/Bedrock 等 | 多模型套餐 | **BYOK** + 平台配额 |
| **付费** | USD Pro | AWS 积分/企业 | USD ~$10 Pro | **¥19 / ¥49 支付宝** |
| **强项** | 插件、Tab++、大仓 | 规格化交付、企业合规 | 多文件 Agent、终端联动 | 国内付费、免安装、本机盘 |

---

## 3. 维度评分（1～5）

| 维度 | Cursor | Kiro | Windsurf | **AI IDE 5-26** | **AI IDE 4b+** |
|------|:------:|:----:|:--------:|:---------------:|:----------------:|
| 编辑与语言服务 | 4.0 | 3.8 | 3.8 | 2.2 | 2.3 |
| AI 对话与 Chat | 4.0 | 3.8 | 3.9 | 2.5 | 2.5 |
| Agent / 多文件 | 4.2 | 4.0 | 4.1 | 2.9 | 3.0 |
| 工作区 / 本机 | 4.5 | 4.3 | 4.3 | 2.5 | **3.2** |
| 运行与终端 | 3.5 | 3.5 | 3.6 | 2.5 | **3.4** |
| 索引与检索 | 4.0 | 3.7 | 3.8 | 2.5 | 2.6 |
| 协作 | 3.5 | 3.0 | 3.2 | 1.5 | 1.5 |
| 插件与生态 | 4.5 | 4.0 | 4.0 | 2.0 | 2.0 |
| 国际化 | 3.5 | 3.0 | 3.5 | 2.5 | 2.5 |
| 合规与可上市 | 3.5 | 4.0 | 3.5 | 2.8 | 2.8 |
| 商业化（国内） | 3.0 | 2.5 | 3.0 | **3.2** | **3.2** |
| **综合（均权）** | **~3.6** | **~3.30** | **~3.45** | **~2.35** | **~2.55** |

---

## 4. 能力逐项对比

| 能力 | Cursor | Kiro | Windsurf | AI IDE | 我们策略 |
|------|--------|------|----------|--------|----------|
| **安装门槛** | 桌面必装 | 桌面 + CLI | 桌面 | **浏览器即用** | 获客主渠道 |
| **Spec / 工程化** | 弱 | **Specs + Hooks 强** | Memories / Rules | 规则 + @ | 不追 Kiro Spec；5 后加强「任务清单」 |
| **Agent 感知** | Composer | Cloud Agent | **实时编辑/终端感知** | 工具链 + 活动线 | IDE-5 块级 Diff；不追 Cascade 全感知 |
| **Tab 补全** | Copilot++ | 中等 | 强 | 单行/少行 | **IDE-5 FIM** |
| **终端** | 本机 | 本机 | 本机 + Turbo | WebContainer → **4b 本机** | 已交付 4b |
| **MCP** | 有 | **GA 级 AWS MCP** | 有 | 骨架 | 官方目录深化，不开放任意上传 |
| **国内 CNY** | 弱 | AWS 账单 | 弱 | **支付宝 ✅** | D3 主卖点 |
| **BYOK** | 混合 | Bedrock 为主 | 平台 | **默认本地 Key** | 隐私叙事 |
| **后台无人 Agent** | **30min 级** | Cloud Agent | Devin 集成 | 无 | 2027 服务端队列 |
| **自动更新（桌面）** | 有 | 有 | 有 | **4b-5 electron-updater** | GitHub Releases |

---

## 5. 场景选型（更新）

| 场景 | 更合适 |
|------|--------|
| 已深度 VS Code 插件、C++/Java 日更 + 调试器 | **Cursor** 或 **Windsurf** |
| AWS 全栈、要 Spec/Hook/CloudTrail 审计 | **Kiro** |
| 要强 Agent 跟手改码、USD Pro、多模型 | **Windsurf** |
| 国内个人/小团队、支付宝、¥19 | **AI IDE** |
| 教室 / 不能装软件 / Chromebook | **AI IDE** |
| 自带 DeepSeek、小仓前端脚本 | **AI IDE** |
| 「浏览器 + 国内订阅 + 本机盘 Agent」 | **AI IDE**（主战场） |

---

## 6. 三条「可赢」与「不追」（四竞品语境）

### 可赢

1. **浏览器 + 国内订阅 + BYOK**（Cursor/Windsurf/Kiro 均弱）  
2. **本机文件夹 + 工具 Agent**（对标 Composer/Cascade **入门**）  
3. **轻量仓 + 中文 UI**（非三者重心）

### 不追

1. VS Code 插件兼容（三竞品共同优势）  
2. Kiro 级 **Spec 工件 + Agent Hooks 全链路**  
3. Cursor **Tab++** / Windsurf **Cascade 全感知** / 30min 云 Agent（短期）

### 有选择地追（12 个月）

| 优先级 | 交付 | 主要缩小与谁的差距 |
|:------:|------|-------------------|
| P0 | IDE-4b 桌面 + 本机终端 | Cursor/Windsurf **终端/大仓** |
| P0 | 4b-5 自动更新 | 桌面「可运营」 |
| P1 | IDE-5 块级 Diff | Cursor Composer / Windsurf Cascade |
| P1 | IDE-5 Tab FIM | Cursor Tab++ |
| P2 | 索引 Worker 2k | 三者 @ 检索（lite） |
| P3 | 任务清单 / 轻 Spec | Kiro Spec **子集**，不做 Hooks 引擎 |

---

## 7. 评分路线图（含竞品参照）

| 时期 | AI IDE 目标 | 仍低于 |
|------|-------------|--------|
| **GA（现在）** | ~2.35 | Cursor −1.25；Windsurf −1.10 |
| **4b 完成** | **~2.55** | Cursor −1.05 |
| **IDE-5（+6 月）** | **~2.75** | Cursor −0.85；仍低于 Windsurf ~0.7 |
| **2027** | ~3.0 | 可选后台任务；**仍非** Cursor/Windsurf 替代 |

---

## 8. 复评节奏

1. 每发 **桌面 tag** `v*.*.*` → 跑 [PHASE_IDE4B.md](./PHASE_IDE4B.md) 验收  
2. 每完成 IDE-5 子项 → 更新本表「AI IDE」列  
3. 竞品大版本（Kiro GA、Windsurf 定价变）→ 修订 Kiro/Windsurf 列，**Cursor 参照分可微调 ±0.1**

---

## 9. v1.3.9 收官附记（2026-06-05）

| 项 | 值 |
|----|-----|
| AI IDE 综合分 | **~3.28～3.32** |
| 与 Cursor 差距 | **~−0.28～−0.32**（较 GA ~2.35 大幅收窄） |
| 宣传线 3.4 | **未达到** — 设计留给 [V1.4_KICKOFF.md](./V1.4_KICKOFF.md) |
| 详细维度 | [COMPETITOR_SCORE_V1.3.9.md](./COMPETITOR_SCORE_V1.3.9.md) |
