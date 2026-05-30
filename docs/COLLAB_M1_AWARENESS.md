# 协作 M1 — 光标/选区 Awareness（1.1.3.3）

> **状态**：已实现  
> **前置**：[COLLAB_M1_RECONNECT.md](./COLLAB_M1_RECONNECT.md)

---

## 行为

- 加入协作房间后，本地 **光标与选区** 写入 Yjs `awareness`（`user.cursor` / `user.selection`）
- 仅当远程用户正在编辑 **当前打开的文件** 时，Monaco 显示其选区背景与光标竖线
- 更新节流 **80ms**，避免 awareness 风暴
- 成员面板显示各用户 `cursor.filePath`  basename

---

## 代码入口

| 模块 | 说明 |
|------|------|
| `src/hooks/useCollabEditorPresence.ts` | 编辑器 ↔ awareness ↔ decorations |
| `src/lib/collabAwareness.ts` | 解析远程 presence、生成 Monaco decorations |
| `collaborationService.updateEditorPresence()` | 节流写入本地 awareness |

---

## 手测

1. A、B 加入同一房间，均打开 `index.js`
2. A 拖选一段文字 → B 看到 A 颜色选区 + 光标
3. B 切换到 `app.js` → A 在 `index.js` 不再看到 B 的光标
4. 协作面板成员行显示 `· index.js` 等文件名

---

## 限制

- 不同文件之间 **不** 显示远程光标（按设计）
- awareness 不加密；viewer 也会广播只读光标
- 角色变更仍靠 **轮询**（1.1.3.1），非 awareness 推送
