# Release Notes — v1.1.9.3（patch）

**主题**：右侧 AI 面板 — 扩大对话区占比  
**基于**：`v1.1.9.1` / 布局整改提交

---

## Changed

- AI 控制区改为**单行紧凑条**：模型 chips、迷你用量条、Agent / Plan / 工作区 **图标按钮**
- 索引状态等详情默认**收起**，点击 Chevron 展开（偏好写入 `localStorage`）
- 右栏 Chat 默认宽度略增（380px / 420px）

## UX

- 消息列表获得 `flex: 1` + `min-height: 0`，在右栏内占满剩余高度
- 用量组件新增 `inline` 变体，避免原先 2×2 栅格占高

---

## 升级

无破坏性 API 变更；拉取 `main` 即可。
