# v1.2.x 补丁（轨道 A）

> **v1.2.4 GA** 之后的小版本，第四段 `1.2.4.1` 起。与 **v1.2.5 质量线** 并行。  
> **当前质量线**：[V1.2.8_KICKOFF.md](./V1.2.8_KICKOFF.md) · **最新 GA**：v1.2.7

---

## 已完成（基线）

| 版本 | 主题 | 状态 |
|------|------|------|
| **1.2.0** | 多根 · 虚拟树 · 插件可信 | ✅ GA |
| **1.2.2** | Workbench Shell | ✅ GA |
| **1.2.3** | 产品深度 | ✅ GA |
| **1.2.4** | Agent/索引/E2E | ✅ GA |
| **1.2.5** | 质量/生态 E2E | ✅ GA |
| **1.2.6** | 语义导航/预检/生产开关 | ✅ GA |
| **1.2.7** | 导航 E2E · payload · 插件/平台运维 | ✅ GA |

---

## CI 发版门禁（v1.2.5 F3）

| Job | 命令 | 阻塞 |
|-----|------|:----:|
| build | `npm test` + `test:unit` + `test:smoke` | ✅ |
| integration-api | `test:integration:local` | ✅ |
| e2e-ui | `test:e2e` | ✅ |
| e2e-stack | `test:e2e:stack` | ✅ |
| e2e-collab | `test:e2e:collab` | ✅ |

本地发版前：

```bash
npm run test:local
npm run test:e2e:local
npm run test:e2e:stack   # 需 Postgres
```

---

## 下一 patch 建议（1.2.4.1+）

- 热修仅走 `main` + tag `v1.2.4.1`，不扩 F 阶段范围
- 每 patch 更新 `CHANGELOG` 与 `RELEASE_NOTES` 补丁段
