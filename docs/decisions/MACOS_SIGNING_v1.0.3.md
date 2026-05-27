# 决策记录 — macOS 代码签名 v1.0.3

**日期**：2026-05-26 · **状态**：已采纳

---

## 背景

1.0.2.7 已交付 **macOS CI**（unsigned `dmg`/`zip`）。Kickoff 需决定 GA 前是否 Apple 签名。

---

## 决策

**v1.0.3 GA 不阻塞于 Apple 代码签名**；继续发布 **unsigned** 构建，文档说明首次打开步骤。

**Apple Developer 签名**列为 1.0.3 **Could**（有预算/主体后再做）。

---

## 用户指引

1. 从 [GitHub Releases](https://github.com/FengYue427/ai-ide/releases) 下载 `AI-IDE-*-mac-*.dmg`
2. 若提示「无法验证开发者」：系统设置 → 隐私与安全性 → **仍要打开**
3. 或使用 `zip` 解压后从终端 `xattr -cr AI\ IDE.app`（高级用户）

---

## 工程

- CI：`CSC_IDENTITY_AUTO_DISCOVERY=false`
- 签名就绪后：Vercel/GitHub Secrets 配 `CSC_LINK` + `CSC_KEY_PASSWORD`，移除 auto-discovery 禁用

---

## 复评

主体注册 + Apple Developer Program 就绪时在 **1.0.3 补丁或 v1.1** 启用签名。
