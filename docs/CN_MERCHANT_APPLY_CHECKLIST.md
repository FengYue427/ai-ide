# 国内支付商户开通清单（支付宝 + 微信）

> 与代码配置 [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) 配合。开通周期通常 **2～4 周**，建议 RC 期立即申请。

## 支付宝

| 步骤 | 动作 | 产出 |
|------|------|------|
| 1 | [支付宝开放平台](https://open.alipay.com/) 注册开发者 | 账号 |
| 2 | 创建应用 → 添加能力 **电脑网站支付** | AppID |
| 3 | 配置 **应用公钥** / 上传 **应用私钥** | 密钥对 |
| 4 | 下载 **支付宝公钥** | `ALIPAY_PUBLIC_KEY` |
| 5 | **沙箱** 环境单独 AppID | `ALIPAY_SANDBOX=true` |
| 6 | 生产：提交应用上线审核 | 生产 AppID |
| 7 | 设置 **异步通知** | `https://你的域名/api/payment/alipay/notify` |

## 微信支付

| 步骤 | 动作 | 产出 |
|------|------|------|
| 1 | [微信支付商户平台](https://pay.weixin.qq.com/) 入驻 | 商户号 `WECHAT_MCH_ID` |
| 2 | 产品中心开通 **Native 支付** | 权限 |
| 3 | API 安全：设置 APIv3 密钥 | `WECHAT_API_V3_KEY` |
| 4 | 申请 API 证书，记录序列号 | `WECHAT_SERIAL_NO` + `WECHAT_PRIVATE_KEY` |
| 5 | 下载 **平台证书** 公钥 | `WECHAT_PLATFORM_PUBLIC_KEY` |
| 6 | 关联 AppID（公众号/移动应用按需） | `WECHAT_APP_ID` |
| 7 | 配置 **支付通知 URL** | `https://你的域名/api/payment/wechat/notify` |

## 主体与合规（产品侧）

| 项 | 说明 |
|----|------|
| 营业执照 | 商户入驻通常需要 |
| 类目 | 软件 / 互联网服务 |
| 网站 | 生产域名可访问；隐私/条款已上线 |
| ICP 备案 | 长期国内运营建议规划（非代码项） |

## 开通后验证

```powershell
cd c:\Users\18663\IDE\ai-ide
# 写入 .env.local 后
npm run billing:preflight
npm run dev:stack
```

浏览器：登录 → 订阅 → 支付宝 / 微信 → 付款 → 刷新后配额为 Pro。
