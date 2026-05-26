# Production smoke report

- **URL**: https://ai-ide-flame.vercel.app
- **Time**: 2026-05-26 (post-GA verification)

- [x] **health** — ok db=connected billing.alipay=yes
- [x] **payment-methods** — billingPath=B alipay=true
- [x] **user acceptance** — production Alipay checkout (¥19 Pro) succeeded

**Result**: D3 GA payment path verified

**Note**: Some networks in CN may not resolve `*.vercel.app`; use browser/VPN/custom domain if `fetch` times out locally.
