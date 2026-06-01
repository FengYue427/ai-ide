# v1.1.9.x 补丁（插件 SDK 2.0 抛光）

> **更新**：2026-06-01 · 前置 tag **`v1.1.9`**  
> **下一 B 轨**：见 [ROADMAP_V1.2.md](./ROADMAP_V1.2.md)

---

## 定位

轨道 A：在 SDK 2.0 GA 后抛光 **市场/已安装 UI**、**健康检查**、**E2E/CI**，不打新 B 轨 tag。

---

## 顺序

| 版本 | 主题 | 状态 |
|------|------|:----:|
| **1.1.9.1** | 已安装插件 SDK 徽章 · 文档链接 · smoke `platformAi` | 进行中 |
| **1.1.9.2** | 插件作者 `PLUGIN_SDK_V2` 示例扩展（可选 API） | 待办 |

---

## 验收

- [x] 市场与已安装列表均可见 `sdkVersion: 2`
- [x] `GET /api/health` 含 `platformAi`（smoke 可选检查）
- [x] Collab E2E 稳定选择器
- [x] 设置页 platformAi 状态（合入 1.1.8.4）
