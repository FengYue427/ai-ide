# v1.0.2.7 — 1.0.2 附属收官（macOS + 文档封板）

> **前置**：1.0.2.1～1.0.2.6 已全部交付。  
> **下一主版本**：[V1.0.3_MASTER_PLAN.md](./V1.0.3_MASTER_PLAN.md)

---

## 交付清单

| ID | 内容 | 验收 |
|----|------|------|
| 2.7-1 | **Electron macOS CI** | `ci.yml` `desktop-mac-build`；`desktop-release.yml` mac job |
| 2.7-2 | **竞品 live 对比升版** | [COMPETITOR_COMPARISON_V1.0.2.md](./COMPETITOR_COMPARISON_V1.0.2.md) → **2.75** |
| 2.7-3 | Release **`v1.0.2.7`** | `git tag v1.0.2.7 && git push origin v1.0.2.7` → Desktop workflow |
| 2.7-4 | README / ROADMAP 终稿 | 双平台桌面、1.0.3 入口 |

---

## macOS 构建

### CI（每 push main）

```yaml
# .github/workflows/ci.yml → desktop-mac-build
# unsigned dmg + zip，artifact 上传
```

### 发布（打 tag）

```powershell
git tag v1.0.2.7
git push origin v1.0.2.7
# desktop-release.yml → win + mac 并行发布到 GitHub Releases
```

### 本地（需 macOS）

```bash
npm ci
npm run electron:pack:mac
# release/AI-IDE-*-mac-*.dmg
```

> CI 产物 **未签名**；用户首次打开需在系统设置允许。正式签名留 **1.0.3** 运维项。

---

## 1.0.2.x 世代总结

| 附属 | 主题 |
|------|------|
| 1.0.2.1 | 运维与信任 |
| 1.0.2.2 | 块级 Diff |
| 1.0.2.3 | Tab FIM |
| 1.0.2.4 | 索引第二档 |
| 1.0.2.5 | Agent 工具链（grep_repo） |
| 1.0.2.6 | 任务清单 + 域名 + Toast |
| **1.0.2.7** | **macOS + 封板** |

**正式开启** → [V1.0.3_KICKOFF.md](./V1.0.3_KICKOFF.md)
