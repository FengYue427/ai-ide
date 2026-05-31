# v1.1.6.x 补丁（Git 可视化抛光）

> **前置**：tag **`v1.1.6`**（B 轨 GA）  
> **长期上下文**：[ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md)

---

## 定位

v1.1.6.x 是 **轨道 A** 小 patch，在 v1.1.6 整包 GA 后持续抛光 Git UX，**不阻断** v1.1.7（调试器）规划。

---

## 已完成

| 版本 | 主题 | 状态 |
|------|------|:----:|
| **1.1.6.1** | diff tab **截断**（≤2000 行 / 512KB 每侧 + 提示条） | ✅ |
| **1.1.6.2** | **statusMatrix** 解析 + staged diff（无 HEAD / 暂存删除 / 新文件） | ✅ |
| **1.1.6.3** | 历史 **load more**（50 条/页 · parent 续拉） | ✅ |
| **1.1.6.4** | Git **ja 漏翻**（empty.git · status.gitTitle · 全 git.* 覆盖测试） | ✅ |

## 建议 backlog（草案 · GA 后填充）

| 版本 | 主题 | 说明 | 优先级 |
|------|------|------|:------:|
| **1.1.6.1** | diff tab **性能** | 大文件 diff 懒加载 / 截断提示 | ✅ |
| **1.1.6.2** | **staged diff** 热修 | index diff 边界 case | ✅ |
| **1.1.6.3** | log **分页** | depth > 50 load more | ✅ |
| **1.1.6.4** | Git **i18n 漏翻** | ja 补全 | ✅ |
| **1.1.6.5+** | 桌面 **原生 git** 探索 | Electron 本地 repo 只读 status | P2 |

---

## 发版

与 1.1.5.x 相同：`test:local` → bump 第四段 → deploy。

---

## 与 v1.1.7 边界

| 放 1.1.6.x | 放 v1.1.7（B 轨） |
|------------|-------------------|
| Git UI 小 bug、i18n | **调试器** attach |
| diff 性能微调 | 断点 / call stack |
| — | 插件调试 API |
