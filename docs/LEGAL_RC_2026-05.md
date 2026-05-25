# 法务定稿记录（P2-6）— RC v1.0.0-rc.1

> **路径 A 公测**：不收款；订阅 UI 仅作配额与功能说明。

## 定稿文件

| 文件 | 语言 | 状态 |
|------|------|:----:|
| [public/legal/privacy.html](../public/legal/privacy.html) | 中文 | ✅ RC 定稿 2026-05-24 |
| [public/legal/terms.html](../public/legal/terms.html) | 中文 | ✅ RC 定稿 2026-05-24 |
| [public/legal/privacy-en.html](../public/legal/privacy-en.html) | English | ✅ RC 定稿 2026-05-24 |
| [public/legal/terms-en.html](../public/legal/terms-en.html) | English | ✅ RC 定稿 2026-05-24 |

## 与产品一致性核对

| 项 | 条款中的表述 |
|----|----------------|
| BYOK / API Key 本地 | 隐私：不经服务器代理对话与 Key |
| 云账号 / Neon / Vercel | 隐私：托管与子处理方 |
| 公测不收款（路径 A） | 条款顶部说明 + 订阅章节 |
| 用量计数 | 隐私：不含对话正文 |
| 协作 Beta | 条款与隐私均标注实验性 |
| 联系入口 | GitHub Issues（FengYue427/ai-ide） |

## 验收（维护者）

- [x] 欢迎页中英链接可打开四页
- [x] 无「仅模板、法务审阅前勿用」类占位语（已改为 RC 公测说明）
- [x] 与 [LAUNCH_ASSESSMENT_2026-05.md](./LAUNCH_ASSESSMENT_2026-05.md) 路径 A 一致

## 上线后

部署含 `public/legal/*` 的构建后，生产 URL 抽查：

- `https://ai-ide-flame.vercel.app/legal/privacy.html`
- `https://ai-ide-flame.vercel.app/legal/terms-en.html`

## 非律师声明

本文档为产品/工程对齐用 RC 披露文本，**不构成法律意见**。正式商业化或启用收款前，建议执业律师按运营主体与司法辖区再审。
