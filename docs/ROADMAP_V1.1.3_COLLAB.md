# v1.1.3 协作 M1（P0-B · 占位）

> **状态**：**未启动** — 仅当放弃 P0-A 后台队列时升为下一 Kickoff  
> **主规划**：[ROADMAP_V1.1.md](./ROADMAP_V1.1.md) §4.2

---

## 定位

**协作 M1** = WebRTC Beta 之上的 **稳定信令**：房间创建/加入、只读/编辑权限、断线重连。**仍非** Google Docs 级 OT。

---

## 预估 patch（草案）

| 版本 | 主题 |
|------|------|
| 1.1.3.1 | WebSocket/SFU 选型 + 房间 API |
| 1.1.3.2 | `collaborationService` 重构 + 重连 |
| 1.1.3.3 | 权限模型（host / editor / viewer） |
| 1.1.3.4 | 冲突策略文档 + 10min 双机 smoke |
| 1.1.3.5 | GA 文档 → tag **v1.1.3** |

---

## 与 v1.1.2 关系

**不要**与 [ROADMAP_V1.1.2.x.md](./ROADMAP_V1.1.2.x.md) 并行 P0。完成 v1.1.2 或明确砍 P0-A 后再开本文档 Kickoff。
