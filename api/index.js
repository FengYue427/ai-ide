var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// lib/api/healthStatus.ts
async function buildHealthCheck(options) {
  const payload = {
    status: "ok",
    service: "ai-ide-api",
    version: options.version ?? "1.0.0-rc.1",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    billing: options.billing
  };
  if (!options.hasDatabaseUrl) {
    payload.status = "degraded";
    payload.database = "not_configured";
    payload.hints = [
      "Set DATABASE_URL on Vercel (Neon pooler URL with sslmode=require).",
      "Set AUTH_SECRET (32+ random chars) and APP_URL to your deployment origin."
    ];
    return { payload, statusCode: 503 };
  }
  try {
    await options.pingDatabase();
    payload.database = "connected";
    return { payload, statusCode: 200 };
  } catch {
    payload.status = "degraded";
    payload.database = "unavailable";
    payload.hints = [
      "Verify Neon project is active and DATABASE_URL uses the pooler host.",
      "Redeploy after changing env vars; run npm run smoke:production."
    ];
    return { payload, statusCode: 503 };
  }
}
var init_healthStatus = __esm({
  "lib/api/healthStatus.ts"() {
    "use strict";
  }
});

// lib/api/http.ts
function jsonResponse(data, status = 200, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}
function errorResponse(message, status = 400, headers) {
  return jsonResponse({ error: message }, status, headers);
}
var init_http = __esm({
  "lib/api/http.ts"() {
    "use strict";
  }
});

// lib/api/releaseVersion.ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
function getReleaseVersion() {
  const fromEnv = process.env.APP_VERSION?.trim() || process.env.npm_package_version?.trim();
  if (fromEnv) return fromEnv;
  if (cached) return cached;
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const candidates = [
      join(here, "..", "..", "..", "package.json"),
      join(here, "..", "package.json")
    ];
    for (const pkgPath of candidates) {
      const raw = readFileSync(pkgPath, "utf8");
      const ver = JSON.parse(raw)?.version;
      if (typeof ver === "string" && ver.trim()) {
        cached = ver.trim();
        return cached;
      }
    }
  } catch {
  }
  return FALLBACK;
}
var FALLBACK, cached;
var init_releaseVersion = __esm({
  "lib/api/releaseVersion.ts"() {
    "use strict";
    FALLBACK = "1.1.2.4";
    cached = null;
  }
});

// lib/billing/pemKey.ts
function normalizePemKey(raw, defaultType) {
  const text = raw.replace(/\\n/g, "\n").trim();
  if (!text) {
    throw new Error(
      "\u5BC6\u94A5\u4E3A\u7A7A\u3002\u82E5\u5199\u5728 .env.local \u591A\u884C\u65E0\u5F15\u53F7\uFF0C\u53EF\u80FD\u53EA\u8BFB\u5165\u7B2C\u4E00\u884C\uFF1B\u8BF7\u7528 ALIPAY_*_PATH \u6307\u5411 .pem \u6587\u4EF6\uFF0C\u6216\u5355\u884C\u7528 \\n \u8FDE\u63A5\u3002"
    );
  }
  const begin = text.match(/-----BEGIN ([^-]+)-----/);
  const end = text.match(/-----END ([^-]+)-----/);
  const type = begin?.[1]?.trim() || end?.[1]?.trim() || defaultType;
  const body = text.replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/\s+/g, "");
  if (!body || body.length < 32) {
    throw new Error(
      "\u5BC6\u94A5\u5185\u5BB9\u8FC7\u77ED\u6216\u65E0\u6548\u3002\u8BF7\u4ECE\u652F\u4ED8\u5B9D\u5F00\u653E\u5E73\u53F0\u590D\u5236\u5B8C\u6574\u5E94\u7528\u79C1\u94A5\u4E0E\u652F\u4ED8\u5B9D\u516C\u94A5\uFF0C\u6216\u4F7F\u7528 *_PATH \u6307\u5411 pem \u6587\u4EF6\u3002"
    );
  }
  const lines = body.match(/.{1,64}/g) ?? [body];
  return `-----BEGIN ${type}-----
${lines.join("\n")}
-----END ${type}-----`;
}
var init_pemKey = __esm({
  "lib/billing/pemKey.ts"() {
    "use strict";
  }
});

// lib/billing/plans.ts
function getBillablePlanNames() {
  return BILLING_PLANS.filter((plan) => plan.name !== "free").map((plan) => plan.name);
}
function findPlanByName(name) {
  return BILLING_PLANS.find((plan) => plan.name === name || plan.id === name);
}
function getPlanLimits(planName) {
  return findPlanByName(planName)?.limits ?? BILLING_PLANS[0].limits;
}
function getWorkspaceLimit(planName) {
  return getPlanLimits(planName).workspaces;
}
function getStripePriceId(planName) {
  if (planName === "pro") return process.env.STRIPE_PRICE_PRO;
  if (planName === "enterprise") return process.env.STRIPE_PRICE_ENTERPRISE;
  return void 0;
}
function getPlanAmountCents(planName) {
  const plan = findPlanByName(planName);
  if (!plan || plan.price <= 0) return 0;
  return Math.round(plan.price * 100);
}
function formatPlanPrice(plan) {
  if (plan.price === 0) return "\u514D\u8D39";
  if (plan.currency === "CNY") return `\xA5${plan.price}`;
  return `$${plan.price}`;
}
var BILLING_PLANS;
var init_plans = __esm({
  "lib/billing/plans.ts"() {
    "use strict";
    BILLING_PLANS = [
      {
        id: "free",
        name: "free",
        displayName: "\u514D\u8D39\u7248",
        description: "\u4E2A\u4EBA\u5B66\u4E60\u4E0E\u65E5\u5E38\u5C0F\u9879\u76EE\uFF0C\u914D\u989D\u5DF2\u653E\u5BBD",
        price: 0,
        currency: "CNY",
        features: [
          "\u57FA\u7840 AI \u5BF9\u8BDD\uFF08\u81EA\u5E26 API Key\uFF09",
          "\u6700\u591A 10 \u4E2A\u4E91\u5DE5\u4F5C\u533A",
          "\u6BCF\u65E5 200 \u6B21\u670D\u52A1\u7AEF\u914D\u989D\u8BA1\u6570",
          "3GB \u4E91\u5B58\u50A8\u989D\u5EA6\uFF08\u89C4\u5212\uFF09"
        ],
        limits: { aiRequestsPerDay: 200, workspaces: 10, storageGB: 3 }
      },
      {
        id: "pro",
        name: "pro",
        displayName: "\u4E13\u4E1A\u7248",
        description: "\u9AD8\u9891\u4E2A\u4EBA\u5F00\u53D1\u8005\uFF0C\u9AD8\u6027\u4EF7\u6BD4",
        price: 19,
        currency: "CNY",
        features: [
          "\u5168\u90E8 AI \u6A21\u578B\u4E0E Agent",
          "\u65E0\u9650\u4E91\u5DE5\u4F5C\u533A",
          "\u6BCF\u65E5 5000 \u6B21\u914D\u989D\uFF08\u5BBD\u677E\uFF09",
          "30GB \u4E91\u5B58\u50A8\u989D\u5EA6\uFF08\u89C4\u5212\uFF09",
          "\u652F\u4ED8\u5B9D / \u5FAE\u4FE1\u8BA2\u9605"
        ],
        limits: { aiRequestsPerDay: 5e3, workspaces: -1, storageGB: 30 }
      },
      {
        id: "enterprise",
        name: "enterprise",
        displayName: "\u56E2\u961F\u7248",
        description: "\u5C0F\u56E2\u961F\u4E0E\u91CD\u5EA6\u7528\u6237\uFF0C\u914D\u989D\u51E0\u4E4E\u4E0D\u9650",
        price: 49,
        currency: "CNY",
        features: [
          "\u4E13\u4E1A\u7248\u5168\u90E8\u80FD\u529B",
          "AI \u914D\u989D\u4E0D\u9650\uFF08-1\uFF09",
          "\u65E0\u9650\u4E91\u5DE5\u4F5C\u533A",
          "100GB \u4E91\u5B58\u50A8\u989D\u5EA6\uFF08\u89C4\u5212\uFF09",
          "\u4F18\u5148\u652F\u6301\uFF08\u89C4\u5212\uFF09"
        ],
        limits: { aiRequestsPerDay: -1, workspaces: -1, storageGB: 100 }
      }
    ];
  }
});

// lib/billing/stripe.ts
import Stripe from "stripe";
function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}
function resolveAppOrigin(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  return "http://localhost:3000";
}
async function createStripeCheckoutSession(params) {
  const priceId = getStripePriceId(params.planName);
  if (!priceId) {
    throw new Error(`\u672A\u914D\u7F6E Stripe \u4EF7\u683C ID\uFF08STRIPE_PRICE_${params.planName.toUpperCase()}\uFF09`);
  }
  const origin = resolveAppOrigin(params.req);
  const stripe = getStripeClient();
  const customerField = params.stripeCustomerId ? { customer: params.stripeCustomerId } : { customer_email: params.email };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...customerField,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/?subscription=success&plan=${params.planName}`,
    cancel_url: `${origin}/?subscription=canceled`,
    metadata: {
      userId: params.userId,
      planName: params.planName
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        planName: params.planName
      }
    }
  });
  if (!session.url) {
    throw new Error("Stripe \u672A\u8FD4\u56DE checkout URL");
  }
  return session.url;
}
async function resumeStripeSubscription(stripeSubscriptionId) {
  const stripe = getStripeClient();
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false
  });
}
async function cancelStripeSubscriptionAtPeriodEnd(stripeSubscriptionId) {
  const stripe = getStripeClient();
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true
  });
}
async function cancelStripeSubscriptionImmediately(stripeSubscriptionId) {
  const stripe = getStripeClient();
  await stripe.subscriptions.cancel(stripeSubscriptionId);
}
async function createStripeBillingPortalSession(params) {
  const stripe = getStripeClient();
  const origin = resolveAppOrigin(params.req);
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: `${origin}/?subscription=portal_return`
  });
  if (!session.url) {
    throw new Error("Stripe \u672A\u8FD4\u56DE\u5BA2\u6237\u95E8\u6237 URL");
  }
  return session.url;
}
function constructStripeEvent(payload, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature ?? "", secret);
}
var init_stripe = __esm({
  "lib/billing/stripe.ts"() {
    "use strict";
    init_plans();
  }
});

// lib/billing/paymentOrigin.ts
function resolvePaymentReturnOrigin(req) {
  return resolveAppOrigin(req);
}
function isLocalNotifyOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin.replace(/\/$/, ""));
}
function resolvePaymentNotifyOrigin(req) {
  const override = process.env.PAYMENT_NOTIFY_URL?.trim();
  if (override) return override.replace(/\/$/, "");
  const origin = resolveAppOrigin(req);
  const sandbox = process.env.ALIPAY_SANDBOX === "true" || process.env.ALIPAY_SANDBOX === "1";
  if (sandbox && isLocalNotifyOrigin(origin)) {
    const fallback = process.env.ALIPAY_SANDBOX_NOTIFY_FALLBACK?.trim();
    if (fallback) return fallback.replace(/\/$/, "");
    throw new Error(
      "\u652F\u4ED8\u5B9D\u6C99\u7BB1\u4E0D\u63A5\u53D7 localhost \u4F5C\u4E3A notify_url\u3002\u8BF7\u8FD0\u884C ngrok http 3001\uFF0C\u5728 .env.local \u8BBE\u7F6E PAYMENT_NOTIFY_URL=https://\u4F60\u7684\u96A7\u9053\u57DF\u540D\uFF0C\u7136\u540E\u91CD\u542F dev:stack\u3002"
    );
  }
  return origin;
}
var init_paymentOrigin = __esm({
  "lib/billing/paymentOrigin.ts"() {
    "use strict";
    init_stripe();
  }
});

// src/lib/dbUrl.ts
function shouldUseNeonAdapter(connectionString) {
  if (process.env.USE_NEON_DRIVER === "true") return true;
  if (process.env.USE_NEON_DRIVER === "false") return false;
  return /neon\.tech/i.test(connectionString);
}
function sanitizeDatabaseUrl(connectionString) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return connectionString.replace(/[&?]channel_binding=[^&]*/gi, "").replace(/\?&/, "?");
  }
}
var init_dbUrl = __esm({
  "src/lib/dbUrl.ts"() {
    "use strict";
  }
});

// src/lib/prisma.ts
var prisma_exports = {};
__export(prisma_exports, {
  getPrisma: () => getPrisma,
  prisma: () => prisma,
  sanitizeDatabaseUrl: () => sanitizeDatabaseUrl,
  shouldUseNeonAdapter: () => shouldUseNeonAdapter
});
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (shouldUseNeonAdapter(connectionString)) {
    const adapter = new PrismaNeonHTTP(sanitizeDatabaseUrl(connectionString), {});
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}
function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}
var globalForPrisma, prisma;
var init_prisma = __esm({
  "src/lib/prisma.ts"() {
    "use strict";
    init_dbUrl();
    init_dbUrl();
    globalForPrisma = globalThis;
    prisma = new Proxy({}, {
      get(_target, prop) {
        const client = getPrisma();
        const value = Reflect.get(client, prop, client);
        if (typeof value === "function") {
          return value.bind(client);
        }
        return value;
      }
    });
  }
});

// lib/billing/paymentOrders.ts
import { randomBytes } from "crypto";
function generateOutTradeNo() {
  return `aide_${Date.now()}_${randomBytes(4).toString("hex")}`;
}
async function createPaymentOrder(params) {
  return prisma.paymentOrder.create({
    data: {
      userId: params.userId,
      planName: params.planName,
      channel: params.channel,
      outTradeNo: generateOutTradeNo(),
      amountCents: params.amountCents,
      currency: "CNY",
      status: "pending"
    }
  });
}
async function getPaymentOrderByOutTradeNo(outTradeNo) {
  return prisma.paymentOrder.findUnique({ where: { outTradeNo } });
}
async function getPaymentOrderById(id) {
  return prisma.paymentOrder.findUnique({ where: { id } });
}
async function markPaymentOrderPaid(outTradeNo, tradeNo) {
  const order = await prisma.paymentOrder.findUnique({ where: { outTradeNo } });
  if (!order) return false;
  if (order.status === "paid") return false;
  if (order.status !== "pending") return false;
  await prisma.paymentOrder.update({
    where: { outTradeNo },
    data: {
      status: "paid",
      tradeNo: tradeNo ?? void 0,
      paidAt: /* @__PURE__ */ new Date()
    }
  });
  return true;
}
var init_paymentOrders = __esm({
  "lib/billing/paymentOrders.ts"() {
    "use strict";
    init_prisma();
  }
});

// lib/billing/alipayPay.ts
import { AlipaySdk } from "alipay-sdk";
function resolveAlipayGateway() {
  const explicit = process.env.ALIPAY_GATEWAY?.trim();
  if (explicit) return explicit;
  if (process.env.ALIPAY_SANDBOX === "true" || process.env.ALIPAY_SANDBOX === "1") {
    return ALIPAY_GATEWAY_SANDBOX;
  }
  return ALIPAY_GATEWAY_PRODUCTION;
}
function getAlipaySdk() {
  let privateKey;
  let alipayPublicKey;
  try {
    privateKey = readKeyFromEnv(
      process.env.ALIPAY_PRIVATE_KEY,
      process.env.ALIPAY_PRIVATE_KEY_PATH,
      "RSA PRIVATE KEY"
    );
    alipayPublicKey = readKeyFromEnv(
      process.env.ALIPAY_PUBLIC_KEY,
      process.env.ALIPAY_PUBLIC_KEY_PATH,
      "PUBLIC KEY"
    );
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err);
    throw new Error(`\u652F\u4ED8\u5B9D\u5BC6\u94A5\u65E0\u6548: ${hint}`);
  }
  return new AlipaySdk({
    appId: process.env.ALIPAY_APP_ID.trim(),
    privateKey,
    alipayPublicKey,
    gateway: resolveAlipayGateway(),
    signType: "RSA2"
  });
}
function buildPagePayParams(params) {
  return {
    bizContent: {
      out_trade_no: params.outTradeNo,
      total_amount: params.totalAmountYuan,
      subject: params.subject,
      product_code: "FAST_INSTANT_TRADE_PAY"
    },
    returnUrl: params.returnUrl,
    notifyUrl: params.notifyUrl
  };
}
function createAlipayPageFormHtml(params) {
  const sdk = getAlipaySdk();
  const html = sdk.pageExecute("alipay.trade.page.pay", "POST", buildPagePayParams(params));
  if (!html || typeof html !== "string" || !html.includes("<form")) {
    throw new Error("\u652F\u4ED8\u5B9D\u672A\u8FD4\u56DE\u652F\u4ED8\u8868\u5355");
  }
  return html;
}
function parseAlipayReturnQuery(search) {
  const q = search.startsWith("?") ? search.slice(1) : search;
  const params = {};
  if (!q) return params;
  for (const part of q.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq));
    const value = decodeURIComponent(part.slice(eq + 1).replace(/\+/g, " "));
    params[key] = value;
  }
  return params;
}
function stripAppReturnQueryParams(params) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (APP_RETURN_QUERY_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}
function verifyAlipaySign(params) {
  const sdk = getAlipaySdk();
  const signedOnly = stripAppReturnQueryParams(params);
  if (sdk.checkNotifySign(signedOnly)) return true;
  try {
    return sdk.checkNotifySignV2(signedOnly);
  } catch {
    return false;
  }
}
function verifyAlipayNotify(params) {
  return verifyAlipaySign(params);
}
async function queryAlipayTrade(outTradeNo) {
  const sdk = getAlipaySdk();
  const raw = await sdk.exec("alipay.trade.query", {
    bizContent: { out_trade_no: outTradeNo }
  });
  const tradeStatus = String(raw.tradeStatus ?? raw.trade_status ?? "");
  const tradeNo = raw.tradeNo != null ? String(raw.tradeNo) : raw.trade_no != null ? String(raw.trade_no) : void 0;
  return { tradeStatus, tradeNo };
}
var ALIPAY_GATEWAY_PRODUCTION, ALIPAY_GATEWAY_SANDBOX, APP_RETURN_QUERY_KEYS;
var init_alipayPay = __esm({
  "lib/billing/alipayPay.ts"() {
    "use strict";
    init_cnPayment();
    ALIPAY_GATEWAY_PRODUCTION = "https://openapi.alipay.com/gateway.do";
    ALIPAY_GATEWAY_SANDBOX = "https://openapi-sandbox.dl.alipaydev.com/gateway.do";
    APP_RETURN_QUERY_KEYS = /* @__PURE__ */ new Set(["subscription", "plan"]);
  }
});

// lib/billing/wechatPay.ts
import WxPay from "wechatpay-node-v3";
function getWxPay() {
  const privateKey = Buffer.from(
    readKeyFromEnv(process.env.WECHAT_PRIVATE_KEY, process.env.WECHAT_PRIVATE_KEY_PATH, "PRIVATE KEY"),
    "utf8"
  );
  const platformInline = process.env.WECHAT_PLATFORM_PUBLIC_KEY?.trim();
  const platformPath = process.env.WECHAT_PLATFORM_PUBLIC_KEY_PATH?.trim();
  if (!platformInline && !platformPath) {
    throw new Error(
      "\u5FAE\u4FE1\u652F\u4ED8\u7F3A\u5C11\u5E73\u53F0\u8BC1\u4E66\u516C\u94A5\uFF1A\u8BF7\u8BBE\u7F6E WECHAT_PLATFORM_PUBLIC_KEY \u6216 WECHAT_PLATFORM_PUBLIC_KEY_PATH\uFF08\u5546\u6237\u5E73\u53F0 \u2192 API \u5B89\u5168 \u2192 \u5E73\u53F0\u8BC1\u4E66\uFF09"
    );
  }
  const publicKeyPem = readKeyFromEnv(platformInline, platformPath, "CERTIFICATE");
  return new WxPay({
    appid: process.env.WECHAT_APP_ID.trim(),
    mchid: process.env.WECHAT_MCH_ID.trim(),
    publicKey: Buffer.from(publicKeyPem, "utf8"),
    privateKey,
    key: process.env.WECHAT_API_V3_KEY.trim(),
    serial_no: process.env.WECHAT_SERIAL_NO?.trim()
  });
}
async function createWechatNativePay(params) {
  const pay = getWxPay();
  const result = await pay.transactions_native({
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    amount: {
      total: params.amountCents,
      currency: "CNY"
    }
  });
  const codeUrl = result.code_url || result.data?.code_url;
  if (!codeUrl) {
    throw new Error("\u5FAE\u4FE1\u672A\u8FD4\u56DE\u652F\u4ED8\u4E8C\u7EF4\u7801\u94FE\u63A5");
  }
  return { codeUrl };
}
function getWxPayVerifier() {
  return getWxPay();
}
var init_wechatPay = __esm({
  "lib/billing/wechatPay.ts"() {
    "use strict";
    init_cnPayment();
  }
});

// lib/billing/cnPayment.ts
import { readFileSync as readFileSync2 } from "node:fs";
function isAlipayConfigured() {
  return Boolean(
    process.env.ALIPAY_APP_ID?.trim() && (process.env.ALIPAY_PRIVATE_KEY?.trim() || process.env.ALIPAY_PRIVATE_KEY_PATH?.trim()) && (process.env.ALIPAY_PUBLIC_KEY?.trim() || process.env.ALIPAY_PUBLIC_KEY_PATH?.trim())
  );
}
function isWechatPayConfigured() {
  const hasPlatformCert = Boolean(
    process.env.WECHAT_PLATFORM_PUBLIC_KEY?.trim() || process.env.WECHAT_PLATFORM_PUBLIC_KEY_PATH?.trim()
  );
  return Boolean(
    process.env.WECHAT_APP_ID?.trim() && process.env.WECHAT_MCH_ID?.trim() && process.env.WECHAT_API_V3_KEY?.trim() && process.env.WECHAT_SERIAL_NO?.trim() && (process.env.WECHAT_PRIVATE_KEY?.trim() || process.env.WECHAT_PRIVATE_KEY_PATH?.trim()) && hasPlatformCert
  );
}
function isCnPaymentConfigured() {
  return isAlipayConfigured() || isWechatPayConfigured();
}
function readKeyFromEnv(inlineKey, pathKey, pemType) {
  let raw;
  if (inlineKey?.trim()) {
    raw = inlineKey;
  } else if (pathKey?.trim()) {
    raw = readFileSync2(pathKey.trim(), "utf8");
  }
  if (!raw) {
    throw new Error(`\u5BC6\u94A5\u672A\u914D\u7F6E\uFF08\u9700\u8981 ${pemType}\uFF09`);
  }
  return normalizePemKey(raw, pemType);
}
async function createCnCheckout(params) {
  const plan = findPlanByName(params.planName);
  if (!plan) throw new Error("\u65E0\u6548\u7684\u8BA1\u5212");
  const amountCents = getPlanAmountCents(params.planName);
  if (amountCents <= 0) throw new Error("\u8BE5\u8BA1\u5212\u65E0\u9700\u652F\u4ED8");
  const order = await createPaymentOrder({
    userId: params.userId,
    planName: params.planName,
    channel: params.channel,
    amountCents
  });
  const returnOrigin = resolvePaymentReturnOrigin(params.req);
  const notifyOrigin = resolvePaymentNotifyOrigin(params.req);
  const subject = `AI IDE ${plan.displayName} \u8BA2\u9605`;
  if (params.channel === "alipay") {
    if (!isAlipayConfigured()) {
      throw new Error("\u652F\u4ED8\u5B9D\u672A\u914D\u7F6E\uFF1A\u8BF7\u8BBE\u7F6E ALIPAY_APP_ID\u3001ALIPAY_PRIVATE_KEY\u3001ALIPAY_PUBLIC_KEY");
    }
    const formHtml = createAlipayPageFormHtml({
      outTradeNo: order.outTradeNo,
      totalAmountYuan: (amountCents / 100).toFixed(2),
      subject,
      returnUrl: `${returnOrigin}/?subscription=success&plan=${params.planName}`,
      notifyUrl: `${notifyOrigin}/api/payment/alipay/notify`
    });
    return { mode: "alipay", orderId: order.id, outTradeNo: order.outTradeNo, formHtml };
  }
  if (!isWechatPayConfigured()) {
    throw new Error("\u5FAE\u4FE1\u652F\u4ED8\u672A\u914D\u7F6E\uFF1A\u8BF7\u8BBE\u7F6E WECHAT_APP_ID\u3001WECHAT_MCH_ID\u3001WECHAT_API_V3_KEY\u3001WECHAT_PRIVATE_KEY");
  }
  const { codeUrl } = await createWechatNativePay({
    outTradeNo: order.outTradeNo,
    amountCents,
    description: subject,
    notifyUrl: `${notifyOrigin}/api/payment/wechat/notify`
  });
  return {
    mode: "wechat",
    orderId: order.id,
    outTradeNo: order.outTradeNo,
    codeUrl
  };
}
var init_cnPayment = __esm({
  "lib/billing/cnPayment.ts"() {
    "use strict";
    init_pemKey();
    init_paymentOrigin();
    init_plans();
    init_paymentOrders();
    init_alipayPay();
    init_wechatPay();
  }
});

// lib/billing/billingMode.ts
function isDevBillingAllowed() {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production") return false;
  if (isCnPaymentConfigured() || isStripeConfigured()) return false;
  if (process.env.ALLOW_DEV_BILLING === "true") return true;
  return true;
}
function isDevPaymentSimulateAllowed() {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.ALLOW_DEV_BILLING === "true") return true;
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv || nodeEnv === "development" || nodeEnv === "test") return true;
  return false;
}
function getBillingCapabilities() {
  return {
    alipay: isAlipayConfigured(),
    wechat: isWechatPayConfigured(),
    stripe: isStripeConfigured(),
    devMock: isDevBillingAllowed(),
    devSimulate: isDevPaymentSimulateAllowed()
  };
}
var init_billingMode = __esm({
  "lib/billing/billingMode.ts"() {
    "use strict";
    init_cnPayment();
    init_stripe();
  }
});

// lib/api/handlers/health.ts
var health_exports = {};
__export(health_exports, {
  GET: () => GET
});
import { neon } from "@neondatabase/serverless";
async function GET(_req) {
  const billing = getBillingCapabilities();
  const dbUrl = process.env.DATABASE_URL?.trim();
  const { payload, statusCode } = await buildHealthCheck({
    version: getReleaseVersion(),
    hasDatabaseUrl: Boolean(dbUrl),
    pingDatabase: async () => {
      if (!dbUrl) throw new Error("DATABASE_URL not set");
      if (shouldUseNeonAdapter(dbUrl)) {
        const sql = neon(sanitizeDatabaseUrl(dbUrl));
        await sql`SELECT 1`;
        return;
      }
      const { prisma: prisma2 } = await Promise.resolve().then(() => (init_prisma(), prisma_exports));
      await prisma2.$queryRaw`SELECT 1`;
    },
    billing: {
      alipay: billing.alipay,
      wechat: billing.wechat,
      stripe: billing.stripe,
      devMock: billing.devMock
    }
  });
  if (payload.database === "unavailable") {
    console.error("[Health] database check failed");
  }
  return jsonResponse(payload, statusCode);
}
var init_health = __esm({
  "lib/api/handlers/health.ts"() {
    "use strict";
    init_healthStatus();
    init_http();
    init_releaseVersion();
    init_billingMode();
    init_dbUrl();
  }
});

// src/lib/jwt.ts
import jwt from "jsonwebtoken";
function resolveJwtSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return FALLBACK_SECRET;
}
function getJwtSecret() {
  if (!jwtSecret) jwtSecret = resolveJwtSecret();
  return jwtSecret;
}
function createJWT(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}
function verifyJWT(token) {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded;
  } catch {
    return null;
  }
}
function getTokenFromRequest(req) {
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/auth-token=([^;]+)/);
    if (match) return match[1];
  }
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}
var FALLBACK_SECRET, jwtSecret;
var init_jwt = __esm({
  "src/lib/jwt.ts"() {
    "use strict";
    FALLBACK_SECRET = "your-fallback-secret-key-change-in-production";
  }
});

// lib/api/handlers/auth/session.ts
var session_exports = {};
__export(session_exports, {
  GET: () => GET2
});
async function GET2(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const payload = verifyJWT(token);
    if (!payload) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
    });
    if (!user) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      user,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString()
      // 7天后过期
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[Auth] Session error:", error);
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}
var init_session = __esm({
  "lib/api/handlers/auth/session.ts"() {
    "use strict";
    init_prisma();
    init_jwt();
  }
});

// lib/api/rateLimit.ts
function cleanupExpired(now) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "unknown";
}
function checkRateLimit(req, options) {
  const now = Date.now();
  cleanupExpired(now);
  const ip = getClientIp(req);
  const bucketKey = `${options.key}:${ip}${options.suffix ? `:${options.suffix}` : ""}`;
  const existing = buckets.get(bucketKey);
  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit - 1,
      retryAfterSec: 0
    };
  }
  if (existing.count >= options.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1e3));
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      retryAfterSec
    };
  }
  existing.count += 1;
  return {
    allowed: true,
    limit: options.limit,
    remaining: options.limit - existing.count,
    retryAfterSec: 0
  };
}
function resolveRateLimitOptions(kind) {
  const defaults = {
    "auth:register": { key: "auth:register", limit: 5, windowMs: 15 * 6e4 },
    "auth:login": { key: "auth:login", limit: 20, windowMs: 15 * 6e4 },
    "auth:forgot": { key: "auth:forgot", limit: 5, windowMs: 60 * 6e4 },
    "usage:ai": { key: "usage:ai", limit: 120, windowMs: 6e4 },
    "workspaces:write": { key: "workspaces:write", limit: 60, windowMs: 6e4 }
  };
  return defaults[kind];
}
var buckets, CLEANUP_INTERVAL_MS, lastCleanup;
var init_rateLimit = __esm({
  "lib/api/rateLimit.ts"() {
    "use strict";
    buckets = /* @__PURE__ */ new Map();
    CLEANUP_INTERVAL_MS = 6e4;
    lastCleanup = Date.now();
  }
});

// lib/api/rateLimitKv.ts
function resolveKvEnv() {
  const url = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim() || "";
  const token = process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || "";
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}
function bucketKeyForWindow(key, windowMs, now) {
  const windowId = Math.floor(now / windowMs);
  return `ratelimit:${key}:${windowId}`;
}
async function upstashPipeline(env, commands) {
  const res = await fetch(`${env.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(commands)
  });
  if (!res.ok) {
    throw new Error(`KV HTTP ${res.status}`);
  }
  const json = await res.json();
  return json;
}
async function checkRateLimitKv(env, bucketKey, windowMs) {
  const commandsNx = [
    ["INCR", bucketKey],
    ["PEXPIRE", bucketKey, windowMs, "NX"],
    ["PTTL", bucketKey]
  ];
  try {
    const r = await upstashPipeline(env, commandsNx);
    const incr = Number(r[0]?.result ?? 0);
    const ttl = Number(r[2]?.result ?? -1);
    return { count: incr, ttlMs: ttl };
  } catch {
    const r = await upstashPipeline(env, [
      ["INCR", bucketKey],
      ["PEXPIRE", bucketKey, windowMs],
      ["PTTL", bucketKey]
    ]);
    const incr = Number(r[0]?.result ?? 0);
    const ttl = Number(r[2]?.result ?? -1);
    return { count: incr, ttlMs: ttl };
  }
}
async function checkRateLimitDistributed(req, options) {
  const env = !options.disableKv ? resolveKvEnv() : null;
  if (!env) {
    return checkRateLimit(req, options);
  }
  const now = Date.now();
  const key = bucketKeyForWindow(options.key, options.windowMs, now);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "unknown";
  const discriminator = `${ip}${options.suffix ? `:${options.suffix}` : ""}`;
  const bucketKey = `${key}:${discriminator}`;
  try {
    const { count, ttlMs } = await checkRateLimitKv(env, bucketKey, options.windowMs);
    const remaining = Math.max(0, options.limit - count);
    const retryAfterSec = remaining > 0 ? 0 : Math.max(1, Math.ceil((ttlMs > 0 ? ttlMs : options.windowMs) / 1e3));
    return {
      allowed: count <= options.limit,
      limit: options.limit,
      remaining,
      retryAfterSec
    };
  } catch (error) {
    console.warn("[rateLimitKv] fallback to memory:", error instanceof Error ? error.message : error);
    return checkRateLimit(req, options);
  }
}
var init_rateLimitKv = __esm({
  "lib/api/rateLimitKv.ts"() {
    "use strict";
    init_rateLimit();
  }
});

// lib/i18n/apiMessages.ts
function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === void 0 ? `{${key}}` : String(value);
  });
}
function apiMessage(key, locale, params) {
  const table = API_MESSAGES[locale];
  const raw = table[key] ?? API_MESSAGES["zh-CN"][key] ?? key;
  return interpolate(raw, params);
}
var API_MESSAGES;
var init_apiMessages = __esm({
  "lib/i18n/apiMessages.ts"() {
    "use strict";
    API_MESSAGES = {
      "zh-CN": {
        "api.auth.required": "\u90AE\u7BB1\u548C\u5BC6\u7801\u5FC5\u586B",
        "api.auth.invalidCredentials": "\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF",
        "api.auth.loginFailed": "\u767B\u5F55\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
        "api.auth.registerFailed": "\u6CE8\u518C\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
        "api.auth.invalidEmail": "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740",
        "api.auth.passwordMin": "\u5BC6\u7801\u81F3\u5C11\u9700\u89818\u4F4D",
        "api.auth.emailTaken": "\u90AE\u7BB1\u5DF2\u6CE8\u518C",
        "api.auth.emailRequired": "\u90AE\u7BB1\u5FC5\u586B",
        "api.auth.sendFailed": "\u53D1\u9001\u5931\u8D25",
        "api.auth.forgotDemoMessage": "\u6682\u672A\u63A5\u5165\u771F\u5B9E\u90AE\u4EF6\u670D\u52A1\uFF1B\u8BF7\u4F7F\u7528\u6CE8\u518C\u90AE\u7BB1\u76F4\u63A5\u767B\u5F55\uFF0C\u6216\u8054\u7CFB\u7BA1\u7406\u5458\u91CD\u7F6E\u5BC6\u7801\u3002",
        "api.auth.unauthorized": "\u672A\u767B\u5F55",
        "api.auth.sessionExpired": "\u4F1A\u8BDD\u65E0\u6548\u6216\u5DF2\u8FC7\u671F",
        "api.auth.userNotFound": "\u7528\u6237\u4E0D\u5B58\u5728",
        "api.auth.oauthNotConfigured": "OAuth \u672A\u914D\u7F6E",
        "api.auth.oauthSessionInvalid": "OAuth \u4F1A\u8BDD\u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55",
        "api.auth.oauthUserNotFound": "\u672A\u627E\u5230 OAuth \u7528\u6237\uFF0C\u8BF7\u91CD\u8BD5",
        "api.auth.oauthSyncFailed": "OAuth \u540C\u6B65\u5931\u8D25",
        "api.auth.oauthHandlerFailed": "OAuth \u5904\u7406\u5931\u8D25",
        "api.auth.credentialsProvider": "\u90AE\u7BB1\u5BC6\u7801",
        "api.auth.loginOk": "\u767B\u5F55\u6210\u529F",
        "api.auth.registerOk": "\u6CE8\u518C\u6210\u529F",
        "api.auth.signoutOk": "\u5DF2\u9000\u51FA\u767B\u5F55",
        "api.auth.oauthSyncOk": "OAuth \u767B\u5F55\u6210\u529F",
        "api.workspace.created": "\u5DE5\u4F5C\u533A\u5DF2\u521B\u5EFA",
        "api.workspace.saved": "\u5DE5\u4F5C\u533A\u5DF2\u4FDD\u5B58",
        "api.workspace.deleted": "\u5DE5\u4F5C\u533A\u5DF2\u5220\u9664",
        "api.payment.simulateOk": "\u6A21\u62DF\u652F\u4ED8\u6210\u529F\uFF0C\u8BA2\u9605\u5DF2\u66F4\u65B0",
        "api.rateLimit.exceeded": "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5",
        "api.body.tooLarge": "\u8BF7\u6C42\u4F53\u8FC7\u5927",
        "api.body.invalidJson": "\u8BF7\u6C42\u4F53\u4E0D\u662F\u6709\u6548 JSON",
        "api.notFound": "\u672A\u627E\u5230",
        "api.handlerNotFound": "\u5904\u7406\u5668\u672A\u627E\u5230",
        "api.usage.readFailed": "\u65E0\u6CD5\u8BFB\u53D6\u7528\u91CF",
        "api.usage.writeFailed": "\u65E0\u6CD5\u8BB0\u5F55\u7528\u91CF",
        "api.usage.quotaExceeded": "\u4ECA\u65E5 AI \u914D\u989D\u5DF2\u7528\u5B8C",
        "api.workspace.nameRequired": "\u7F3A\u5C11\u5DE5\u4F5C\u533A\u540D\u79F0",
        "api.workspace.nameInvalid": "\u5DE5\u4F5C\u533A\u540D\u79F0\u65E0\u6548",
        "api.workspace.notFound": "\u5DE5\u4F5C\u533A\u4E0D\u5B58\u5728",
        "api.workspace.loadFailed": "\u52A0\u8F7D\u5DE5\u4F5C\u533A\u5931\u8D25",
        "api.workspace.saveFailed": "\u4FDD\u5B58\u5DE5\u4F5C\u533A\u5931\u8D25",
        "api.workspace.deleteFailed": "\u5220\u9664\u5DE5\u4F5C\u533A\u5931\u8D25",
        "api.workspace.listFailed": "\u83B7\u53D6\u5DE5\u4F5C\u533A\u5217\u8868\u5931\u8D25",
        "api.workspace.createFailed": "\u521B\u5EFA\u5DE5\u4F5C\u533A\u5931\u8D25",
        "api.workspace.defaultCannotDelete": "\u9ED8\u8BA4\u5DE5\u4F5C\u533A\u4E0D\u80FD\u5220\u9664",
        "api.workspace.limitReached": "\u5F53\u524D\u8BA1\u5212\u6700\u591A {limit} \u4E2A\u4E91\u5DE5\u4F5C\u533A\uFF0C\u8BF7\u5347\u7EA7\u4E13\u4E1A\u7248\u6216\u56E2\u961F\u7248",
        "api.workspace.filesFieldTooLarge": "files \u5B57\u6BB5\u8FC7\u5927",
        "api.workspace.settingsFieldTooLarge": "settings \u5B57\u6BB5\u8FC7\u5927",
        "api.workspace.fileCountExceeded": "\u6587\u4EF6\u6570\u8FC7\u591A\uFF08\u6700\u591A {max}\uFF09",
        "api.workspace.filesInvalid": "files \u683C\u5F0F\u65E0\u6548",
        "api.workspace.fileNameInvalid": "\u6587\u4EF6\u540D\u65E0\u6548",
        "api.workspace.fileContentTooLarge": "\u6587\u4EF6\u5185\u5BB9\u8FC7\u5927",
        "api.workspace.settingsInvalid": "settings \u683C\u5F0F\u65E0\u6548",
        "api.checkout.missingPlanId": "\u7F3A\u5C11 planId",
        "api.checkout.freeNoCheckout": "\u514D\u8D39\u8BA1\u5212\u65E0\u9700\u7ED3\u8D26",
        "api.checkout.invalidPlan": "\u65E0\u6548\u7684\u8BA1\u5212",
        "api.checkout.alipayNotConfigured": "\u652F\u4ED8\u5B9D\u672A\u914D\u7F6E\uFF0C\u8BF7\u7A0D\u540E\u5728\u670D\u52A1\u7AEF\u914D\u7F6E\u5546\u6237\u53C2\u6570",
        "api.checkout.wechatNotConfigured": "\u5FAE\u4FE1\u652F\u4ED8\u672A\u914D\u7F6E\uFF0C\u8BF7\u7A0D\u540E\u5728\u670D\u52A1\u7AEF\u914D\u7F6E\u5546\u6237\u53C2\u6570",
        "api.checkout.noPaymentNeeded": "\u8BE5\u8BA1\u5212\u65E0\u9700\u652F\u4ED8",
        "api.checkout.channelRequired": "\u8BF7\u9009\u62E9\u652F\u4ED8\u65B9\u5F0F\uFF1Aalipay \u6216 wechat",
        "api.checkout.notConfigured": "\u652F\u4ED8\u529F\u80FD\u5C1A\u672A\u914D\u7F6E\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458",
        "api.checkout.sessionFailed": "\u521B\u5EFA\u652F\u4ED8\u4F1A\u8BDD\u5931\u8D25",
        "api.checkout.devUpgraded": "\u5F00\u53D1\u6A21\u5F0F\uFF1A\u5DF2\u5347\u7EA7\u4E3A {plan}",
        "api.subscription.stripeNotConfigured": "Stripe \u672A\u914D\u7F6E",
        "api.subscription.webhookFailed": "Webhook \u6821\u9A8C\u5931\u8D25",
        "api.subscription.noResume": "\u5F53\u524D\u6CA1\u6709\u53EF\u6062\u590D\u7684\u4ED8\u8D39\u8BA2\u9605",
        "api.subscription.resumeFailed": "\u6062\u590D\u8BA2\u9605\u5931\u8D25",
        "api.subscription.portalNotConfigured": "\u5F53\u524D\u73AF\u5883\u672A\u914D\u7F6E Stripe \u5BA2\u6237\u95E8\u6237",
        "api.subscription.noStripeCustomer": "\u672A\u627E\u5230 Stripe \u5BA2\u6237\u8BB0\u5F55\uFF0C\u8BF7\u5148\u5B8C\u6210\u4E00\u6B21\u4ED8\u8D39\u8BA2\u9605",
        "api.subscription.portalFailed": "\u65E0\u6CD5\u6253\u5F00\u5BA2\u6237\u95E8\u6237",
        "api.subscription.freeNoCancel": "\u5F53\u524D\u4E3A\u514D\u8D39\u8BA1\u5212\uFF0C\u65E0\u9700\u53D6\u6D88",
        "api.subscription.cancelFailed": "\u53D6\u6D88\u8BA2\u9605\u5931\u8D25",
        "api.subscription.cancelImmediate": "\u5DF2\u964D\u7EA7\u4E3A\u514D\u8D39\u7248",
        "api.subscription.cancelScheduled": "\u8BA2\u9605\u5DF2\u53D6\u6D88",
        "api.subscription.cancelDoneNow": "\u5DF2\u7ACB\u5373\u964D\u7EA7\u4E3A\u514D\u8D39\u7248",
        "api.subscription.cancelEndOfPeriod": "\u5DF2\u5B89\u6392\u5728\u5468\u671F\u7ED3\u675F\u540E\u964D\u7EA7\uFF0C\u5230\u671F\u524D\u4ECD\u53EF\u4F7F\u7528\u5F53\u524D\u8BA1\u5212",
        "api.subscription.resumeActive": "\u8BA2\u9605\u4ECD\u5728\u751F\u6548\u4E2D\uFF0C\u65E0\u9700\u6062\u590D",
        "api.subscription.resumeOk": "\u5DF2\u6062\u590D\u8BA2\u9605\uFF0C\u4E0B\u4E2A\u5468\u671F\u5C06\u6B63\u5E38\u7EED\u8D39",
        "api.subscription.expired": "\u8BA2\u9605\u5DF2\u5230\u671F\uFF0C\u5DF2\u6062\u590D\u4E3A\u514D\u8D39\u7248\u914D\u989D",
        "api.billing.expireCronOk": "\u5DF2\u5904\u7406\u5230\u671F\u8BA2\u9605\uFF08{expired}/{scanned}\uFF09",
        "api.payment.orderIdRequired": "\u7F3A\u5C11\u8BA2\u5355 ID",
        "api.payment.orderNotFound": "\u8BA2\u5355\u4E0D\u5B58\u5728",
        "api.payment.devOnly": "\u4EC5\u5F00\u53D1\u73AF\u5883\u53EF\u7528",
        "api.payment.simulateFailed": "\u6A21\u62DF\u652F\u4ED8\u5931\u8D25",
        "api.job.created": "\u540E\u53F0\u4EFB\u52A1\u5DF2\u521B\u5EFA",
        "api.job.cancelled": "\u540E\u53F0\u4EFB\u52A1\u5DF2\u53D6\u6D88",
        "api.job.promptRequired": "\u7F3A\u5C11\u4EFB\u52A1\u63D0\u793A\u8BCD",
        "api.job.promptTooLong": "\u4EFB\u52A1\u63D0\u793A\u8BCD\u8FC7\u957F",
        "api.job.repoKeyTooLong": "\u5DE5\u4F5C\u533A\u6807\u8BC6\u8FC7\u957F",
        "api.job.idRequired": "\u7F3A\u5C11\u4EFB\u52A1 ID",
        "api.job.notFound": "\u4EFB\u52A1\u4E0D\u5B58\u5728",
        "api.job.notCancellable": "\u4EFB\u52A1\u5F53\u524D\u72B6\u6001\u4E0D\u53EF\u53D6\u6D88",
        "api.job.listFailed": "\u83B7\u53D6\u4EFB\u52A1\u5217\u8868\u5931\u8D25",
        "api.job.createFailed": "\u521B\u5EFA\u4EFB\u52A1\u5931\u8D25",
        "api.job.loadFailed": "\u52A0\u8F7D\u4EFB\u52A1\u5931\u8D25",
        "api.job.cancelFailed": "\u53D6\u6D88\u4EFB\u52A1\u5931\u8D25",
        "api.job.processCronOk": "\u5DF2\u5904\u7406\u540E\u53F0\u4EFB\u52A1\uFF08\u6210\u529F {succeeded}/{processed}\uFF0C\u8D85\u65F6\u6E05\u7406 {staleFailed}\uFF09",
        "api.job.processFailed": "\u5904\u7406\u540E\u53F0\u4EFB\u52A1\u5931\u8D25",
        "api.job.dailyLimit": "\u4ECA\u65E5\u540E\u53F0\u4EFB\u52A1\u5DF2\u8FBE\u4E0A\u9650\uFF08{limit}\uFF09",
        "api.job.dailyLimitUpgrade": "\u514D\u8D39\u7248\u6BCF\u65E5\u540E\u53F0\u4EFB\u52A1\u4E0A\u9650\u4E3A {limit} \u6B21\uFF0C\u8BF7\u5347\u7EA7\u4E13\u4E1A\u7248",
        "api.job.concurrentLimit": "\u8FDB\u884C\u4E2D\u7684\u540E\u53F0\u4EFB\u52A1\u8FC7\u591A\uFF08\u6700\u591A {limit} \u4E2A\uFF09",
        "api.job.concurrentLimitUpgrade": "\u514D\u8D39\u7248\u540C\u65F6\u53EA\u80FD\u6709 {limit} \u4E2A\u540E\u53F0\u4EFB\u52A1\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210\u6216\u5347\u7EA7\u4E13\u4E1A\u7248"
      },
      "en-US": {
        "api.auth.required": "Email and password are required",
        "api.auth.invalidCredentials": "Invalid email or password",
        "api.auth.loginFailed": "Sign-in failed. Try again later.",
        "api.auth.registerFailed": "Registration failed. Try again later.",
        "api.auth.invalidEmail": "Enter a valid email address",
        "api.auth.passwordMin": "Password must be at least 8 characters",
        "api.auth.emailTaken": "Email already registered",
        "api.auth.emailRequired": "Email is required",
        "api.auth.sendFailed": "Could not send email",
        "api.auth.forgotDemoMessage": "Email delivery is not configured. Sign in with your registered email or contact an administrator.",
        "api.auth.unauthorized": "Not signed in",
        "api.auth.sessionExpired": "Session invalid or expired",
        "api.auth.userNotFound": "User not found",
        "api.auth.oauthNotConfigured": "OAuth is not configured",
        "api.auth.oauthSessionInvalid": "OAuth session invalid. Sign in again.",
        "api.auth.oauthUserNotFound": "OAuth user not found. Try again.",
        "api.auth.oauthSyncFailed": "OAuth sync failed",
        "api.auth.oauthHandlerFailed": "OAuth handler failed",
        "api.auth.credentialsProvider": "Email & password",
        "api.auth.loginOk": "Signed in successfully",
        "api.auth.registerOk": "Registration successful",
        "api.auth.signoutOk": "Signed out",
        "api.auth.oauthSyncOk": "OAuth sign-in successful",
        "api.workspace.created": "Workspace created",
        "api.workspace.saved": "Workspace saved",
        "api.workspace.deleted": "Workspace deleted",
        "api.payment.simulateOk": "Payment simulated; subscription updated",
        "api.rateLimit.exceeded": "Too many requests. Try again later.",
        "api.body.tooLarge": "Request body is too large",
        "api.body.invalidJson": "Request body is not valid JSON",
        "api.notFound": "Not found",
        "api.handlerNotFound": "Handler not found",
        "api.usage.readFailed": "Could not read usage",
        "api.usage.writeFailed": "Could not record usage",
        "api.usage.quotaExceeded": "Daily AI quota exceeded",
        "api.workspace.nameRequired": "Workspace name is required",
        "api.workspace.nameInvalid": "Invalid workspace name",
        "api.workspace.notFound": "Workspace not found",
        "api.workspace.loadFailed": "Failed to load workspace",
        "api.workspace.saveFailed": "Failed to save workspace",
        "api.workspace.deleteFailed": "Failed to delete workspace",
        "api.workspace.listFailed": "Failed to list workspaces",
        "api.workspace.createFailed": "Failed to create workspace",
        "api.workspace.defaultCannotDelete": "The default workspace cannot be deleted",
        "api.workspace.limitReached": "Your plan allows up to {limit} cloud workspaces. Upgrade to Pro or Team.",
        "api.workspace.filesFieldTooLarge": "The files field is too large",
        "api.workspace.settingsFieldTooLarge": "The settings field is too large",
        "api.workspace.fileCountExceeded": "Too many files (max {max})",
        "api.workspace.filesInvalid": "Invalid files format",
        "api.workspace.fileNameInvalid": "Invalid file name",
        "api.workspace.fileContentTooLarge": "File content is too large",
        "api.workspace.settingsInvalid": "Invalid settings format",
        "api.checkout.missingPlanId": "Missing planId",
        "api.checkout.freeNoCheckout": "Free plan does not require checkout",
        "api.checkout.invalidPlan": "Invalid plan",
        "api.checkout.alipayNotConfigured": "Alipay is not configured on the server",
        "api.checkout.wechatNotConfigured": "WeChat Pay is not configured on the server",
        "api.checkout.noPaymentNeeded": "This plan does not require payment",
        "api.checkout.channelRequired": "Choose a payment channel: alipay or wechat",
        "api.checkout.notConfigured": "Payments are not configured. Contact an administrator.",
        "api.checkout.sessionFailed": "Failed to create checkout session",
        "api.checkout.devUpgraded": "Dev mode: upgraded to {plan}",
        "api.subscription.stripeNotConfigured": "Stripe is not configured",
        "api.subscription.webhookFailed": "Webhook verification failed",
        "api.subscription.noResume": "No paid subscription to resume",
        "api.subscription.resumeFailed": "Failed to resume subscription",
        "api.subscription.portalNotConfigured": "Stripe customer portal is not configured",
        "api.subscription.noStripeCustomer": "No Stripe customer found. Complete a paid subscription first.",
        "api.subscription.portalFailed": "Could not open customer portal",
        "api.subscription.freeNoCancel": "Free plan does not need cancellation",
        "api.subscription.cancelFailed": "Failed to cancel subscription",
        "api.subscription.cancelImmediate": "Downgraded to Free",
        "api.subscription.cancelScheduled": "Subscription cancelled",
        "api.subscription.cancelDoneNow": "Downgraded to Free immediately",
        "api.subscription.cancelEndOfPeriod": "Cancellation scheduled for period end; current plan remains active until then",
        "api.subscription.resumeActive": "Subscription is still active",
        "api.subscription.resumeOk": "Subscription resumed; renewal continues next period",
        "api.subscription.expired": "Subscription ended; your plan is now Free",
        "api.billing.expireCronOk": "Processed expired subscriptions ({expired}/{scanned})",
        "api.payment.orderIdRequired": "Missing order ID",
        "api.payment.orderNotFound": "Order not found",
        "api.payment.devOnly": "Development environment only",
        "api.payment.simulateFailed": "Payment simulation failed",
        "api.job.created": "Background job created",
        "api.job.cancelled": "Background job cancelled",
        "api.job.promptRequired": "Job prompt is required",
        "api.job.promptTooLong": "Job prompt is too long",
        "api.job.repoKeyTooLong": "Workspace key is too long",
        "api.job.idRequired": "Job ID is required",
        "api.job.notFound": "Job not found",
        "api.job.notCancellable": "Job cannot be cancelled in its current state",
        "api.job.listFailed": "Failed to list jobs",
        "api.job.createFailed": "Failed to create job",
        "api.job.loadFailed": "Failed to load job",
        "api.job.cancelFailed": "Failed to cancel job",
        "api.job.processCronOk": "Processed background jobs ({succeeded}/{processed} succeeded, {staleFailed} stale failed)",
        "api.job.processFailed": "Failed to process background jobs",
        "api.job.dailyLimit": "Daily background job limit reached ({limit})",
        "api.job.dailyLimitUpgrade": "Free plan allows {limit} background jobs per day. Upgrade to Pro.",
        "api.job.concurrentLimit": "Too many active background jobs (max {limit})",
        "api.job.concurrentLimitUpgrade": "Free plan allows {limit} active background job at a time. Wait or upgrade to Pro."
      }
    };
  }
});

// lib/i18n/resolveLocale.ts
function resolveRequestLocale(req) {
  if (!req) return "zh-CN";
  const appLang = req.headers.get(APP_LANGUAGE_HEADER)?.trim().toLowerCase();
  if (appLang === "en-us" || appLang === "en") return "en-US";
  if (appLang === "zh-cn" || appLang === "zh") return "zh-CN";
  const accept = req.headers.get("accept-language")?.toLowerCase() ?? "";
  if (/\ben(-us)?\b/.test(accept) && !/\bzh\b/.test(accept.split(",")[0] ?? "")) {
    return "en-US";
  }
  return "zh-CN";
}
var APP_LANGUAGE_HEADER;
var init_resolveLocale = __esm({
  "lib/i18n/resolveLocale.ts"() {
    "use strict";
    APP_LANGUAGE_HEADER = "x-app-language";
  }
});

// lib/api/localizedError.ts
var localizedError_exports = {};
__export(localizedError_exports, {
  appendApiMessage: () => appendApiMessage,
  authJsonError: () => authJsonError,
  localizedErrorResponse: () => localizedErrorResponse,
  localizedSuccessResponse: () => localizedSuccessResponse
});
function appendApiMessage(req, key, body, params) {
  const locale = resolveRequestLocale(req);
  return {
    ...body,
    message: apiMessage(key, locale, params),
    messageKey: key
  };
}
function localizedSuccessResponse(req, key, body = { success: true }, status = 200, params, headers) {
  return jsonResponse(appendApiMessage(req, key, body, params), status, headers);
}
function localizedErrorResponse(req, key, status = 400, params, headers) {
  const locale = resolveRequestLocale(req);
  return jsonResponse({ error: apiMessage(key, locale, params), errorKey: key }, status, headers);
}
function authJsonError(req, key, status) {
  const locale = resolveRequestLocale(req);
  return new Response(
    JSON.stringify({ error: apiMessage(key, locale), errorKey: key }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}
var init_localizedError = __esm({
  "lib/api/localizedError.ts"() {
    "use strict";
    init_apiMessages();
    init_resolveLocale();
    init_http();
  }
});

// lib/api/rateLimitResponse.ts
function rateLimitErrorResponse(req, result) {
  return localizedErrorResponse(req, "api.rateLimit.exceeded", 429, void 0, {
    "Retry-After": String(result.retryAfterSec),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining)
  });
}
var init_rateLimitResponse = __esm({
  "lib/api/rateLimitResponse.ts"() {
    "use strict";
    init_localizedError();
  }
});

// lib/api/authCookie.ts
function buildAuthSetCookie(token, maxAgeSeconds = 604800) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}
function buildAuthClearCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
function buildOAuthClearCookies() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const base = `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
  return [
    `authjs.session-token=; ${base}`,
    `__Secure-authjs.session-token=; ${base}`,
    `authjs.csrf-token=; ${base}`
  ];
}
function buildAllAuthClearCookies() {
  return [buildAuthClearCookie(), ...buildOAuthClearCookies()];
}
var init_authCookie = __esm({
  "lib/api/authCookie.ts"() {
    "use strict";
  }
});

// lib/api/logger.ts
function write(level, message, fields) {
  const entry = {
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    message,
    ...fields
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
function logApi(level, message, fields) {
  write(level, message, fields);
}
function logApiEvent(event, fields) {
  write("info", event, { ...fields, event });
}
function getRequestIdFromHeaders(req) {
  return req.headers.get("x-request-id")?.trim() || "unknown";
}
function trackServerEvent(req, event, fields) {
  logApiEvent(event, {
    requestId: getRequestIdFromHeaders(req),
    ...fields
  });
}
var init_logger = __esm({
  "lib/api/logger.ts"() {
    "use strict";
  }
});

// lib/api/handlers/auth/register.ts
var register_exports = {};
__export(register_exports, {
  POST: () => POST
});
import bcrypt from "bcryptjs";
async function POST(req) {
  try {
    const rate = await checkRateLimitDistributed(req, resolveRateLimitOptions("auth:register"));
    if (!rate.allowed) return rateLimitErrorResponse(req, rate);
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return authJsonError(req, "api.auth.required", 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return authJsonError(req, "api.auth.invalidEmail", 400);
    }
    if (password.length < 8) {
      return authJsonError(req, "api.auth.passwordMin", 400);
    }
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (existing) {
      return authJsonError(req, "api.auth.emailTaken", 400);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split("@")[0]
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
    });
    await prisma.userWorkspace.create({
      data: {
        userId: user.id,
        name: "default",
        files: "[]",
        settings: "{}",
        isDefault: true
      }
    });
    const token = createJWT(user);
    console.log("[Auth] User registered:", user.email);
    trackServerEvent(req, "auth.register.success", { userId: user.id });
    return new Response(
      JSON.stringify(appendApiMessage(req, "api.auth.registerOk", { success: true, user })),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": buildAuthSetCookie(token)
        }
      }
    );
  } catch (error) {
    console.error("[Auth] Registration error:", error);
    return authJsonError(req, "api.auth.registerFailed", 500);
  }
}
var init_register = __esm({
  "lib/api/handlers/auth/register.ts"() {
    "use strict";
    init_prisma();
    init_jwt();
    init_rateLimit();
    init_rateLimitKv();
    init_rateLimitResponse();
    init_authCookie();
    init_logger();
    init_localizedError();
  }
});

// lib/api/handlers/auth/forgot-password.ts
var forgot_password_exports = {};
__export(forgot_password_exports, {
  POST: () => POST2
});
async function POST2(req) {
  try {
    const rate = await checkRateLimitDistributed(req, resolveRateLimitOptions("auth:forgot"));
    if (!rate.allowed) return rateLimitErrorResponse(req, rate);
    const { email } = await req.json();
    if (!email) {
      return authJsonError(req, "api.auth.emailRequired", 400);
    }
    console.log("Forgot password for:", email);
    return new Response(
      JSON.stringify(
        appendApiMessage(req, "api.auth.forgotDemoMessage", { success: true, demo: true })
      ),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return authJsonError(req, "api.auth.sendFailed", 500);
  }
}
var init_forgot_password = __esm({
  "lib/api/handlers/auth/forgot-password.ts"() {
    "use strict";
    init_rateLimit();
    init_rateLimitKv();
    init_rateLimitResponse();
    init_localizedError();
  }
});

// lib/api/handlers/auth/callback/credentials.ts
var credentials_exports = {};
__export(credentials_exports, {
  POST: () => POST3
});
import bcrypt2 from "bcryptjs";
async function POST3(req) {
  try {
    const rate = await checkRateLimitDistributed(req, resolveRateLimitOptions("auth:login"));
    if (!rate.allowed) return rateLimitErrorResponse(req, rate);
    const { email, password } = await req.json();
    if (!email || !password) {
      return authJsonError(req, "api.auth.required", 400);
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (!user || !user.password) {
      return authJsonError(req, "api.auth.invalidCredentials", 401);
    }
    const isValid = await bcrypt2.compare(password, user.password);
    if (!isValid) {
      return authJsonError(req, "api.auth.invalidCredentials", 401);
    }
    const token = createJWT({
      id: user.id,
      email: user.email,
      name: user.name
    });
    console.log("[Auth] User logged in:", user.email);
    trackServerEvent(req, "auth.login.success", { userId: user.id });
    return new Response(
      JSON.stringify(
        appendApiMessage(req, "api.auth.loginOk", {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          }
        })
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": buildAuthSetCookie(token)
        }
      }
    );
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return authJsonError(req, "api.auth.loginFailed", 500);
  }
}
var init_credentials = __esm({
  "lib/api/handlers/auth/callback/credentials.ts"() {
    "use strict";
    init_prisma();
    init_jwt();
    init_rateLimit();
    init_rateLimitKv();
    init_rateLimitResponse();
    init_authCookie();
    init_logger();
    init_localizedError();
  }
});

// lib/api/handlers/auth/signout.ts
var signout_exports = {};
__export(signout_exports, {
  GET: () => GET3,
  POST: () => POST4
});
function signoutResponse(req) {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const cookie of buildAllAuthClearCookies()) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(
    JSON.stringify(appendApiMessage(req, "api.auth.signoutOk", { success: true })),
    { status: 200, headers }
  );
}
async function POST4(req) {
  return signoutResponse(req);
}
async function GET3(req) {
  return signoutResponse(req);
}
var init_signout = __esm({
  "lib/api/handlers/auth/signout.ts"() {
    "use strict";
    init_authCookie();
    init_localizedError();
  }
});

// lib/auth/oauthConfig.ts
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
function buildOAuthProviders() {
  const providers = [];
  const githubId = process.env.AUTH_GITHUB_ID?.trim();
  const githubSecret = process.env.AUTH_GITHUB_SECRET?.trim();
  if (githubId && githubSecret) {
    providers.push(
      GitHub({
        clientId: githubId,
        clientSecret: githubSecret
      })
    );
  }
  const googleId = process.env.AUTH_GOOGLE_ID?.trim();
  const googleSecret = process.env.AUTH_GOOGLE_SECRET?.trim();
  if (googleId && googleSecret) {
    providers.push(
      Google({
        clientId: googleId,
        clientSecret: googleSecret
      })
    );
  }
  return providers;
}
function isGitHubOAuthConfigured() {
  return Boolean(process.env.AUTH_GITHUB_ID?.trim() && process.env.AUTH_GITHUB_SECRET?.trim());
}
function isGoogleOAuthConfigured() {
  return Boolean(process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim());
}
function isAnyOAuthConfigured() {
  return isGitHubOAuthConfigured() || isGoogleOAuthConfigured();
}
function getOAuthConfig() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is required for OAuth");
  }
  const providers = buildOAuthProviders();
  if (providers.length === 0) {
    throw new Error("No OAuth providers configured (AUTH_GITHUB_* / AUTH_GOOGLE_*)");
  }
  return {
    adapter: PrismaAdapter(prisma),
    basePath: OAUTH_BASE_PATH,
    secret,
    trustHost: true,
    providers,
    session: {
      strategy: "jwt",
      maxAge: 7 * 24 * 60 * 60
    },
    pages: {
      signIn: "/",
      error: "/"
    },
    callbacks: {
      async redirect({ url, baseUrl }) {
        if (url.startsWith(baseUrl)) return url;
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        return `${baseUrl}/?oauth_sync=1`;
      },
      async jwt({ token, user }) {
        if (user?.id) token.id = user.id;
        return token;
      },
      async session({ session, token }) {
        if (session.user && token?.id) {
          ;
          session.user.id = token.id;
        }
        return session;
      }
    },
    events: {
      async signIn({ user, isNewUser }) {
        const userId = user.id;
        if (!userId) return;
        if (isNewUser) {
          const existing = await prisma.userWorkspace.findFirst({
            where: { userId, name: "default" }
          });
          if (!existing) {
            await prisma.userWorkspace.create({
              data: {
                userId,
                name: "default",
                files: "[]",
                settings: "{}",
                isDefault: true
              }
            });
          }
        }
      }
    }
  };
}
var OAUTH_BASE_PATH;
var init_oauthConfig = __esm({
  "lib/auth/oauthConfig.ts"() {
    "use strict";
    init_prisma();
    OAUTH_BASE_PATH = "/api/auth/oauth";
  }
});

// lib/api/handlers/auth/oauth/providers.ts
var providers_exports = {};
__export(providers_exports, {
  GET: () => GET4
});
async function GET4() {
  const github = isGitHubOAuthConfigured();
  const google = isGoogleOAuthConfigured();
  return jsonResponse({
    github,
    google,
    any: github || google
  });
}
var init_providers = __esm({
  "lib/api/handlers/auth/oauth/providers.ts"() {
    "use strict";
    init_http();
    init_oauthConfig();
  }
});

// lib/api/handlers/auth/oauth/sync.ts
var sync_exports = {};
__export(sync_exports, {
  POST: () => POST5
});
import { Auth } from "@auth/core";
async function POST5(request) {
  if (!isAnyOAuthConfigured()) {
    return localizedErrorResponse(request, "api.auth.oauthNotConfigured", 501);
  }
  try {
    const origin = new URL(request.url).origin;
    const sessionRequest = new Request(`${origin}${OAUTH_BASE_PATH}/session`, {
      method: "GET",
      headers: request.headers
    });
    const sessionResponse = await Auth(sessionRequest, getOAuthConfig());
    const sessionBody = await sessionResponse.json().catch(() => null);
    const email = sessionBody?.user?.email?.trim().toLowerCase();
    if (!email) {
      return localizedErrorResponse(request, "api.auth.oauthSessionInvalid", 401);
    }
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, image: true }
    });
    if (!user && sessionBody?.user?.id) {
      user = await prisma.user.findUnique({
        where: { id: sessionBody.user.id },
        select: { id: true, email: true, name: true, image: true }
      });
    }
    if (!user) {
      return localizedErrorResponse(request, "api.auth.oauthUserNotFound", 401);
    }
    const token = createJWT(user);
    return localizedSuccessResponse(
      request,
      "api.auth.oauthSyncOk",
      { success: true, user },
      200,
      void 0,
      { "Set-Cookie": buildAuthSetCookie(token) }
    );
  } catch (error) {
    console.error("[OAuth sync] error:", error);
    return localizedErrorResponse(request, "api.auth.oauthSyncFailed", 500);
  }
}
var init_sync = __esm({
  "lib/api/handlers/auth/oauth/sync.ts"() {
    "use strict";
    init_localizedError();
    init_authCookie();
    init_oauthConfig();
    init_jwt();
    init_prisma();
  }
});

// lib/auth/handleOAuthRequest.ts
import { Auth as Auth2 } from "@auth/core";
async function handleOAuthRequest(request) {
  if (!isAnyOAuthConfigured()) {
    return authJsonError(request, "api.auth.oauthNotConfigured", 501);
  }
  try {
    return await Auth2(request, getOAuthConfig());
  } catch (error) {
    console.error("[OAuth] handler error:", error);
    return authJsonError(request, "api.auth.oauthHandlerFailed", 500);
  }
}
var init_handleOAuthRequest = __esm({
  "lib/auth/handleOAuthRequest.ts"() {
    "use strict";
    init_localizedError();
    init_oauthConfig();
  }
});

// lib/api/handlers/auth/oauth/catchAll.ts
var catchAll_exports = {};
__export(catchAll_exports, {
  GET: () => GET5,
  POST: () => POST6
});
async function GET5(request) {
  return handleOAuthRequest(request);
}
async function POST6(request) {
  return handleOAuthRequest(request);
}
var init_catchAll = __esm({
  "lib/api/handlers/auth/oauth/catchAll.ts"() {
    "use strict";
    init_handleOAuthRequest();
  }
});

// lib/api/requireAuth.ts
async function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return { ok: false, response: localizedErrorResponse(req, "api.auth.unauthorized", 401) };
  }
  const payload = verifyJWT(token);
  if (!payload?.userId) {
    return { ok: false, response: localizedErrorResponse(req, "api.auth.sessionExpired", 401) };
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, image: true }
  });
  if (!user) {
    return { ok: false, response: localizedErrorResponse(req, "api.auth.userNotFound", 401) };
  }
  return { ok: true, user };
}
async function optionalAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyJWT(token);
  if (!payload?.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, image: true }
  });
  return user;
}
var init_requireAuth = __esm({
  "lib/api/requireAuth.ts"() {
    "use strict";
    init_jwt();
    init_prisma();
    init_localizedError();
  }
});

// lib/api/body.ts
async function readRequestBodyWithLimit(req, maxBytes) {
  const lenHeader = req.headers.get("content-length");
  if (lenHeader) {
    const parsed = Number(lenHeader);
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      return null;
    }
  }
  const buf = new Uint8Array(await req.arrayBuffer());
  if (buf.byteLength > maxBytes) {
    return null;
  }
  return buf;
}
async function readJsonWithLimit(req, maxBytes) {
  const buf = await readRequestBodyWithLimit(req, maxBytes);
  if (!buf) {
    return { ok: false, response: localizedErrorResponse(req, "api.body.tooLarge", 413) };
  }
  try {
    const text = new TextDecoder().decode(buf);
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, response: localizedErrorResponse(req, "api.body.invalidJson", 400) };
  }
}
var init_body = __esm({
  "lib/api/body.ts"() {
    "use strict";
    init_localizedError();
  }
});

// lib/api/workspacePayload.ts
function validateWorkspacePayload(files, settings) {
  const filesStr = typeof files === "string" ? files : null;
  const settingsStr = typeof settings === "string" ? settings : null;
  if (filesStr && filesStr.length > MAX_WORKSPACE_BODY_BYTES) {
    return { key: "api.workspace.filesFieldTooLarge" };
  }
  if (settingsStr && settingsStr.length > MAX_WORKSPACE_BODY_BYTES) {
    return { key: "api.workspace.settingsFieldTooLarge" };
  }
  if (!filesStr && Array.isArray(files)) {
    if (files.length > MAX_WORKSPACE_FILES) {
      return { key: "api.workspace.fileCountExceeded", params: { max: MAX_WORKSPACE_FILES } };
    }
    for (const item of files) {
      if (!item || typeof item !== "object") return { key: "api.workspace.filesInvalid" };
      const name = item.name;
      const content = item.content;
      if (typeof name !== "string" || !name.trim() || name.length > MAX_FILE_NAME_LEN) {
        return { key: "api.workspace.fileNameInvalid" };
      }
      if (typeof content !== "string" || content.length > MAX_FILE_CONTENT_LEN) {
        return { key: "api.workspace.fileContentTooLarge" };
      }
    }
  }
  if (!settingsStr && settings != null && typeof settings !== "object") {
    return { key: "api.workspace.settingsInvalid" };
  }
  return null;
}
var MAX_WORKSPACE_BODY_BYTES, MAX_WORKSPACE_FILES, MAX_FILE_NAME_LEN, MAX_FILE_CONTENT_LEN;
var init_workspacePayload = __esm({
  "lib/api/workspacePayload.ts"() {
    "use strict";
    MAX_WORKSPACE_BODY_BYTES = 2e6;
    MAX_WORKSPACE_FILES = 200;
    MAX_FILE_NAME_LEN = 200;
    MAX_FILE_CONTENT_LEN = 2e5;
  }
});

// src/lib/prismaTransactions.ts
function prismaSupportsTransactions() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url) return true;
  return !shouldUseNeonAdapter(url);
}
var init_prismaTransactions = __esm({
  "src/lib/prismaTransactions.ts"() {
    "use strict";
    init_dbUrl();
  }
});

// lib/billing/prismaUpsert.ts
async function prismaUpsert(args) {
  if (prismaSupportsTransactions()) {
    return args.delegate.upsert({
      where: args.where,
      create: args.create,
      update: args.update,
      include: args.include
    });
  }
  const existing = await args.delegate.findUnique({ where: args.where });
  if (existing) {
    return args.delegate.update({
      where: args.where,
      data: args.update,
      include: args.include
    });
  }
  try {
    return await args.delegate.create({
      data: args.create,
      include: args.include
    });
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return args.delegate.update({
        where: args.where,
        data: args.update,
        include: args.include
      });
    }
    throw error;
  }
}
function isPrismaUniqueViolation(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
var init_prismaUpsert = __esm({
  "lib/billing/prismaUpsert.ts"() {
    "use strict";
    init_prismaTransactions();
    init_prisma();
  }
});

// lib/api/workspacesService.ts
function serializeWorkspace(workspace) {
  return {
    id: workspace.name,
    dbId: workspace.id,
    name: workspace.name,
    files: workspace.files,
    settings: workspace.settings ?? "{}",
    isDefault: workspace.isDefault,
    updatedAt: workspace.updatedAt.toISOString()
  };
}
async function countUserWorkspaces(userId) {
  return prisma.userWorkspace.count({ where: { userId } });
}
async function listUserWorkspaces(userId) {
  const rows = await prisma.userWorkspace.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
  });
  return rows.map((row) => ({
    id: row.name,
    dbId: row.id,
    name: row.name,
    isDefault: row.isDefault,
    updatedAt: row.updatedAt.toISOString()
  }));
}
async function getWorkspaceByName(userId, name) {
  return prisma.userWorkspace.findUnique({
    where: { userId_name: { userId, name } }
  });
}
async function ensureDefaultWorkspace(userId) {
  const existing = await getWorkspaceByName(userId, "default");
  if (existing) return existing;
  return prisma.userWorkspace.create({
    data: {
      userId,
      name: "default",
      files: "[]",
      settings: "{}",
      isDefault: true
    }
  });
}
async function upsertWorkspace(userId, name, files, settings) {
  const isDefault = name === "default";
  return prismaUpsert({
    delegate: prisma.userWorkspace,
    where: { userId_name: { userId, name } },
    create: {
      userId,
      name,
      files,
      settings: settings ?? "{}",
      isDefault
    },
    update: {
      files,
      settings: settings ?? "{}",
      isDefault
    }
  });
}
async function deleteWorkspaceByName(userId, name) {
  if (name === "default") {
    throw new Error("DEFAULT_WORKSPACE_PROTECTED");
  }
  await prisma.userWorkspace.delete({
    where: { userId_name: { userId, name } }
  });
}
var init_workspacesService = __esm({
  "lib/api/workspacesService.ts"() {
    "use strict";
    init_prismaUpsert();
    init_prisma();
  }
});

// lib/billing/usageDb.ts
function startOfUtcDay() {
  const now = /* @__PURE__ */ new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
function getAiDailyLimit(planName) {
  return findPlanByName(planName)?.limits.aiRequestsPerDay ?? 200;
}
async function resolveUserPlanNameTx(userId, db) {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    include: { plan: true }
  });
  return subscription?.plan.name ?? "free";
}
async function resolveUserPlanName(userId) {
  return resolveUserPlanNameTx(userId, prisma);
}
async function getAiUsageCountTodayTx(userId, db) {
  const since = startOfUtcDay();
  const aggregate = await db.usageRecord.aggregate({
    where: {
      userId,
      type: AI_USAGE_TYPE,
      createdAt: { gte: since }
    },
    _sum: { amount: true }
  });
  return aggregate._sum.amount ?? 0;
}
async function getAiUsageCountToday(userId) {
  return getAiUsageCountTodayTx(userId, prisma);
}
async function incrementAiUsage(userId, amount = 1) {
  await prisma.usageRecord.create({
    data: {
      userId,
      type: AI_USAGE_TYPE,
      amount
    }
  });
  return getAiUsageCountToday(userId);
}
async function consumeAiUsage(userId, amount = 1) {
  if (!prismaSupportsTransactions()) {
    return consumeAiUsageSequential(userId, amount);
  }
  return prisma.$transaction(async (tx) => {
    const plan = await resolveUserPlanNameTx(userId, tx);
    const used = await getAiUsageCountTodayTx(userId, tx);
    const limit = getAiDailyLimit(plan);
    if (limit !== -1 && used + amount > limit) {
      return { ok: false, quota: buildQuotaSnapshot(plan, used) };
    }
    await tx.usageRecord.create({
      data: {
        userId,
        type: AI_USAGE_TYPE,
        amount
      }
    });
    const newUsed = await getAiUsageCountTodayTx(userId, tx);
    return { ok: true, quota: buildQuotaSnapshot(plan, newUsed) };
  });
}
async function consumeAiUsageSequential(userId, amount) {
  const plan = await resolveUserPlanName(userId);
  const used = await getAiUsageCountToday(userId);
  const limit = getAiDailyLimit(plan);
  if (limit !== -1 && used + amount > limit) {
    return { ok: false, quota: buildQuotaSnapshot(plan, used) };
  }
  const newUsed = await incrementAiUsage(userId, amount);
  return { ok: true, quota: buildQuotaSnapshot(plan, newUsed) };
}
function buildQuotaSnapshot(planName, used) {
  const limit = getAiDailyLimit(planName);
  if (limit === -1) {
    return {
      allowed: true,
      used,
      limit,
      remaining: Number.POSITIVE_INFINITY,
      plan: planName
    };
  }
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    plan: planName
  };
}
var AI_USAGE_TYPE;
var init_usageDb = __esm({
  "lib/billing/usageDb.ts"() {
    "use strict";
    init_prisma();
    init_prismaTransactions();
    init_plans();
    AI_USAGE_TYPE = "ai_request";
  }
});

// lib/api/handlers/workspaces/index.ts
var workspaces_exports = {};
__export(workspaces_exports, {
  GET: () => GET6,
  POST: () => POST7
});
async function GET6(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    const workspaces = await listUserWorkspaces(auth.user.id);
    return jsonResponse({ workspaces });
  } catch (error) {
    console.error("[Workspaces] List error:", error);
    return localizedErrorResponse(req, "api.workspace.listFailed", 500);
  }
}
async function POST7(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    const rate = await checkRateLimitDistributed(req, {
      ...resolveRateLimitOptions("workspaces:write"),
      suffix: auth.user.id
    });
    if (!rate.allowed) return rateLimitErrorResponse(req, rate);
    const parsed = await readJsonWithLimit(
      req,
      MAX_WORKSPACE_BODY_BYTES2
    );
    if (!parsed.ok) return parsed.response;
    const { name, files, settings } = parsed.value;
    if (!name || typeof name !== "string") {
      return localizedErrorResponse(req, "api.workspace.nameRequired", 400);
    }
    const workspaceName = name.trim();
    if (!workspaceName) {
      return localizedErrorResponse(req, "api.workspace.nameInvalid", 400);
    }
    const payloadError = validateWorkspacePayload(files, settings);
    if (payloadError) {
      return localizedErrorResponse(req, payloadError.key, 413, payloadError.params);
    }
    const existing = await getWorkspaceByName(auth.user.id, workspaceName);
    if (!existing) {
      const planName = await resolveUserPlanName(auth.user.id);
      const workspaceLimit = getWorkspaceLimit(planName);
      if (workspaceLimit !== -1) {
        const used = await countUserWorkspaces(auth.user.id);
        if (used >= workspaceLimit) {
          return localizedErrorResponse(req, "api.workspace.limitReached", 429, {
            limit: workspaceLimit
          });
        }
      }
    }
    const workspace = await upsertWorkspace(
      auth.user.id,
      workspaceName,
      typeof files === "string" ? files : JSON.stringify(files ?? []),
      typeof settings === "string" ? settings : JSON.stringify(settings ?? {})
    );
    return jsonResponse(
      appendApiMessage(req, "api.workspace.created", {
        success: true,
        workspace: {
          id: workspace.name,
          name: workspace.name,
          isDefault: workspace.isDefault,
          updatedAt: workspace.updatedAt.toISOString()
        }
      })
    );
  } catch (error) {
    console.error("[Workspaces] Create error:", error);
    return localizedErrorResponse(req, "api.workspace.createFailed", 500);
  }
}
var MAX_WORKSPACE_BODY_BYTES2;
var init_workspaces = __esm({
  "lib/api/handlers/workspaces/index.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_body();
    init_localizedError();
    init_workspacePayload();
    init_workspacesService();
    init_plans();
    init_usageDb();
    init_rateLimit();
    init_rateLimitKv();
    init_rateLimitResponse();
    MAX_WORKSPACE_BODY_BYTES2 = 2e6;
  }
});

// lib/billing/stripeStatus.ts
function mapStripeSubscriptionStatus(stripeStatus) {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return stripeStatus;
  }
}
var init_stripeStatus = __esm({
  "lib/billing/stripeStatus.ts"() {
    "use strict";
  }
});

// lib/billing/subscriptionDb.ts
var subscriptionDb_exports = {};
__export(subscriptionDb_exports, {
  clearSubscriptionCancelFlag: () => clearSubscriptionCancelFlag,
  downgradeUserToFree: () => downgradeUserToFree,
  ensurePlansSeeded: () => ensurePlansSeeded,
  findSubscriptionByStripeId: () => findSubscriptionByStripeId,
  getUserSubscription: () => getUserSubscription,
  markSubscriptionPastDueByStripeSubscriptionId: () => markSubscriptionPastDueByStripeSubscriptionId,
  scheduleSubscriptionCancel: () => scheduleSubscriptionCancel,
  syncSubscriptionFromStripe: () => syncSubscriptionFromStripe,
  upsertUserSubscription: () => upsertUserSubscription
});
async function ensurePlansSeeded() {
  for (const plan of BILLING_PLANS) {
    const payload = {
      displayName: plan.displayName,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      features: JSON.stringify(plan.features),
      limits: JSON.stringify(plan.limits),
      isActive: true
    };
    await prismaUpsert({
      delegate: prisma.plan,
      where: { name: plan.name },
      create: { name: plan.name, ...payload },
      update: payload
    });
  }
}
async function upsertUserSubscription(userId, planName, stripeIds) {
  await ensurePlansSeeded();
  const plan = await prisma.plan.findUnique({ where: { name: planName } });
  if (!plan) {
    throw new Error(`\u672A\u77E5\u8BA1\u5212: ${planName}`);
  }
  const now = /* @__PURE__ */ new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);
  const payload = {
    planId: plan.id,
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    stripeCustomerId: stripeIds?.customerId,
    stripeSubscriptionId: stripeIds?.subscriptionId
  };
  return prismaUpsert({
    delegate: prisma.subscription,
    where: { userId },
    create: { userId, ...payload },
    update: payload,
    include: { plan: true }
  });
}
async function getUserSubscription(userId) {
  return prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true }
  });
}
async function reloadSubscriptionWithPlan(userId) {
  return prisma.subscription.findUniqueOrThrow({
    where: { userId },
    include: { plan: true }
  });
}
async function scheduleSubscriptionCancel(userId) {
  const record = await getUserSubscription(userId);
  if (!record || record.plan.name === "free") {
    throw new Error("\u5F53\u524D\u6CA1\u6709\u53EF\u53D6\u6D88\u7684\u4ED8\u8D39\u8BA2\u9605");
  }
  await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
      status: "active"
    }
  });
  return reloadSubscriptionWithPlan(userId);
}
async function downgradeUserToFree(userId) {
  await prisma.subscription.deleteMany({ where: { userId } });
}
async function clearSubscriptionCancelFlag(userId) {
  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: false }
  });
  return reloadSubscriptionWithPlan(userId);
}
async function findSubscriptionByStripeId(stripeSubscriptionId) {
  return prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
    include: { plan: true }
  });
}
async function syncSubscriptionFromStripe(stripeSub) {
  const userId = stripeSub.metadata?.userId;
  const planName = stripeSub.metadata?.planName;
  let record = userId ? await getUserSubscription(userId) : null;
  if (!record) {
    record = await findSubscriptionByStripeId(stripeSub.id);
  }
  if (!record) {
    if (userId && planName) {
      return upsertUserSubscription(userId, planName, {
        customerId: typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id,
        subscriptionId: stripeSub.id
      });
    }
    return null;
  }
  if (stripeSub.status === "canceled" || stripeSub.status === "incomplete_expired") {
    await downgradeUserToFree(record.userId);
    return null;
  }
  const targetPlanName = planName || record.plan.name;
  const plan = await prisma.plan.findUnique({ where: { name: targetPlanName } });
  if (!plan) {
    throw new Error(`\u672A\u77E5\u8BA1\u5212: ${targetPlanName}`);
  }
  await prisma.subscription.update({
    where: { userId: record.userId },
    data: {
      planId: plan.id,
      status: mapStripeSubscriptionStatus(stripeSub.status),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1e3),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1e3),
      stripeSubscriptionId: stripeSub.id,
      stripeCustomerId: typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id ?? record.stripeCustomerId
    }
  });
  return reloadSubscriptionWithPlan(record.userId);
}
async function markSubscriptionPastDueByStripeSubscriptionId(stripeSubscriptionId) {
  const record = await findSubscriptionByStripeId(stripeSubscriptionId);
  if (!record) return null;
  await prisma.subscription.update({
    where: { userId: record.userId },
    data: { status: "past_due" }
  });
  return reloadSubscriptionWithPlan(record.userId);
}
var init_subscriptionDb = __esm({
  "lib/billing/subscriptionDb.ts"() {
    "use strict";
    init_prisma();
    init_prismaUpsert();
    init_plans();
    init_stripeStatus();
  }
});

// lib/billing/subscriptionExpiry.ts
function periodEndWithGrace(periodEnd, graceDays = SUBSCRIPTION_GRACE_DAYS) {
  return new Date(periodEnd.getTime() + graceDays * MS_PER_DAY);
}
function shouldExpireSubscription(record, now = /* @__PURE__ */ new Date()) {
  if (record.plan.name === "free") return false;
  return periodEndWithGrace(record.currentPeriodEnd) <= now;
}
async function expireUserSubscriptionIfDue(userId) {
  const record = await getUserSubscription(userId);
  if (!record || !shouldExpireSubscription(record)) {
    return { expired: false };
  }
  await downgradeUserToFree(userId);
  return { expired: true };
}
async function processExpiredSubscriptions() {
  const now = /* @__PURE__ */ new Date();
  const graceCutoff = new Date(now.getTime() - SUBSCRIPTION_GRACE_DAYS * MS_PER_DAY);
  const candidates = await prisma.subscription.findMany({
    where: {
      currentPeriodEnd: { lt: graceCutoff },
      plan: { name: { not: "free" } }
    },
    include: { plan: true }
  });
  let expired = 0;
  for (const record of candidates) {
    if (!shouldExpireSubscription(record, now)) continue;
    await downgradeUserToFree(record.userId);
    expired += 1;
  }
  return { scanned: candidates.length, expired };
}
var SUBSCRIPTION_GRACE_DAYS, MS_PER_DAY;
var init_subscriptionExpiry = __esm({
  "lib/billing/subscriptionExpiry.ts"() {
    "use strict";
    init_prisma();
    init_subscriptionDb();
    SUBSCRIPTION_GRACE_DAYS = 3;
    MS_PER_DAY = 24 * 60 * 60 * 1e3;
  }
});

// lib/api/handlers/subscription/index.ts
var subscription_exports = {};
__export(subscription_exports, {
  GET: () => GET7
});
async function GET7(req) {
  try {
    const user = await optionalAuth(req);
    if (!user) {
      return jsonResponse({ subscription: freeSubscription });
    }
    const { expired } = await expireUserSubscriptionIfDue(user.id);
    if (expired) {
      return jsonResponse(
        appendApiMessage(req, "api.subscription.expired", {
          subscription: freeSubscription,
          notice: "expired"
        })
      );
    }
    const record = await prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true }
    });
    if (!record) {
      return jsonResponse({ subscription: freeSubscription });
    }
    return jsonResponse({
      subscription: {
        plan: record.plan.name,
        status: record.status,
        currentPeriodEnd: record.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: record.cancelAtPeriodEnd
      }
    });
  } catch (error) {
    console.error("[Subscription] Status error:", error);
    return jsonResponse({ subscription: freeSubscription });
  }
}
var freeSubscription;
var init_subscription = __esm({
  "lib/api/handlers/subscription/index.ts"() {
    "use strict";
    init_http();
    init_localizedError();
    init_requireAuth();
    init_subscriptionExpiry();
    init_prisma();
    freeSubscription = {
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    };
  }
});

// lib/api/handlers/subscription/plans.ts
var plans_exports = {};
__export(plans_exports, {
  GET: () => GET8
});
function parseJsonField(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
async function GET8() {
  try {
    await ensurePlansSeeded();
    const records = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" }
    });
    if (records.length > 0) {
      const plans = records.map((plan) => ({
        id: plan.name,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description ?? "",
        price: plan.price,
        currency: plan.currency,
        features: parseJsonField(plan.features, []),
        limits: parseJsonField(plan.limits, BILLING_PLANS[0].limits)
      }));
      return jsonResponse({ plans });
    }
  } catch (error) {
    console.warn("[Plans] DB unavailable, using static plans:", error);
  }
  return jsonResponse({ plans: BILLING_PLANS });
}
var init_plans2 = __esm({
  "lib/api/handlers/subscription/plans.ts"() {
    "use strict";
    init_http();
    init_plans();
    init_subscriptionDb();
    init_prisma();
  }
});

// lib/billing/checkout.ts
var BETA_BILLING_NOTE;
var init_checkout = __esm({
  "lib/billing/checkout.ts"() {
    "use strict";
    BETA_BILLING_NOTE = "\u5F53\u524D\u4E3A\u516C\u6D4B\u671F\uFF0C\u4E13\u4E1A\u7248\u4E0E\u56E2\u961F\u7248\u529F\u80FD\u514D\u8D39\u5F00\u653E\uFF1B\u6B63\u5F0F\u6536\u6B3E\u63A5\u5165\u540E\u5C06\u5728\u6B64\u5F00\u542F\u5347\u7EA7\u3002";
  }
});

// lib/billing/billingPath.ts
function resolveBillingPath(capabilities) {
  if (capabilities.alipay || capabilities.wechat || capabilities.stripe) return "B";
  if (capabilities.devMock) return "dev";
  return "A";
}
function pricingNoteForPath(path, capabilities) {
  if (path === "B") {
    const parts = [];
    if (capabilities.alipay) parts.push("\u652F\u4ED8\u5B9D");
    if (capabilities.wechat) parts.push("\u5FAE\u4FE1");
    if (capabilities.stripe) parts.push("Stripe");
    return `\u652F\u6301${parts.join("\u3001")}\uFF1B\u4E13\u4E1A\u7248 \xA519/\u6708\uFF0C\u56E2\u961F\u7248 \xA549/\u6708`;
  }
  if (path === "dev") {
    return "\u5F00\u53D1/\u96C6\u6210\u73AF\u5883\uFF1A\u53EF\u4E00\u952E\u6A21\u62DF\u5347\u7EA7\uFF08\u672A\u914D\u7F6E\u5546\u6237\u65F6\uFF09";
  }
  return BETA_BILLING_NOTE;
}
var init_billingPath = __esm({
  "lib/billing/billingPath.ts"() {
    "use strict";
    init_checkout();
  }
});

// lib/api/handlers/subscription/payment-methods.ts
var payment_methods_exports = {};
__export(payment_methods_exports, {
  GET: () => GET9
});
async function GET9() {
  const capabilities = getBillingCapabilities();
  const billingPath = resolveBillingPath(capabilities);
  const plans = BILLING_PLANS.map((plan) => ({
    name: plan.name,
    displayName: plan.displayName,
    price: plan.price,
    currency: plan.currency,
    priceLabel: formatPlanPrice(plan),
    limits: plan.limits
  }));
  const cnReady = capabilities.alipay || capabilities.wechat;
  return jsonResponse({
    ...capabilities,
    cnReady,
    billingPath,
    pricingNote: pricingNoteForPath(billingPath, capabilities),
    plans
  });
}
var init_payment_methods = __esm({
  "lib/api/handlers/subscription/payment-methods.ts"() {
    "use strict";
    init_http();
    init_billingMode();
    init_billingPath();
    init_plans();
  }
});

// lib/billing/fulfillOrder.ts
async function fulfillPaymentOrder(outTradeNo, tradeNo) {
  const order = await getPaymentOrderByOutTradeNo(outTradeNo);
  if (!order) {
    throw new Error(`\u8BA2\u5355\u4E0D\u5B58\u5728: ${outTradeNo}`);
  }
  if (order.status === "paid") {
    const subscription2 = await upsertUserSubscription(order.userId, order.planName);
    return {
      order: { outTradeNo: order.outTradeNo, status: "paid", planName: order.planName, userId: order.userId },
      subscription: subscription2,
      alreadyPaid: true
    };
  }
  if (order.status !== "pending") {
    throw new Error(`\u8BA2\u5355\u72B6\u6001\u4E0D\u53EF\u652F\u4ED8: ${order.status}`);
  }
  const marked = await markPaymentOrderPaid(outTradeNo, tradeNo);
  if (!marked) {
    const latest = await getPaymentOrderByOutTradeNo(outTradeNo);
    if (latest?.status === "paid") {
      const subscription2 = await upsertUserSubscription(latest.userId, latest.planName);
      return {
        order: {
          outTradeNo: latest.outTradeNo,
          status: "paid",
          planName: latest.planName,
          userId: latest.userId
        },
        subscription: subscription2,
        alreadyPaid: true
      };
    }
    throw new Error(`\u8BA2\u5355\u65E0\u6CD5\u6807\u8BB0\u4E3A\u5DF2\u652F\u4ED8: ${outTradeNo}`);
  }
  const subscription = await upsertUserSubscription(order.userId, order.planName);
  return {
    order: { outTradeNo: order.outTradeNo, status: "paid", planName: order.planName, userId: order.userId },
    subscription,
    alreadyPaid: false
  };
}
var init_fulfillOrder = __esm({
  "lib/billing/fulfillOrder.ts"() {
    "use strict";
    init_subscriptionDb();
    init_paymentOrders();
  }
});

// lib/api/handlers/payment/alipay/notify.ts
var notify_exports = {};
__export(notify_exports, {
  POST: () => POST8
});
function parseFormBody(text) {
  const params = {};
  for (const part of text.split("&")) {
    const [rawKey, rawVal = ""] = part.split("=");
    if (!rawKey) continue;
    params[decodeURIComponent(rawKey)] = decodeURIComponent(rawVal.replace(/\+/g, " "));
  }
  return params;
}
async function POST8(request) {
  if (!isAlipayConfigured()) {
    return new Response("fail", { status: 501 });
  }
  try {
    const text = await request.text();
    const params = parseFormBody(text);
    if (!verifyAlipayNotify(params)) {
      console.error("[Alipay notify] invalid signature");
      return new Response("fail", { status: 400 });
    }
    const tradeStatus = params.trade_status;
    const outTradeNo = params.out_trade_no;
    if (!outTradeNo) return new Response("fail", { status: 400 });
    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      const result = await fulfillPaymentOrder(outTradeNo, params.trade_no);
      if (result.alreadyPaid) {
        console.log("[Alipay notify] duplicate notify (already paid):", outTradeNo);
      }
    }
    return new Response("success", { status: 200, headers: { "Content-Type": "text/plain" } });
  } catch (error) {
    console.error("[Alipay notify] error:", error);
    return new Response("fail", { status: 500 });
  }
}
var init_notify = __esm({
  "lib/api/handlers/payment/alipay/notify.ts"() {
    "use strict";
    init_fulfillOrder();
    init_alipayPay();
    init_cnPayment();
  }
});

// lib/billing/alipayReconcile.ts
function formatSubscription(record) {
  if (!record) {
    return {
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    };
  }
  return {
    plan: record.plan.name,
    status: record.status,
    currentPeriodEnd: record.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: record.cancelAtPeriodEnd
  };
}
function isPaidTradeStatus(status) {
  return status === "TRADE_SUCCESS" || status === "TRADE_FINISHED";
}
function resolveReturnParams(payload) {
  if (payload.returnQuery?.trim()) {
    return parseAlipayReturnQuery(payload.returnQuery.trim());
  }
  const { returnQuery: _rq, ...rest } = payload;
  return rest;
}
async function reconcileAlipayReturn(userId, payload) {
  const returnParams = resolveReturnParams(payload);
  if (!verifyAlipaySign(returnParams)) {
    throw new Error("\u652F\u4ED8\u5B9D\u56DE\u8DF3\u9A8C\u7B7E\u5931\u8D25\uFF08\u8BF7\u7528\u6D4F\u89C8\u5668\u5B8C\u6574\u56DE\u8DF3 URL \u5237\u65B0\uFF0C\u52FF\u624B\u5199 fetch\uFF09");
  }
  const outTradeNo = returnParams.out_trade_no?.trim();
  if (!outTradeNo) {
    throw new Error("\u7F3A\u5C11 out_trade_no");
  }
  const order = await getPaymentOrderByOutTradeNo(outTradeNo);
  if (!order || order.userId !== userId) {
    throw new Error("\u8BA2\u5355\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
  }
  if (order.status === "paid") {
    const record = await getUserSubscription(userId);
    return {
      fulfilled: false,
      alreadyPaid: true,
      tradeStatus: "TRADE_SUCCESS",
      subscription: formatSubscription(record)
    };
  }
  const { tradeStatus, tradeNo } = await queryAlipayTrade(outTradeNo);
  if (!isPaidTradeStatus(tradeStatus)) {
    const record = await getUserSubscription(userId);
    return {
      fulfilled: false,
      alreadyPaid: false,
      tradeStatus,
      subscription: formatSubscription(record)
    };
  }
  const result = await fulfillPaymentOrder(outTradeNo, tradeNo ?? returnParams.trade_no);
  return {
    fulfilled: !result.alreadyPaid,
    alreadyPaid: result.alreadyPaid,
    tradeStatus,
    subscription: formatSubscription(result.subscription)
  };
}
var init_alipayReconcile = __esm({
  "lib/billing/alipayReconcile.ts"() {
    "use strict";
    init_fulfillOrder();
    init_paymentOrders();
    init_subscriptionDb();
    init_alipayPay();
  }
});

// lib/api/handlers/payment/alipay/return.ts
var return_exports = {};
__export(return_exports, {
  POST: () => POST9
});
async function POST9(request) {
  if (!isAlipayConfigured()) {
    return localizedErrorResponse(request, "api.checkout.alipayNotConfigured", 503);
  }
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const result = await reconcileAlipayReturn(auth.user.id, body);
    const parsed = body.returnQuery?.trim() ? parseAlipayReturnQuery(body.returnQuery) : body;
    trackServerEvent(request, "billing.alipay.return", {
      userId: auth.user.id,
      outTradeNo: parsed.out_trade_no,
      fulfilled: result.fulfilled,
      alreadyPaid: result.alreadyPaid,
      tradeStatus: result.tradeStatus,
      plan: result.subscription.plan
    });
    return jsonResponse({
      ...result,
      messageKey: result.subscription.plan !== "free" ? "api.payment.return.upgraded" : result.fulfilled ? "api.payment.return.pending" : "api.payment.return.notPaid"
    });
  } catch (error) {
    console.error("[Alipay return] error:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: detail, errorKey: "api.payment.return.failed" }, 400);
  }
}
var init_return = __esm({
  "lib/api/handlers/payment/alipay/return.ts"() {
    "use strict";
    init_http();
    init_localizedError();
    init_requireAuth();
    init_cnPayment();
    init_alipayPay();
    init_alipayReconcile();
    init_logger();
  }
});

// lib/api/handlers/payment/wechat/notify.ts
var notify_exports2 = {};
__export(notify_exports2, {
  POST: () => POST10
});
async function POST10(request) {
  if (!isWechatPayConfigured()) {
    return new Response(JSON.stringify({ code: "FAIL", message: "not configured" }), { status: 501 });
  }
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    const pay = getWxPayVerifier();
    const verified = await pay.verifySign({
      body,
      signature: headers["wechatpay-signature"] || headers["Wechatpay-Signature"] || "",
      serial: headers["wechatpay-serial"] || headers["Wechatpay-Serial"] || "",
      nonce: headers["wechatpay-nonce"] || headers["Wechatpay-Nonce"] || "",
      timestamp: headers["wechatpay-timestamp"] || headers["Wechatpay-Timestamp"] || ""
    });
    if (!verified) {
      console.error("[Wechat notify] verify failed");
      return new Response(JSON.stringify({ code: "FAIL", message: "sign" }), { status: 400 });
    }
    const payload = JSON.parse(body);
    const resource = payload.resource;
    if (!resource?.ciphertext || !resource.nonce) {
      return new Response(JSON.stringify({ code: "FAIL", message: "resource" }), { status: 400 });
    }
    const decrypted = pay.decipher_gcm(
      resource.ciphertext,
      resource.associated_data || "",
      resource.nonce,
      process.env.WECHAT_API_V3_KEY
    );
    const data = JSON.parse(typeof decrypted === "string" ? decrypted : JSON.stringify(decrypted));
    if (data.trade_state === "SUCCESS" && data.out_trade_no) {
      const result = await fulfillPaymentOrder(data.out_trade_no, data.transaction_id);
      if (result.alreadyPaid) {
        console.log("[Wechat notify] duplicate notify (already paid):", data.out_trade_no);
      }
    }
    return new Response(JSON.stringify({ code: "SUCCESS", message: "\u6210\u529F" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[Wechat notify] error:", error);
    return new Response(JSON.stringify({ code: "FAIL", message: "error" }), { status: 500 });
  }
}
var init_notify2 = __esm({
  "lib/api/handlers/payment/wechat/notify.ts"() {
    "use strict";
    init_fulfillOrder();
    init_cnPayment();
    init_wechatPay();
  }
});

// lib/api/handlers/payment/orders/byId.ts
var byId_exports = {};
__export(byId_exports, {
  GET: () => GET10
});
async function GET10(request, ctx) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const id = ctx?.params?.id;
  if (!id) return localizedErrorResponse(request, "api.payment.orderIdRequired", 400);
  const order = await getPaymentOrderById(id);
  if (!order || order.userId !== auth.user.id) {
    return localizedErrorResponse(request, "api.payment.orderNotFound", 404);
  }
  return jsonResponse({
    order: {
      id: order.id,
      status: order.status,
      planName: order.planName,
      channel: order.channel,
      outTradeNo: order.outTradeNo,
      paidAt: order.paidAt?.toISOString() ?? null
    }
  });
}
var init_byId = __esm({
  "lib/api/handlers/payment/orders/byId.ts"() {
    "use strict";
    init_http();
    init_localizedError();
    init_requireAuth();
    init_paymentOrders();
  }
});

// lib/api/handlers/payment/dev/simulate.ts
var simulate_exports = {};
__export(simulate_exports, {
  POST: () => POST11
});
async function POST11(request) {
  if (!isDevPaymentSimulateAllowed()) {
    return localizedErrorResponse(request, "api.payment.devOnly", 403);
  }
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const planId = body.planId?.trim() || "pro";
    const channel = body.channel === "wechat" ? "wechat" : "alipay";
    if (!getBillablePlanNames().includes(planId)) {
      return localizedErrorResponse(request, "api.checkout.invalidPlan", 400);
    }
    const plan = findPlanByName(planId);
    if (!plan) return localizedErrorResponse(request, "api.checkout.invalidPlan", 400);
    const amountCents = getPlanAmountCents(planId);
    if (amountCents <= 0) return localizedErrorResponse(request, "api.checkout.noPaymentNeeded", 400);
    const order = await createPaymentOrder({
      userId: auth.user.id,
      planName: plan.name,
      channel,
      amountCents
    });
    const { subscription, alreadyPaid } = await fulfillPaymentOrder(order.outTradeNo, "dev-simulate");
    return jsonResponse(
      appendApiMessage(request, "api.payment.simulateOk", {
        ok: true,
        simulated: true,
        alreadyPaid,
        orderId: order.id,
        outTradeNo: order.outTradeNo,
        plan: subscription.plan.name,
        subscription: {
          plan: subscription.plan.name,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
        }
      })
    );
  } catch (error) {
    console.error("[Payment dev simulate] error:", error);
    return localizedErrorResponse(request, "api.payment.simulateFailed", 500);
  }
}
var init_simulate = __esm({
  "lib/api/handlers/payment/dev/simulate.ts"() {
    "use strict";
    init_http();
    init_localizedError();
    init_requireAuth();
    init_billingMode();
    init_fulfillOrder();
    init_paymentOrders();
    init_plans();
  }
});

// lib/api/handlers/subscription/checkout.ts
var checkout_exports = {};
__export(checkout_exports, {
  POST: () => POST12
});
async function POST12(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const planId = body.planId?.trim();
    const channel = body.channel;
    if (!planId) {
      return localizedErrorResponse(request, "api.checkout.missingPlanId", 400);
    }
    if (planId === "free") {
      return localizedErrorResponse(request, "api.checkout.freeNoCheckout", 400);
    }
    if (!getBillablePlanNames().includes(planId)) {
      return localizedErrorResponse(request, "api.checkout.invalidPlan", 400);
    }
    const plan = findPlanByName(planId);
    if (!plan) {
      return localizedErrorResponse(request, "api.checkout.invalidPlan", 400);
    }
    if (channel === "alipay" || channel === "wechat") {
      if (channel === "alipay" && !isAlipayConfigured()) {
        return localizedErrorResponse(request, "api.checkout.alipayNotConfigured", 503);
      }
      if (channel === "wechat" && !isWechatPayConfigured()) {
        return localizedErrorResponse(request, "api.checkout.wechatNotConfigured", 503);
      }
      const amountCents = getPlanAmountCents(plan.name);
      if (amountCents <= 0) {
        return localizedErrorResponse(request, "api.checkout.noPaymentNeeded", 400);
      }
      const result = await createCnCheckout({
        req: request,
        userId: auth.user.id,
        planName: plan.name,
        channel
      });
      trackServerEvent(request, "billing.checkout.created", {
        userId: auth.user.id,
        plan: plan.name,
        channel,
        mode: "cn"
      });
      return jsonResponse(result);
    }
    if (isCnPaymentConfigured()) {
      return localizedErrorResponse(request, "api.checkout.channelRequired", 400);
    }
    if (isStripeConfigured()) {
      const existing = await getUserSubscription(auth.user.id);
      const url = await createStripeCheckoutSession({
        req: request,
        userId: auth.user.id,
        email: auth.user.email,
        planName: plan.name,
        stripeCustomerId: existing?.stripeCustomerId
      });
      trackServerEvent(request, "billing.checkout.created", {
        userId: auth.user.id,
        plan: plan.name,
        channel: "stripe",
        mode: "stripe"
      });
      return jsonResponse({ mode: "stripe", url });
    }
    if (!isDevBillingAllowed()) {
      return localizedErrorResponse(request, "api.checkout.notConfigured", 503);
    }
    const record = await upsertUserSubscription(auth.user.id, plan.name);
    return jsonResponse(
      appendApiMessage(
        request,
        "api.checkout.devUpgraded",
        {
          mode: "dev_mock",
          plan: record.plan.name,
          subscription: {
            plan: record.plan.name,
            status: record.status,
            currentPeriodEnd: record.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: record.cancelAtPeriodEnd
          }
        },
        { plan: record.plan.displayName }
      )
    );
  } catch (error) {
    console.error("[Checkout] error:", error);
    return localizedErrorResponse(request, "api.checkout.sessionFailed", 500);
  }
}
var init_checkout2 = __esm({
  "lib/api/handlers/subscription/checkout.ts"() {
    "use strict";
    init_http();
    init_localizedError();
    init_requireAuth();
    init_billingMode();
    init_cnPayment();
    init_plans();
    init_subscriptionDb();
    init_stripe();
    init_logger();
  }
});

// lib/api/handlers/subscription/webhook.ts
var webhook_exports = {};
__export(webhook_exports, {
  POST: () => POST13
});
async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata?.userId;
  if (userId) {
    await downgradeUserToFree(userId);
    return;
  }
  const { findSubscriptionByStripeId: findSubscriptionByStripeId2 } = await Promise.resolve().then(() => (init_subscriptionDb(), subscriptionDb_exports));
  const record = await findSubscriptionByStripeId2(subscription.id);
  if (record) await downgradeUserToFree(record.userId);
}
async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  const planName = session.metadata?.planName;
  if (!userId || !planName) {
    console.warn("[Stripe webhook] checkout.session.completed missing metadata");
    return;
  }
  await upsertUserSubscription(userId, planName, {
    customerId: typeof session.customer === "string" ? session.customer : void 0,
    subscriptionId: typeof session.subscription === "string" ? session.subscription : void 0
  });
}
async function handleSubscriptionUpdated(subscription) {
  await syncSubscriptionFromStripe(subscription);
}
async function handleInvoicePaymentFailed(invoice) {
  const subRef = invoice.subscription;
  const stripeSubscriptionId = typeof subRef === "string" ? subRef : subRef?.id;
  if (!stripeSubscriptionId) return;
  await markSubscriptionPastDueByStripeSubscriptionId(stripeSubscriptionId);
}
async function POST13(request) {
  if (!isStripeConfigured()) {
    return localizedErrorResponse(request, "api.subscription.stripeNotConfigured", 501);
  }
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  try {
    const event = constructStripeEvent(payload, signature);
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        break;
    }
    return jsonResponse({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] error:", error);
    return localizedErrorResponse(request, "api.subscription.webhookFailed", 400);
  }
}
var init_webhook = __esm({
  "lib/api/handlers/subscription/webhook.ts"() {
    "use strict";
    init_http();
    init_localizedError();
    init_subscriptionDb();
    init_stripe();
  }
});

// lib/api/handlers/subscription/cancel.ts
var cancel_exports = {};
__export(cancel_exports, {
  POST: () => POST14
});
async function POST14(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => ({}));
    const immediate = Boolean(body.immediate);
    const record = await getUserSubscription(auth.user.id);
    if (!record || record.plan.name === "free") {
      return localizedErrorResponse(request, "api.subscription.freeNoCancel", 400);
    }
    if (record.stripeSubscriptionId && isStripeConfigured()) {
      if (immediate) {
        await cancelStripeSubscriptionImmediately(record.stripeSubscriptionId);
        await downgradeUserToFree(auth.user.id);
      } else {
        await cancelStripeSubscriptionAtPeriodEnd(record.stripeSubscriptionId);
        await scheduleSubscriptionCancel(auth.user.id);
      }
    } else if (immediate) {
      await downgradeUserToFree(auth.user.id);
    } else {
      await scheduleSubscriptionCancel(auth.user.id);
    }
    const updated = await getUserSubscription(auth.user.id);
    if (!updated) {
      const key2 = immediate ? "api.subscription.cancelImmediate" : "api.subscription.cancelScheduled";
      return jsonResponse(
        appendApiMessage(request, key2, {
          subscription: {
            plan: "free",
            status: "active",
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false
          }
        })
      );
    }
    const key = immediate ? "api.subscription.cancelDoneNow" : "api.subscription.cancelEndOfPeriod";
    return jsonResponse(
      appendApiMessage(request, key, {
        subscription: {
          plan: updated.plan.name,
          status: updated.status,
          currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: updated.cancelAtPeriodEnd
        }
      })
    );
  } catch (error) {
    console.error("[Subscription cancel] error:", error);
    return localizedErrorResponse(request, "api.subscription.cancelFailed", 500);
  }
}
var init_cancel = __esm({
  "lib/api/handlers/subscription/cancel.ts"() {
    "use strict";
    init_http();
    init_localizedError();
    init_requireAuth();
    init_subscriptionDb();
    init_stripe();
  }
});

// lib/api/handlers/subscription/portal.ts
var portal_exports = {};
__export(portal_exports, {
  POST: () => POST15
});
async function POST15(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    if (!isStripeConfigured()) {
      return localizedErrorResponse(request, "api.subscription.portalNotConfigured", 503);
    }
    const record = await getUserSubscription(auth.user.id);
    if (!record?.stripeCustomerId) {
      return localizedErrorResponse(request, "api.subscription.noStripeCustomer", 400);
    }
    const url = await createStripeBillingPortalSession({
      req: request,
      customerId: record.stripeCustomerId
    });
    return jsonResponse({ mode: "stripe", url });
  } catch (error) {
    console.error("[Subscription portal] error:", error);
    return localizedErrorResponse(request, "api.subscription.portalFailed", 500);
  }
}
var init_portal = __esm({
  "lib/api/handlers/subscription/portal.ts"() {
    "use strict";
    init_http();
    init_localizedError();
    init_requireAuth();
    init_subscriptionDb();
    init_stripe();
  }
});

// lib/api/handlers/subscription/resume.ts
var resume_exports = {};
__export(resume_exports, {
  POST: () => POST16
});
async function POST16(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const record = await getUserSubscription(auth.user.id);
    if (!record || record.plan.name === "free") {
      return localizedErrorResponse(request, "api.subscription.noResume", 400);
    }
    if (!record.cancelAtPeriodEnd) {
      return jsonResponse(
        appendApiMessage(request, "api.subscription.resumeActive", {
          subscription: {
            plan: record.plan.name,
            status: record.status,
            currentPeriodEnd: record.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: false
          }
        })
      );
    }
    if (record.stripeSubscriptionId && isStripeConfigured()) {
      await resumeStripeSubscription(record.stripeSubscriptionId);
    }
    const updated = await clearSubscriptionCancelFlag(auth.user.id);
    return jsonResponse(
      appendApiMessage(request, "api.subscription.resumeOk", {
        subscription: {
          plan: updated.plan.name,
          status: updated.status,
          currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: updated.cancelAtPeriodEnd
        }
      })
    );
  } catch (error) {
    console.error("[Subscription resume] error:", error);
    return localizedErrorResponse(request, "api.subscription.resumeFailed", 500);
  }
}
var init_resume = __esm({
  "lib/api/handlers/subscription/resume.ts"() {
    "use strict";
    init_http();
    init_localizedError();
    init_requireAuth();
    init_subscriptionDb();
    init_stripe();
  }
});

// lib/api/cronAuth.ts
function getCronSecrets() {
  const values = [process.env.CRON_SECRET, process.env.BILLING_CRON_SECRET];
  const unique = /* @__PURE__ */ new Set();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) unique.add(trimmed);
  }
  return [...unique];
}
function isCronAuthorized(request) {
  const secrets = getCronSecrets();
  if (secrets.length === 0) return false;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return false;
  return secrets.includes(token);
}
var init_cronAuth = __esm({
  "lib/api/cronAuth.ts"() {
    "use strict";
  }
});

// lib/api/handlers/billing/expire-subscriptions.ts
var expire_subscriptions_exports = {};
__export(expire_subscriptions_exports, {
  GET: () => GET11,
  POST: () => POST17
});
async function runExpire(request) {
  if (!isCronAuthorized(request)) {
    return localizedErrorResponse(request, "api.auth.unauthorized", 401);
  }
  try {
    const result = await processExpiredSubscriptions();
    return jsonResponse(
      appendApiMessage(request, "api.billing.expireCronOk", {
        success: true,
        ...result
      })
    );
  } catch (error) {
    console.error("[Billing expire cron] error:", error);
    return localizedErrorResponse(request, "api.subscription.cancelFailed", 500);
  }
}
async function GET11(request) {
  return runExpire(request);
}
async function POST17(request) {
  return runExpire(request);
}
var init_expire_subscriptions = __esm({
  "lib/api/handlers/billing/expire-subscriptions.ts"() {
    "use strict";
    init_cronAuth();
    init_http();
    init_localizedError();
    init_subscriptionExpiry();
  }
});

// lib/api/handlers/usage/ai.ts
var ai_exports = {};
__export(ai_exports, {
  GET: () => GET12,
  POST: () => POST18
});
async function GET12(req) {
  try {
    const user = await optionalAuth(req);
    if (!user) {
      return jsonResponse({ source: "anonymous", quota: null });
    }
    const plan = await resolveUserPlanName(user.id);
    const used = await getAiUsageCountToday(user.id);
    return jsonResponse({
      source: "server",
      quota: buildQuotaSnapshot(plan, used)
    });
  } catch (error) {
    console.error("[Usage AI GET] error:", error);
    return localizedErrorResponse(req, "api.usage.readFailed", 500);
  }
}
async function POST18(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    const rate = await checkRateLimitDistributed(req, {
      ...resolveRateLimitOptions("usage:ai"),
      suffix: auth.user.id
    });
    if (!rate.allowed) return rateLimitErrorResponse(req, rate);
    const body = await req.json().catch(() => ({}));
    let amount = 1;
    if (process.env.NODE_ENV !== "production" && typeof body.amount === "number" && Number.isFinite(body.amount)) {
      amount = Math.min(Math.max(1, Math.floor(body.amount)), 500);
    }
    const result = await consumeAiUsage(auth.user.id, amount);
    if (!result.ok) {
      trackServerEvent(req, "usage.ai.quota_exceeded", {
        userId: auth.user.id,
        plan: result.quota.plan,
        used: result.quota.used,
        limit: result.quota.limit
      });
      const locale = resolveRequestLocale(req);
      return jsonResponse(
        {
          error: apiMessage("api.usage.quotaExceeded", locale),
          errorKey: "api.usage.quotaExceeded",
          source: "server",
          quota: result.quota
        },
        429
      );
    }
    return jsonResponse({
      source: "server",
      quota: result.quota
    });
  } catch (error) {
    console.error("[Usage AI POST] error:", error);
    return localizedErrorResponse(req, "api.usage.writeFailed", 500);
  }
}
var init_ai = __esm({
  "lib/api/handlers/usage/ai.ts"() {
    "use strict";
    init_apiMessages();
    init_resolveLocale();
    init_http();
    init_localizedError();
    init_rateLimit();
    init_rateLimitKv();
    init_rateLimitResponse();
    init_requireAuth();
    init_logger();
    init_usageDb();
  }
});

// lib/api/mcpProxy.ts
function isBlockedHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host === "metadata.google.internal" || host.endsWith(".internal")) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  const match172 = host.match(/^172\.(\d{1,2})\.\d{1,3}\.\d{1,3}$/);
  if (match172) {
    const second = Number(match172[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}
function validateMcpProxyUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid MCP URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("MCP URL must use http or https");
  }
  const allowLocal = process.env.NODE_ENV !== "production" || process.env.ALLOW_MCP_LOCALHOST === "true";
  if (!allowLocal && isBlockedHostname(parsed.hostname)) {
    throw new Error("MCP URL target is not allowed");
  }
  return parsed;
}
function sanitizeMcpProxyHeaders(headers) {
  if (!headers) return {};
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (BLOCKED_HEADER_NAMES.has(key.toLowerCase())) continue;
    if (typeof value === "string") out[key] = value;
  }
  return out;
}
var BLOCKED_HOSTS, BLOCKED_HEADER_NAMES;
var init_mcpProxy = __esm({
  "lib/api/mcpProxy.ts"() {
    "use strict";
    BLOCKED_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);
    BLOCKED_HEADER_NAMES = /* @__PURE__ */ new Set([
      "host",
      "authorization",
      "cookie",
      "x-forwarded-for",
      "x-forwarded-host",
      "x-api-key",
      "proxy-authorization"
    ]);
  }
});

// lib/api/handlers/mcp/proxy.ts
var proxy_exports = {};
__export(proxy_exports, {
  POST: () => POST19
});
async function POST19(request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }
  const url = body.url?.trim();
  const message = body.message;
  if (!url || !message?.method) {
    return errorResponse("url and message.method are required", 400);
  }
  try {
    validateMcpProxyUrl(url);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Invalid URL", 400);
  }
  const upstreamHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    "MCP-Protocol-Version": "2024-11-05",
    ...sanitizeMcpProxyHeaders(body.headers)
  };
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(3e4)
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      return errorResponse(text || `Upstream MCP error (${upstream.status})`, upstream.status);
    }
    try {
      return jsonResponse(JSON.parse(text));
    } catch {
      return jsonResponse({ raw: text });
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "MCP proxy failed";
    return errorResponse(messageText, 502);
  }
}
var init_proxy = __esm({
  "lib/api/handlers/mcp/proxy.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_mcpProxy();
  }
});

// lib/api/backgroundJobTypes.ts
function isJobRuntimeExpired(startedAt, nowMs = Date.now()) {
  if (!startedAt) return false;
  return nowMs - startedAt.getTime() > MAX_JOB_RUNTIME_MS;
}
function resolveBackgroundJobWorkerMode() {
  const raw = process.env.BACKGROUND_JOB_WORKER_MODE?.trim().toLowerCase();
  if (raw === "agent") return "agent";
  return "dummy";
}
function validateCreateBackgroundJobInput(input) {
  const prompt = input.prompt?.trim() ?? "";
  if (!prompt) return "api.job.promptRequired";
  if (prompt.length > MAX_JOB_PROMPT_CHARS) return "api.job.promptTooLong";
  const repoKey = input.repoKey?.trim();
  if (repoKey && repoKey.length > MAX_JOB_REPO_KEY_CHARS) return "api.job.repoKeyTooLong";
  return null;
}
function normalizeJobListLimit(raw) {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return DEFAULT_JOB_LIST_LIMIT;
  const n = Math.floor(raw);
  if (n < 1) return 1;
  if (n > MAX_JOB_LIST_LIMIT) return MAX_JOB_LIST_LIMIT;
  return n;
}
var MAX_JOB_PROMPT_CHARS, MAX_JOB_REPO_KEY_CHARS, DEFAULT_JOB_LIST_LIMIT, MAX_JOB_LIST_LIMIT, MAX_JOB_RUNTIME_MS, DEFAULT_JOBS_PER_CRON_TICK;
var init_backgroundJobTypes = __esm({
  "lib/api/backgroundJobTypes.ts"() {
    "use strict";
    MAX_JOB_PROMPT_CHARS = 1e5;
    MAX_JOB_REPO_KEY_CHARS = 256;
    DEFAULT_JOB_LIST_LIMIT = 50;
    MAX_JOB_LIST_LIMIT = 100;
    MAX_JOB_RUNTIME_MS = 30 * 60 * 1e3;
    DEFAULT_JOBS_PER_CRON_TICK = 1;
  }
});

// lib/api/backgroundJobsService.ts
function serializeBackgroundJob(job) {
  return {
    id: job.id,
    status: job.status,
    repoKey: job.repoKey,
    prompt: job.prompt,
    progress: job.progress ?? null,
    result: job.result ?? null,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    finishedAt: job.finishedAt?.toISOString() ?? null
  };
}
async function createBackgroundJob(userId, input) {
  const prompt = input.prompt.trim();
  const repoKey = input.repoKey?.trim() || null;
  return prisma.backgroundJob.create({
    data: {
      userId,
      status: "queued",
      prompt,
      repoKey
    }
  });
}
async function listBackgroundJobs(userId, limit) {
  return prisma.backgroundJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}
async function getBackgroundJobForUser(userId, jobId) {
  return prisma.backgroundJob.findFirst({
    where: { id: jobId, userId }
  });
}
async function cancelBackgroundJobForUser(userId, jobId) {
  const job = await getBackgroundJobForUser(userId, jobId);
  if (!job) return { kind: "not_found" };
  if (job.status !== "queued" && job.status !== "running") {
    return { kind: "not_cancellable", job };
  }
  const updated = await prisma.backgroundJob.update({
    where: { id: job.id },
    data: {
      status: "cancelled",
      finishedAt: /* @__PURE__ */ new Date()
    }
  });
  return { kind: "cancelled", job: updated };
}
async function getBackgroundJobById(jobId) {
  return prisma.backgroundJob.findUnique({ where: { id: jobId } });
}
async function claimNextQueuedBackgroundJob() {
  for (let attempt = 0; attempt < 3; attempt++) {
    const next = await prisma.backgroundJob.findFirst({
      where: { status: "queued" },
      orderBy: { createdAt: "asc" }
    });
    if (!next) return null;
    const claimed = await prisma.backgroundJob.updateMany({
      where: { id: next.id, status: "queued" },
      data: { status: "running", startedAt: /* @__PURE__ */ new Date() }
    });
    if (claimed.count === 1) {
      return prisma.backgroundJob.findUnique({ where: { id: next.id } });
    }
  }
  return null;
}
async function updateBackgroundJobProgress(jobId, progress) {
  return prisma.backgroundJob.update({
    where: { id: jobId },
    data: { progress }
  });
}
async function finishIfNotCancelled(jobId, data) {
  const current = await prisma.backgroundJob.findUnique({ where: { id: jobId } });
  if (!current || current.status === "cancelled") return null;
  return prisma.backgroundJob.update({
    where: { id: jobId },
    data
  });
}
async function completeBackgroundJobSucceeded(jobId, result) {
  return finishIfNotCancelled(jobId, {
    status: "succeeded",
    result,
    error: null,
    finishedAt: /* @__PURE__ */ new Date(),
    progress: {
      phase: "done",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
}
async function completeBackgroundJobFailed(jobId, error) {
  return finishIfNotCancelled(jobId, {
    status: "failed",
    error: error.slice(0, 4e3),
    finishedAt: /* @__PURE__ */ new Date(),
    progress: {
      phase: "failed",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
}
async function failStaleRunningBackgroundJobs(now = /* @__PURE__ */ new Date()) {
  const cutoff = new Date(now.getTime() - MAX_JOB_RUNTIME_MS);
  const stale = await prisma.backgroundJob.updateMany({
    where: {
      status: "running",
      startedAt: { lt: cutoff }
    },
    data: {
      status: "failed",
      error: "JOB_TIMEOUT",
      finishedAt: now
    }
  });
  return stale.count;
}
var init_backgroundJobsService = __esm({
  "lib/api/backgroundJobsService.ts"() {
    "use strict";
    init_prisma();
    init_backgroundJobTypes();
  }
});

// lib/api/backgroundJobEntitlement.ts
function startOfUtcDay2() {
  const now = /* @__PURE__ */ new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
function isPaidPlan(planName) {
  return planName === "pro" || planName === "enterprise";
}
async function countBackgroundJobsCreatedToday(userId) {
  const since = startOfUtcDay2();
  return prisma.backgroundJob.count({
    where: { userId, createdAt: { gte: since } }
  });
}
async function countActiveBackgroundJobs(userId) {
  return prisma.backgroundJob.count({
    where: { userId, status: { in: ["queued", "running"] } }
  });
}
function backgroundJobDailyLimit(planName) {
  return isPaidPlan(planName) ? PAID_BACKGROUND_JOBS_PER_DAY : FREE_BACKGROUND_JOBS_PER_DAY;
}
function backgroundJobMaxActive(planName) {
  return isPaidPlan(planName) ? PAID_BACKGROUND_JOBS_MAX_ACTIVE : FREE_BACKGROUND_JOBS_MAX_ACTIVE;
}
async function assertCanCreateBackgroundJob(userId, planName) {
  const dailyLimit = backgroundJobDailyLimit(planName);
  const maxActive = backgroundJobMaxActive(planName);
  const [createdToday, active] = await Promise.all([
    countBackgroundJobsCreatedToday(userId),
    countActiveBackgroundJobs(userId)
  ]);
  if (createdToday >= dailyLimit) {
    return {
      ok: false,
      error: {
        key: isPaidPlan(planName) ? "api.job.dailyLimit" : "api.job.dailyLimitUpgrade",
        params: { limit: dailyLimit, plan: planName }
      }
    };
  }
  if (active >= maxActive) {
    return {
      ok: false,
      error: {
        key: isPaidPlan(planName) ? "api.job.concurrentLimit" : "api.job.concurrentLimitUpgrade",
        params: { limit: maxActive }
      }
    };
  }
  return { ok: true };
}
var FREE_BACKGROUND_JOBS_PER_DAY, FREE_BACKGROUND_JOBS_MAX_ACTIVE, PAID_BACKGROUND_JOBS_PER_DAY, PAID_BACKGROUND_JOBS_MAX_ACTIVE;
var init_backgroundJobEntitlement = __esm({
  "lib/api/backgroundJobEntitlement.ts"() {
    "use strict";
    init_prisma();
    FREE_BACKGROUND_JOBS_PER_DAY = 2;
    FREE_BACKGROUND_JOBS_MAX_ACTIVE = 1;
    PAID_BACKGROUND_JOBS_PER_DAY = 100;
    PAID_BACKGROUND_JOBS_MAX_ACTIVE = 5;
  }
});

// lib/api/handlers/jobs/index.ts
var jobs_exports = {};
__export(jobs_exports, {
  GET: () => GET13,
  POST: () => POST20
});
async function GET13(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    const url = new URL(req.url);
    const limit = normalizeJobListLimit(
      url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : DEFAULT_JOB_LIST_LIMIT
    );
    const jobs = await listBackgroundJobs(auth.user.id, limit);
    return jsonResponse({ jobs: jobs.map(serializeBackgroundJob) });
  } catch (error) {
    console.error("[Jobs] List error:", error);
    return localizedErrorResponse(req, "api.job.listFailed", 500);
  }
}
async function POST20(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    const parsed = await readJsonWithLimit(
      req,
      MAX_JOB_BODY_BYTES
    );
    if (!parsed.ok) return parsed.response;
    const prompt = typeof parsed.value.prompt === "string" ? parsed.value.prompt : "";
    const repoKey = parsed.value.repoKey == null ? null : typeof parsed.value.repoKey === "string" ? parsed.value.repoKey : "";
    const validationError = validateCreateBackgroundJobInput({ prompt, repoKey });
    if (validationError) {
      return localizedErrorResponse(req, validationError, 400);
    }
    const planName = await resolveUserPlanName(auth.user.id);
    const entitlement = await assertCanCreateBackgroundJob(auth.user.id, planName);
    if (!entitlement.ok) {
      return localizedErrorResponse(
        req,
        entitlement.error.key,
        429,
        entitlement.error.params
      );
    }
    const job = await createBackgroundJob(auth.user.id, { prompt, repoKey });
    return jsonResponse(
      appendApiMessage(req, "api.job.created", {
        job: serializeBackgroundJob(job)
      }),
      201
    );
  } catch (error) {
    console.error("[Jobs] Create error:", error);
    return localizedErrorResponse(req, "api.job.createFailed", 500);
  }
}
var MAX_JOB_BODY_BYTES;
var init_jobs = __esm({
  "lib/api/handlers/jobs/index.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_body();
    init_localizedError();
    init_backgroundJobsService();
    init_backgroundJobEntitlement();
    init_backgroundJobTypes();
    init_usageDb();
    MAX_JOB_BODY_BYTES = 256e3;
  }
});

// lib/api/backgroundJobCloudWriteback.ts
function normalizeWorkspacePath(path) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").trim();
}
function parseWorkspaceFilesJson(filesJson) {
  try {
    const parsed = JSON.parse(filesJson);
    if (!Array.isArray(parsed)) return [];
    const out = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const name = item.name;
      const content = item.content;
      if (typeof name !== "string" || !name.trim()) continue;
      if (typeof content !== "string") continue;
      out.push({
        name: normalizeWorkspacePath(name),
        content,
        language: typeof item.language === "string" ? item.language : void 0
      });
    }
    return out;
  } catch {
    return [];
  }
}
function mergePendingChangesIntoWorkspaceFiles(files, changes) {
  const map = /* @__PURE__ */ new Map();
  for (const file of files) {
    map.set(normalizeWorkspacePath(file.name), file);
  }
  for (const change of changes) {
    const name = normalizeWorkspacePath(change.path);
    if (!name) continue;
    map.set(name, {
      name,
      content: change.content,
      language: change.language ?? map.get(name)?.language ?? "plaintext"
    });
  }
  return [...map.values()];
}
async function applyBackgroundJobResultToCloudWorkspace(userId, repoKey, pendingChanges) {
  const workspaceName = (repoKey?.trim() || "default").slice(0, 256);
  if (pendingChanges.length === 0) {
    return { applied: false, workspace: workspaceName, paths: [] };
  }
  try {
    let workspace = await getWorkspaceByName(userId, workspaceName);
    if (!workspace && workspaceName === "default") {
      workspace = await ensureDefaultWorkspace(userId);
    }
    if (!workspace) {
      return {
        applied: false,
        workspace: workspaceName,
        paths: [],
        error: "WORKSPACE_NOT_FOUND"
      };
    }
    const files = parseWorkspaceFilesJson(workspace.files);
    const merged = mergePendingChangesIntoWorkspaceFiles(files, pendingChanges);
    const paths = pendingChanges.map((c) => normalizeWorkspacePath(c.path)).filter(Boolean);
    await upsertWorkspace(
      userId,
      workspaceName,
      JSON.stringify(merged),
      workspace.settings ?? "{}"
    );
    return { applied: true, workspace: workspaceName, paths };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { applied: false, workspace: workspaceName, paths: [], error: message };
  }
}
async function enrichResultWithCloudWriteback(userId, repoKey, result) {
  const changes = result.pendingChanges?.filter(
    (c) => typeof c.path === "string" && typeof c.content === "string"
  ) ?? [];
  if (changes.length === 0) return result;
  const writeback = await applyBackgroundJobResultToCloudWorkspace(userId, repoKey, changes);
  return {
    ...result,
    cloudWriteback: writeback,
    pendingChanges: changes.map((c) => ({ path: c.path, content: c.content, language: c.language }))
  };
}
var init_backgroundJobCloudWriteback = __esm({
  "lib/api/backgroundJobCloudWriteback.ts"() {
    "use strict";
    init_workspacesService();
  }
});

// lib/api/backgroundJobRunner.ts
function promptPreview(prompt, max = 200) {
  const trimmed = prompt.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}\u2026`;
}
async function runDummyBackgroundJob(job, ctx) {
  await ctx.setProgress({ phase: "dummy:start", updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  if (await ctx.isCancelled()) return { kind: "cancelled" };
  if (isJobRuntimeExpired(ctx.startedAt)) return { kind: "timeout" };
  await ctx.setProgress({ phase: "dummy:execute", round: 1, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  if (await ctx.isCancelled()) return { kind: "cancelled" };
  const summary = `Dummy worker completed (${promptPreview(job.prompt, 120)})`;
  const stamp = (/* @__PURE__ */ new Date()).toISOString();
  const markerPath = `.aide/background-jobs/${job.id}.md`;
  const markerContent = [
    "# Background job result",
    "",
    `- **Completed**: ${stamp}`,
    `- **Job**: ${job.id}`,
    "",
    "## Prompt excerpt",
    "",
    promptPreview(job.prompt, 800),
    ""
  ].join("\n");
  return {
    kind: "succeeded",
    result: {
      mode: "dummy",
      summary,
      rounds: 1,
      pendingChanges: [
        {
          path: markerPath,
          content: markerContent,
          language: "markdown"
        }
      ]
    }
  };
}
async function runAgentBackgroundJob(_job, _ctx) {
  return {
    kind: "failed",
    error: "AGENT_WORKER_NOT_IMPLEMENTED"
  };
}
async function runBackgroundJobWorker(job, ctx, mode = resolveBackgroundJobWorkerMode()) {
  if (mode === "agent") return runAgentBackgroundJob(job, ctx);
  return runDummyBackgroundJob(job, ctx);
}
async function executeBackgroundJob(job) {
  const startedAt = job.startedAt ?? /* @__PURE__ */ new Date();
  const ctx = {
    startedAt,
    setProgress: async (progress) => {
      await updateBackgroundJobProgress(job.id, progress);
    },
    isCancelled: async () => {
      const current = await getBackgroundJobById(job.id);
      return current?.status === "cancelled";
    }
  };
  const mode = resolveBackgroundJobWorkerMode();
  const outcome = await runBackgroundJobWorker(job, ctx, mode);
  switch (outcome.kind) {
    case "succeeded": {
      let result = outcome.result;
      try {
        result = await enrichResultWithCloudWriteback(job.userId, job.repoKey, result);
      } catch (error) {
        console.error("[Jobs] Cloud writeback failed:", error);
      }
      const updated = await completeBackgroundJobSucceeded(job.id, result);
      return { jobId: job.id, outcome: updated ? "succeeded" : "cancelled" };
    }
    case "failed": {
      await completeBackgroundJobFailed(job.id, outcome.error);
      return { jobId: job.id, outcome: "failed" };
    }
    case "timeout": {
      await completeBackgroundJobFailed(job.id, "JOB_TIMEOUT");
      return { jobId: job.id, outcome: "failed" };
    }
    case "cancelled":
      return { jobId: job.id, outcome: "cancelled" };
    default:
      return { jobId: job.id, outcome: "failed" };
  }
}
var init_backgroundJobRunner = __esm({
  "lib/api/backgroundJobRunner.ts"() {
    "use strict";
    init_backgroundJobTypes();
    init_backgroundJobCloudWriteback();
    init_backgroundJobsService();
  }
});

// lib/api/backgroundJobProcessor.ts
async function processBackgroundJobs(options = {}) {
  const limit = options.limit ?? DEFAULT_JOBS_PER_CRON_TICK;
  const staleFailed = await failStaleRunningBackgroundJobs();
  const result = {
    staleFailed,
    processed: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
    jobIds: []
  };
  for (let i = 0; i < limit; i++) {
    const job = await claimNextQueuedBackgroundJob();
    if (!job) break;
    result.processed++;
    result.jobIds.push(job.id);
    const run = await executeBackgroundJob(job);
    if (run.outcome === "succeeded") result.succeeded++;
    else if (run.outcome === "cancelled") result.cancelled++;
    else result.failed++;
  }
  return result;
}
var init_backgroundJobProcessor = __esm({
  "lib/api/backgroundJobProcessor.ts"() {
    "use strict";
    init_backgroundJobTypes();
    init_backgroundJobsService();
    init_backgroundJobRunner();
  }
});

// lib/api/handlers/jobs/process.ts
var process_exports = {};
__export(process_exports, {
  GET: () => GET14,
  POST: () => POST21
});
async function runProcess(request) {
  if (!isCronAuthorized(request)) {
    return localizedErrorResponse(request, "api.auth.unauthorized", 401);
  }
  try {
    const result = await processBackgroundJobs();
    return jsonResponse(
      appendApiMessage(request, "api.job.processCronOk", {
        success: true,
        ...result
      })
    );
  } catch (error) {
    console.error("[Jobs process cron] error:", error);
    return localizedErrorResponse(request, "api.job.processFailed", 500);
  }
}
async function GET14(request) {
  return runProcess(request);
}
async function POST21(request) {
  return runProcess(request);
}
var init_process = __esm({
  "lib/api/handlers/jobs/process.ts"() {
    "use strict";
    init_cronAuth();
    init_http();
    init_localizedError();
    init_backgroundJobProcessor();
  }
});

// lib/api/handlers/jobs/cancel.ts
var cancel_exports2 = {};
__export(cancel_exports2, {
  POST: () => POST22
});
async function POST22(req, ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const id = ctx?.params?.id;
  if (!id) return localizedErrorResponse(req, "api.job.idRequired", 400);
  try {
    const result = await cancelBackgroundJobForUser(auth.user.id, id);
    if (result.kind === "not_found") {
      return localizedErrorResponse(req, "api.job.notFound", 404);
    }
    if (result.kind === "not_cancellable") {
      return localizedErrorResponse(req, "api.job.notCancellable", 409);
    }
    return jsonResponse(
      appendApiMessage(req, "api.job.cancelled", {
        job: serializeBackgroundJob(result.job)
      })
    );
  } catch (error) {
    console.error("[Jobs] Cancel error:", error);
    return localizedErrorResponse(req, "api.job.cancelFailed", 500);
  }
}
var init_cancel2 = __esm({
  "lib/api/handlers/jobs/cancel.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_localizedError();
    init_backgroundJobsService();
  }
});

// lib/api/handlers/jobs/byId.ts
var byId_exports2 = {};
__export(byId_exports2, {
  GET: () => GET15
});
async function GET15(req, ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const id = ctx?.params?.id;
  if (!id) return localizedErrorResponse(req, "api.job.idRequired", 400);
  try {
    const job = await getBackgroundJobForUser(auth.user.id, id);
    if (!job) return localizedErrorResponse(req, "api.job.notFound", 404);
    return jsonResponse({ job: serializeBackgroundJob(job) });
  } catch (error) {
    console.error("[Jobs] Get error:", error);
    return localizedErrorResponse(req, "api.job.loadFailed", 500);
  }
}
var init_byId2 = __esm({
  "lib/api/handlers/jobs/byId.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_localizedError();
    init_backgroundJobsService();
  }
});

// lib/api/handlers/workspaces/byId.ts
var byId_exports3 = {};
__export(byId_exports3, {
  DELETE: () => DELETE,
  GET: () => GET16,
  PUT: () => PUT
});
async function GET16(req, ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const id = ctx?.params?.id;
  if (!id) return localizedErrorResponse(req, "api.workspace.nameRequired", 400);
  try {
    const name = decodeURIComponent(id);
    let workspace = await getWorkspaceByName(auth.user.id, name);
    if (!workspace && name === "default") {
      workspace = await ensureDefaultWorkspace(auth.user.id);
    }
    if (!workspace) {
      return localizedErrorResponse(req, "api.workspace.notFound", 404);
    }
    return jsonResponse({ workspace: serializeWorkspace(workspace) });
  } catch (error) {
    console.error("[Workspaces] Load error:", error);
    return localizedErrorResponse(req, "api.workspace.loadFailed", 500);
  }
}
async function PUT(req, ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const id = ctx?.params?.id;
  if (!id) return localizedErrorResponse(req, "api.workspace.nameRequired", 400);
  try {
    const rate = await checkRateLimitDistributed(req, {
      ...resolveRateLimitOptions("workspaces:write"),
      suffix: auth.user.id
    });
    if (!rate.allowed) return rateLimitErrorResponse(req, rate);
    const name = decodeURIComponent(id);
    const parsed = await readJsonWithLimit(
      req,
      MAX_WORKSPACE_BODY_BYTES3
    );
    if (!parsed.ok) return parsed.response;
    const { files, settings, name: newName } = parsed.value;
    const filesPayload = typeof files === "string" ? files : JSON.stringify(files ?? []);
    const settingsPayload = typeof settings === "string" ? settings : JSON.stringify(settings ?? {});
    const payloadError = validateWorkspacePayload(files, settings);
    if (payloadError) {
      return localizedErrorResponse(req, payloadError.key, 413, payloadError.params);
    }
    const targetName = typeof newName === "string" && newName.trim() ? newName.trim() : name;
    const workspace = await upsertWorkspace(
      auth.user.id,
      targetName,
      filesPayload,
      settingsPayload
    );
    return jsonResponse(
      appendApiMessage(req, "api.workspace.saved", {
        success: true,
        workspace: serializeWorkspace(workspace)
      })
    );
  } catch (error) {
    console.error("[Workspaces] Save error:", error);
    return localizedErrorResponse(req, "api.workspace.saveFailed", 500);
  }
}
async function DELETE(req, ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const id = ctx?.params?.id;
  if (!id) return localizedErrorResponse(req, "api.workspace.nameRequired", 400);
  try {
    const name = decodeURIComponent(id);
    await deleteWorkspaceByName(auth.user.id, name);
    return jsonResponse(appendApiMessage(req, "api.workspace.deleted", { success: true }));
  } catch (error) {
    if (error instanceof Error && error.message === "DEFAULT_WORKSPACE_PROTECTED") {
      return localizedErrorResponse(req, "api.workspace.defaultCannotDelete", 400);
    }
    console.error("[Workspaces] Delete error:", error);
    return localizedErrorResponse(req, "api.workspace.deleteFailed", 500);
  }
}
var MAX_WORKSPACE_BODY_BYTES3;
var init_byId3 = __esm({
  "lib/api/handlers/workspaces/byId.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_body();
    init_localizedError();
    init_workspacePayload();
    init_workspacesService();
    init_rateLimit();
    init_rateLimitKv();
    init_rateLimitResponse();
    MAX_WORKSPACE_BODY_BYTES3 = 2e6;
  }
});

// lib/api/handlers/auth/authCatchAll.ts
var authCatchAll_exports = {};
__export(authCatchAll_exports, {
  GET: () => GET17
});
import { randomBytes as randomBytes2 } from "crypto";
async function GET17(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  if (pathname.includes("providers")) {
    const locale = resolveRequestLocale(req);
    return new Response(JSON.stringify({
      credentials: {
        id: "credentials",
        name: apiMessage("api.auth.credentialsProvider", locale),
        type: "credentials"
      }
      // 未来可扩展: github, google
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({
    csrfToken: randomBytes2(32).toString("hex")
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
var init_authCatchAll = __esm({
  "lib/api/handlers/auth/authCatchAll.ts"() {
    "use strict";
    init_apiMessages();
    init_resolveLocale();
  }
});

// lib/api/dispatch.ts
var routes = [
  { method: "GET", match: (p) => p === "/api/health" ? {} : null, load: () => Promise.resolve().then(() => (init_health(), health_exports)), export: "GET" },
  { method: "GET", match: (p) => p === "/api/auth/session" ? {} : null, load: () => Promise.resolve().then(() => (init_session(), session_exports)), export: "GET" },
  { method: "POST", match: (p) => p === "/api/auth/register" ? {} : null, load: () => Promise.resolve().then(() => (init_register(), register_exports)), export: "POST" },
  { method: "POST", match: (p) => p === "/api/auth/forgot-password" ? {} : null, load: () => Promise.resolve().then(() => (init_forgot_password(), forgot_password_exports)), export: "POST" },
  {
    method: "POST",
    match: (p) => p === "/api/auth/callback/credentials" ? {} : null,
    load: () => Promise.resolve().then(() => (init_credentials(), credentials_exports)),
    export: "POST"
  },
  { method: "POST", match: (p) => p === "/api/auth/signout" ? {} : null, load: () => Promise.resolve().then(() => (init_signout(), signout_exports)), export: "POST" },
  { method: "GET", match: (p) => p === "/api/auth/signout" ? {} : null, load: () => Promise.resolve().then(() => (init_signout(), signout_exports)), export: "GET" },
  {
    method: "GET",
    match: (p) => p === "/api/auth/oauth/providers" ? {} : null,
    load: () => Promise.resolve().then(() => (init_providers(), providers_exports)),
    export: "GET"
  },
  { method: "POST", match: (p) => p === "/api/auth/oauth/sync" ? {} : null, load: () => Promise.resolve().then(() => (init_sync(), sync_exports)), export: "POST" },
  {
    method: "GET",
    match: (p) => p.startsWith("/api/auth/oauth/") && p !== "/api/auth/oauth/providers" && p !== "/api/auth/oauth/sync" ? {} : null,
    load: () => Promise.resolve().then(() => (init_catchAll(), catchAll_exports)),
    export: "GET"
  },
  {
    method: "POST",
    match: (p) => p.startsWith("/api/auth/oauth/") && p !== "/api/auth/oauth/sync" ? {} : null,
    load: () => Promise.resolve().then(() => (init_catchAll(), catchAll_exports)),
    export: "POST"
  },
  { method: "GET", match: (p) => p === "/api/workspaces" ? {} : null, load: () => Promise.resolve().then(() => (init_workspaces(), workspaces_exports)), export: "GET" },
  { method: "POST", match: (p) => p === "/api/workspaces" ? {} : null, load: () => Promise.resolve().then(() => (init_workspaces(), workspaces_exports)), export: "POST" },
  { method: "GET", match: (p) => p === "/api/subscription" ? {} : null, load: () => Promise.resolve().then(() => (init_subscription(), subscription_exports)), export: "GET" },
  { method: "GET", match: (p) => p === "/api/subscription/plans" ? {} : null, load: () => Promise.resolve().then(() => (init_plans2(), plans_exports)), export: "GET" },
  {
    method: "GET",
    match: (p) => p === "/api/subscription/payment-methods" ? {} : null,
    load: () => Promise.resolve().then(() => (init_payment_methods(), payment_methods_exports)),
    export: "GET"
  },
  {
    method: "POST",
    match: (p) => p === "/api/payment/alipay/notify" ? {} : null,
    load: () => Promise.resolve().then(() => (init_notify(), notify_exports)),
    export: "POST"
  },
  {
    method: "POST",
    match: (p) => p === "/api/payment/alipay/return" ? {} : null,
    load: () => Promise.resolve().then(() => (init_return(), return_exports)),
    export: "POST"
  },
  {
    method: "POST",
    match: (p) => p === "/api/payment/wechat/notify" ? {} : null,
    load: () => Promise.resolve().then(() => (init_notify2(), notify_exports2)),
    export: "POST"
  },
  {
    method: "GET",
    match: (p) => {
      const m = p.match(/^\/api\/payment\/orders\/([^/]+)$/);
      return m ? { id: decodeURIComponent(m[1]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_byId(), byId_exports)),
    export: "GET"
  },
  {
    method: "POST",
    match: (p) => p === "/api/payment/dev/simulate" ? {} : null,
    load: () => Promise.resolve().then(() => (init_simulate(), simulate_exports)),
    export: "POST"
  },
  {
    method: "POST",
    match: (p) => p === "/api/subscription/checkout" ? {} : null,
    load: () => Promise.resolve().then(() => (init_checkout2(), checkout_exports)),
    export: "POST"
  },
  {
    method: "POST",
    match: (p) => p === "/api/subscription/webhook" ? {} : null,
    load: () => Promise.resolve().then(() => (init_webhook(), webhook_exports)),
    export: "POST"
  },
  {
    method: "POST",
    match: (p) => p === "/api/subscription/cancel" ? {} : null,
    load: () => Promise.resolve().then(() => (init_cancel(), cancel_exports)),
    export: "POST"
  },
  {
    method: "POST",
    match: (p) => p === "/api/subscription/portal" ? {} : null,
    load: () => Promise.resolve().then(() => (init_portal(), portal_exports)),
    export: "POST"
  },
  {
    method: "POST",
    match: (p) => p === "/api/subscription/resume" ? {} : null,
    load: () => Promise.resolve().then(() => (init_resume(), resume_exports)),
    export: "POST"
  },
  {
    method: "POST",
    match: (p) => p === "/api/billing/expire-subscriptions" ? {} : null,
    load: () => Promise.resolve().then(() => (init_expire_subscriptions(), expire_subscriptions_exports)),
    export: "POST"
  },
  {
    method: "GET",
    match: (p) => p === "/api/billing/expire-subscriptions" ? {} : null,
    load: () => Promise.resolve().then(() => (init_expire_subscriptions(), expire_subscriptions_exports)),
    export: "GET"
  },
  { method: "GET", match: (p) => p === "/api/usage/ai" ? {} : null, load: () => Promise.resolve().then(() => (init_ai(), ai_exports)), export: "GET" },
  { method: "POST", match: (p) => p === "/api/usage/ai" ? {} : null, load: () => Promise.resolve().then(() => (init_ai(), ai_exports)), export: "POST" },
  { method: "POST", match: (p) => p === "/api/mcp/proxy" ? {} : null, load: () => Promise.resolve().then(() => (init_proxy(), proxy_exports)), export: "POST" },
  { method: "GET", match: (p) => p === "/api/jobs" ? {} : null, load: () => Promise.resolve().then(() => (init_jobs(), jobs_exports)), export: "GET" },
  { method: "POST", match: (p) => p === "/api/jobs" ? {} : null, load: () => Promise.resolve().then(() => (init_jobs(), jobs_exports)), export: "POST" },
  {
    method: "GET",
    match: (p) => p === "/api/jobs/process" ? {} : null,
    load: () => Promise.resolve().then(() => (init_process(), process_exports)),
    export: "GET"
  },
  {
    method: "POST",
    match: (p) => p === "/api/jobs/process" ? {} : null,
    load: () => Promise.resolve().then(() => (init_process(), process_exports)),
    export: "POST"
  },
  {
    method: "POST",
    match: (p) => {
      const m = p.match(/^\/api\/jobs\/([^/]+)\/cancel$/);
      return m ? { id: decodeURIComponent(m[1]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_cancel2(), cancel_exports2)),
    export: "POST"
  },
  {
    method: "GET",
    match: (p) => {
      const m = p.match(/^\/api\/jobs\/([^/]+)$/);
      return m ? { id: decodeURIComponent(m[1]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_byId2(), byId_exports2)),
    export: "GET"
  },
  {
    method: "GET",
    match: (p) => {
      const m = p.match(/^\/api\/workspaces\/([^/]+)$/);
      return m ? { id: decodeURIComponent(m[1]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_byId3(), byId_exports3)),
    export: "GET"
  },
  {
    method: "PUT",
    match: (p) => {
      const m = p.match(/^\/api\/workspaces\/([^/]+)$/);
      return m ? { id: decodeURIComponent(m[1]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_byId3(), byId_exports3)),
    export: "PUT"
  },
  {
    method: "DELETE",
    match: (p) => {
      const m = p.match(/^\/api\/workspaces\/([^/]+)$/);
      return m ? { id: decodeURIComponent(m[1]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_byId3(), byId_exports3)),
    export: "DELETE"
  },
  {
    method: "GET",
    match: (p) => {
      if (!p.startsWith("/api/auth/")) return null;
      const handled = [
        "/api/auth/session",
        "/api/auth/register",
        "/api/auth/forgot-password",
        "/api/auth/callback/credentials",
        "/api/auth/signout",
        "/api/auth/oauth/providers",
        "/api/auth/oauth/sync"
      ];
      if (handled.includes(p) || p.startsWith("/api/auth/oauth/")) return null;
      return {};
    },
    load: () => Promise.resolve().then(() => (init_authCatchAll(), authCatchAll_exports)),
    export: "GET"
  }
];
async function dispatchApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();
  const route = routes.find((r) => r.method === method && r.match(pathname));
  if (!route) {
    const { localizedErrorResponse: localizedErrorResponse2 } = await Promise.resolve().then(() => (init_localizedError(), localizedError_exports));
    return localizedErrorResponse2(request, "api.notFound", 404);
  }
  const mod = await route.load();
  const handler = mod[route.export];
  if (!handler) {
    const { localizedErrorResponse: localizedErrorResponse2 } = await Promise.resolve().then(() => (init_localizedError(), localizedError_exports));
    return localizedErrorResponse2(request, "api.handlerNotFound", 500);
  }
  const params = route.match(pathname) ?? {};
  return handler(request, { params });
}

// server/vercel-api-index.ts
init_logger();

// lib/api/requestId.ts
function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function getRequestIdFromRequest(req) {
  const value = req.headers.get("x-request-id")?.trim();
  return value || null;
}
function resolveRequestId(req) {
  return getRequestIdFromRequest(req) ?? createRequestId();
}
function attachRequestId(response, requestId) {
  const headers = new Headers(response.headers);
  headers.set("X-Request-Id", requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// server/vercel-api-index.ts
async function requestForDispatch(request, requestId) {
  const url = new URL(request.url);
  const rest = url.searchParams.get("__p");
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  if (!rest) {
    return new Request(request.url, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : void 0
    });
  }
  url.pathname = "/api/" + rest;
  url.searchParams.delete("__p");
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : void 0;
  return new Request(url.toString(), {
    method: request.method,
    headers,
    body: body && body.byteLength > 0 ? body : void 0
  });
}
async function handle(request) {
  const requestId = resolveRequestId(request);
  const started = Date.now();
  const routeHint = new URL(request.url).searchParams.get("__p") || new URL(request.url).pathname;
  try {
    const response = attachRequestId(
      await dispatchApiRequest(await requestForDispatch(request, requestId)),
      requestId
    );
    logApi("info", "api.request", {
      requestId,
      route: routeHint,
      method: request.method,
      status: response.status,
      durationMs: Date.now() - started
    });
    return response;
  } catch (error) {
    logApi("error", "api.unhandled", {
      requestId,
      route: routeHint,
      method: request.method,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error)
    });
    const exposeDetail = process.env.NODE_ENV !== "production";
    return attachRequestId(
      new Response(
        JSON.stringify({
          error: "Internal server error",
          requestId,
          ...exposeDetail ? { detail: error instanceof Error ? error.message : String(error) } : {}
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ),
      requestId
    );
  }
}
var GET18 = handle;
var POST23 = handle;
var PUT2 = handle;
var DELETE2 = handle;
var PATCH = handle;
var OPTIONS = handle;
export {
  DELETE2 as DELETE,
  GET18 as GET,
  OPTIONS,
  PATCH,
  POST23 as POST,
  PUT2 as PUT
};
//# sourceMappingURL=index.js.map
