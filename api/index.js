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
        "api.job.concurrentLimitUpgrade": "\u514D\u8D39\u7248\u540C\u65F6\u53EA\u80FD\u6709 {limit} \u4E2A\u540E\u53F0\u4EFB\u52A1\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210\u6216\u5347\u7EA7\u4E13\u4E1A\u7248",
        "api.job.batchEmpty": "\u6279\u91CF\u4EFB\u52A1\u5217\u8868\u4E3A\u7A7A",
        "api.job.batchCreated": "\u5DF2\u521B\u5EFA {created}/{requested} \u4E2A\u540E\u53F0\u4EFB\u52A1",
        "api.collab.roomCreated": "\u534F\u4F5C\u623F\u95F4\u5DF2\u521B\u5EFA",
        "api.collab.joined": "\u5DF2\u52A0\u5165\u534F\u4F5C\u623F\u95F4",
        "api.collab.listFailed": "\u83B7\u53D6\u534F\u4F5C\u623F\u95F4\u5217\u8868\u5931\u8D25",
        "api.collab.createFailed": "\u521B\u5EFA\u534F\u4F5C\u623F\u95F4\u5931\u8D25",
        "api.collab.loadFailed": "\u52A0\u8F7D\u534F\u4F5C\u623F\u95F4\u5931\u8D25",
        "api.collab.joinFailed": "\u52A0\u5165\u534F\u4F5C\u623F\u95F4\u5931\u8D25",
        "api.collab.roomNotFound": "\u534F\u4F5C\u623F\u95F4\u4E0D\u5B58\u5728",
        "api.collab.roomClosed": "\u534F\u4F5C\u623F\u95F4\u5DF2\u5173\u95ED",
        "api.collab.codeRequired": "\u7F3A\u5C11\u623F\u95F4\u9080\u8BF7\u7801",
        "api.collab.nameTooLong": "\u623F\u95F4\u540D\u79F0\u8FC7\u957F",
        "api.collab.notMember": "\u4F60\u4E0D\u662F\u8BE5\u623F\u95F4\u6210\u5458",
        "api.collab.joinForbidden": "\u65E0\u6CD5\u4EE5\u8BE5\u89D2\u8272\u52A0\u5165\u623F\u95F4",
        "api.collab.left": "\u5DF2\u79BB\u5F00\u534F\u4F5C\u623F\u95F4",
        "api.collab.leaveFailed": "\u79BB\u5F00\u534F\u4F5C\u623F\u95F4\u5931\u8D25",
        "api.collab.memberRequired": "\u7F3A\u5C11\u6210\u5458\u7528\u6237 ID",
        "api.collab.invalidRole": "\u65E0\u6548\u7684\u6210\u5458\u89D2\u8272",
        "api.collab.memberNotFound": "\u6210\u5458\u4E0D\u5B58\u5728",
        "api.collab.forbidden": "\u65E0\u6743\u6267\u884C\u6B64\u64CD\u4F5C",
        "api.collab.roleUpdated": "\u6210\u5458\u89D2\u8272\u5DF2\u66F4\u65B0",
        "api.collab.roleUpdateFailed": "\u66F4\u65B0\u6210\u5458\u89D2\u8272\u5931\u8D25",
        "api.collab.memberKicked": "\u5DF2\u79FB\u51FA\u6210\u5458",
        "api.collab.kickFailed": "\u79FB\u51FA\u6210\u5458\u5931\u8D25"
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
        "api.job.concurrentLimitUpgrade": "Free plan allows {limit} active background job at a time. Wait or upgrade to Pro.",
        "api.job.batchEmpty": "Batch job list is empty",
        "api.job.batchCreated": "Created {created}/{requested} background jobs",
        "api.collab.roomCreated": "Collaboration room created",
        "api.collab.joined": "Joined collaboration room",
        "api.collab.listFailed": "Failed to list collaboration rooms",
        "api.collab.createFailed": "Failed to create collaboration room",
        "api.collab.loadFailed": "Failed to load collaboration room",
        "api.collab.joinFailed": "Failed to join collaboration room",
        "api.collab.roomNotFound": "Collaboration room not found",
        "api.collab.roomClosed": "Collaboration room is closed",
        "api.collab.codeRequired": "Room invite code is required",
        "api.collab.nameTooLong": "Room name is too long",
        "api.collab.notMember": "You are not a member of this room",
        "api.collab.joinForbidden": "Cannot join with that role",
        "api.collab.left": "Left collaboration room",
        "api.collab.leaveFailed": "Failed to leave collaboration room",
        "api.collab.memberRequired": "Member user id is required",
        "api.collab.invalidRole": "Invalid member role",
        "api.collab.memberNotFound": "Member not found",
        "api.collab.forbidden": "You are not allowed to perform this action",
        "api.collab.roleUpdated": "Member role updated",
        "api.collab.roleUpdateFailed": "Failed to update member role",
        "api.collab.memberKicked": "Member removed from room",
        "api.collab.kickFailed": "Failed to remove member"
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
var MAX_JOB_PROMPT_CHARS, MAX_JOB_REPO_KEY_CHARS, DEFAULT_JOB_LIST_LIMIT, MAX_JOB_LIST_LIMIT, MAX_BACKGROUND_JOBS_BATCH, MAX_JOB_RUNTIME_MS, DEFAULT_JOBS_PER_CRON_TICK;
var init_backgroundJobTypes = __esm({
  "lib/api/backgroundJobTypes.ts"() {
    "use strict";
    MAX_JOB_PROMPT_CHARS = 1e5;
    MAX_JOB_REPO_KEY_CHARS = 256;
    DEFAULT_JOB_LIST_LIMIT = 50;
    MAX_JOB_LIST_LIMIT = 100;
    MAX_BACKGROUND_JOBS_BATCH = 25;
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

// lib/api/handlers/jobs/batch.ts
var batch_exports = {};
__export(batch_exports, {
  POST: () => POST21
});
async function POST21(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    const parsed = await readJsonWithLimit(
      req,
      MAX_JOB_BODY_BYTES2
    );
    if (!parsed.ok) return parsed.response;
    const rawPrompts = parsed.value.prompts;
    if (!Array.isArray(rawPrompts) || rawPrompts.length === 0) {
      return localizedErrorResponse(req, "api.job.batchEmpty", 400);
    }
    const prompts = rawPrompts.filter((p) => typeof p === "string").map((p) => p.trim()).filter(Boolean).slice(0, MAX_BACKGROUND_JOBS_BATCH);
    if (prompts.length === 0) {
      return localizedErrorResponse(req, "api.job.batchEmpty", 400);
    }
    const repoKey = parsed.value.repoKey == null ? null : typeof parsed.value.repoKey === "string" ? parsed.value.repoKey : "";
    for (const prompt of prompts) {
      const validationError = validateCreateBackgroundJobInput({ prompt, repoKey });
      if (validationError) {
        return localizedErrorResponse(req, validationError, 400);
      }
    }
    const planName = await resolveUserPlanName(auth.user.id);
    const jobs = [];
    let created = 0;
    let skipped = 0;
    let lastError = null;
    for (const prompt of prompts) {
      const entitlement = await assertCanCreateBackgroundJob(auth.user.id, planName);
      if (!entitlement.ok) {
        lastError = entitlement.error;
        skipped += prompts.length - created - skipped;
        break;
      }
      const job = await createBackgroundJob(auth.user.id, { prompt, repoKey });
      jobs.push(serializeBackgroundJob(job));
      created++;
    }
    const status = created > 0 ? 201 : 429;
    return jsonResponse(
      appendApiMessage(req, "api.job.batchCreated", {
        jobs,
        created,
        skipped,
        requested: prompts.length,
        ...lastError ? { limitReason: lastError.key, limitParams: lastError.params } : {}
      }),
      status
    );
  } catch (error) {
    console.error("[Jobs] Batch create error:", error);
    return localizedErrorResponse(req, "api.job.createFailed", 500);
  }
}
var MAX_JOB_BODY_BYTES2;
var init_batch = __esm({
  "lib/api/handlers/jobs/batch.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_body();
    init_localizedError();
    init_backgroundJobsService();
    init_backgroundJobEntitlement();
    init_backgroundJobTypes();
    init_usageDb();
    MAX_JOB_BODY_BYTES2 = 512e3;
  }
});

// lib/api/backgroundAgentConfig.ts
function parseProvider(raw) {
  const v = raw?.trim().toLowerCase();
  if (v && TOOL_PROVIDERS.includes(v)) {
    return v;
  }
  return null;
}
function resolveDeepSeekModelId(model) {
  return DEEPSEEK_LEGACY[model] ?? model;
}
function resolveBackgroundAgentMaxRounds() {
  const raw = process.env.BACKGROUND_AGENT_MAX_ROUNDS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 8;
  if (!Number.isFinite(n)) return 8;
  return Math.min(16, Math.max(1, n));
}
function resolveBackgroundAgentAiConfig(workspaceSettingsJson) {
  const apiKey = process.env.BACKGROUND_AGENT_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "BACKGROUND_AGENT_API_KEY_MISSING" };
  }
  let settingsProvider;
  let settingsModel;
  if (workspaceSettingsJson?.trim()) {
    try {
      const parsed = JSON.parse(workspaceSettingsJson);
      if (typeof parsed.aiProvider === "string") settingsProvider = parsed.aiProvider;
      if (typeof parsed.aiModel === "string") settingsModel = parsed.aiModel;
    } catch {
    }
  }
  const provider = parseProvider(process.env.BACKGROUND_AGENT_PROVIDER) ?? parseProvider(settingsProvider) ?? "deepseek";
  if (!TOOL_PROVIDERS.includes(provider)) {
    return { ok: false, error: "BACKGROUND_AGENT_PROVIDER_UNSUPPORTED" };
  }
  let model = process.env.BACKGROUND_AGENT_MODEL?.trim() || settingsModel?.trim() || DEFAULT_MODELS[provider];
  if (provider === "deepseek") {
    model = resolveDeepSeekModelId(model);
  }
  return {
    ok: true,
    config: {
      provider,
      apiKey,
      model,
      endpoint: DEFAULT_ENDPOINTS[provider]
    }
  };
}
function supportsBackgroundAgentTools(provider) {
  return TOOL_PROVIDERS.includes(provider);
}
var TOOL_PROVIDERS, DEFAULT_ENDPOINTS, DEFAULT_MODELS, DEEPSEEK_LEGACY;
var init_backgroundAgentConfig = __esm({
  "lib/api/backgroundAgentConfig.ts"() {
    "use strict";
    TOOL_PROVIDERS = [
      "openai",
      "deepseek",
      "grok",
      "zhipu",
      "minimax"
    ];
    DEFAULT_ENDPOINTS = {
      openai: "https://api.openai.com/v1/chat/completions",
      deepseek: "https://api.deepseek.com/v1/chat/completions",
      grok: "https://api.x.ai/v1/chat/completions",
      zhipu: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      minimax: "https://api.minimax.chat/v1/text/chatcompletion_v2"
    };
    DEFAULT_MODELS = {
      openai: "gpt-4o-mini",
      deepseek: "deepseek-v4-flash",
      grok: "grok-4.20",
      zhipu: "glm-4-flash",
      minimax: "minimax-m2.5"
    };
    DEEPSEEK_LEGACY = {
      "deepseek-chat": "deepseek-v4-flash",
      "deepseek-coder": "deepseek-v4-flash",
      "deepseek-r1": "deepseek-v4-pro",
      "deepseek-v3.2": "deepseek-v4-flash"
    };
  }
});

// src/services/gitignoreService.ts
function parseGitignore(content) {
  const rules = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    let negated = false;
    let body = line;
    if (body.startsWith("!")) {
      negated = true;
      body = body.slice(1).trim();
    }
    if (!body) continue;
    const directoryOnly = body.endsWith("/");
    if (directoryOnly) body = body.slice(0, -1);
    const anchored = body.startsWith("/");
    if (anchored) body = body.slice(1);
    rules.push({
      pattern: body,
      negated,
      directoryOnly,
      anchored
    });
  }
  return rules;
}
function globToRegExp(pattern) {
  let regex = "^";
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    const next = pattern[i + 1];
    if (char === "*" && next === "*") {
      regex += ".*";
      i++;
      continue;
    }
    if (char === "*") {
      regex += "[^/]*";
      continue;
    }
    if (char === "?") {
      regex += "[^/]";
      continue;
    }
    regex += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  regex += "$";
  return new RegExp(regex);
}
function ruleMatchesPath(path, rule) {
  const normalized = path.replace(/\\/g, "/").replace(/^\.\//, "");
  const basename = normalized.split("/").pop() ?? normalized;
  const segments = normalized.split("/").filter(Boolean);
  if (rule.directoryOnly) {
    if (rule.anchored) {
      return normalized === rule.pattern || normalized.startsWith(`${rule.pattern}/`);
    }
    if (segments.includes(rule.pattern)) return true;
    return normalized.startsWith(`${rule.pattern}/`) || normalized.includes(`/${rule.pattern}/`);
  }
  const candidates = rule.anchored ? [normalized] : [normalized, basename];
  const re = globToRegExp(rule.pattern);
  for (const candidate of candidates) {
    if (re.test(candidate)) return true;
    if (!rule.anchored && normalized.includes(`/${rule.pattern}`)) return true;
  }
  return false;
}
function isPathIgnoredByGitignore(path, rules) {
  if (rules.length === 0) return false;
  let ignored = false;
  for (const rule of rules) {
    if (!ruleMatchesPath(path, rule)) continue;
    ignored = !rule.negated;
  }
  return ignored;
}
function isGitignorePath(path) {
  const normalized = path.replace(/\\/g, "/").replace(/^\.\//, "");
  return normalized === ".gitignore" || normalized.endsWith("/.gitignore");
}
function mergeGitignoreContents(sources) {
  return sources.filter((source) => isGitignorePath(source.path)).map((source) => source.content.trim()).filter(Boolean).join("\n");
}
function gitignoreRulesFromSources(sources) {
  return parseGitignore(mergeGitignoreContents(sources));
}
var init_gitignoreService = __esm({
  "src/services/gitignoreService.ts"() {
    "use strict";
  }
});

// src/lib/language.ts
function normalizeLanguage(stored) {
  if (stored === "en" || stored === "en-US") return "en-US";
  return "zh-CN";
}
var init_language = __esm({
  "src/lib/language.ts"() {
    "use strict";
  }
});

// src/lib/apiLanguage.ts
function getApiLanguage() {
  return currentApiLanguage;
}
var currentApiLanguage;
var init_apiLanguage = __esm({
  "src/lib/apiLanguage.ts"() {
    "use strict";
    init_language();
    currentApiLanguage = "zh-CN";
  }
});

// src/services/storageLabels.ts
function getAutosaveProjectName() {
  return serviceText("workspace.autosave.project");
}
var init_storageLabels = __esm({
  "src/services/storageLabels.ts"() {
    "use strict";
    init_serviceI18n();
  }
});

// src/services/storageService.ts
import { openDB } from "idb";
async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("projects")) {
          db.createObjectStore("projects", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
      }
    });
  }
  return dbPromise;
}
var DB_NAME, DB_VERSION, dbPromise, storageService;
var init_storageService = __esm({
  "src/services/storageService.ts"() {
    "use strict";
    init_storageLabels();
    DB_NAME = "ai-ide-db";
    DB_VERSION = 1;
    dbPromise = null;
    storageService = {
      // 保存项目
      async saveProject(project) {
        const db = await getDB();
        const now = Date.now();
        const existing = await db.get("projects", project.id);
        await db.put("projects", {
          ...project,
          createdAt: existing?.createdAt || now,
          updatedAt: now
        });
      },
      // 获取项目
      async getProject(id) {
        const db = await getDB();
        return db.get("projects", id);
      },
      // 获取所有项目
      async getAllProjects() {
        const db = await getDB();
        return db.getAll("projects");
      },
      // 删除项目
      async deleteProject(id) {
        const db = await getDB();
        await db.delete("projects", id);
      },
      // 自动保存当前项目
      async autoSave(files, projectId = "default") {
        await this.saveProject({
          id: projectId,
          name: getAutosaveProjectName(),
          files
        });
      },
      // 加载自动保存的项目
      async loadAutoSave(projectId = "default") {
        const project = await this.getProject(projectId);
        return project?.files || null;
      },
      // 保存设置
      async saveSetting(key, value) {
        const db = await getDB();
        await db.put("settings", value, key);
      },
      // 获取设置
      async getSetting(key) {
        const db = await getDB();
        return db.get("settings", key);
      },
      // 导出项目为 ZIP
      async exportToZip(projectId) {
        const project = await this.getProject(projectId);
        if (!project) return null;
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const file of project.files) {
          zip.file(file.name, file.content);
        }
        return zip.generateAsync({ type: "blob" });
      }
    };
  }
});

// src/services/localStorageService.ts
function isStorageAvailable() {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}
var STORAGE_PREFIX, StorageKeys, localStorageService;
var init_localStorageService = __esm({
  "src/services/localStorageService.ts"() {
    "use strict";
    STORAGE_PREFIX = "ai-ide:";
    StorageKeys = {
      THEME: "theme",
      LANGUAGE: "language",
      AI_CONFIG: "ai-config",
      COLLAB_USERNAME: "collab_username",
      WORKSPACE: "workspace",
      TERMINAL_HISTORY: "terminal-history",
      SETTINGS: "settings",
      RECENT_FILES: "recent-files",
      USER: "user"
      // 缓存登录用户会话
    };
    localStorageService = {
      isAvailable: isStorageAvailable(),
      /**
       * 获取存储项（带类型安全）
       */
      get(key, defaultValue) {
        if (!this.isAvailable) return defaultValue;
        try {
          const prefixedKey = STORAGE_PREFIX + key;
          const item = localStorage.getItem(prefixedKey);
          if (item === null) return defaultValue;
          return JSON.parse(item);
        } catch (error) {
          console.warn(`[localStorage] Failed to get "${key}":`, error);
          return defaultValue;
        }
      },
      /**
       * 设置存储项
       */
      set(key, value) {
        if (!this.isAvailable) {
          console.warn("[localStorage] Storage not available (Safari Private Mode?)");
          return false;
        }
        try {
          const prefixedKey = STORAGE_PREFIX + key;
          localStorage.setItem(prefixedKey, JSON.stringify(value));
          return true;
        } catch (error) {
          if (error.name === "QuotaExceededError") {
            console.error(`[localStorage] Storage quota exceeded for "${key}"`);
            this.cleanup();
          } else {
            console.error(`[localStorage] Failed to set "${key}":`, error);
          }
          return false;
        }
      },
      /**
       * 移除存储项
       */
      remove(key) {
        if (!this.isAvailable) return false;
        try {
          const prefixedKey = STORAGE_PREFIX + key;
          localStorage.removeItem(prefixedKey);
          return true;
        } catch (error) {
          console.error(`[localStorage] Failed to remove "${key}":`, error);
          return false;
        }
      },
      /**
       * 清理所有以 ai-ide: 开头的存储项
       */
      clear() {
        if (!this.isAvailable) return false;
        try {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
          console.log(`[localStorage] Cleared ${keysToRemove.length} items`);
          return true;
        } catch (error) {
          console.error("[localStorage] Failed to clear:", error);
          return false;
        }
      },
      /**
       * 清理旧数据（当存储超出时）
       */
      cleanup() {
        if (!this.isAvailable) return;
        try {
          const lowPriorityKeys = [
            StorageKeys.TERMINAL_HISTORY,
            StorageKeys.RECENT_FILES
          ];
          lowPriorityKeys.forEach((key) => {
            const prefixedKey = STORAGE_PREFIX + key;
            if (localStorage.getItem(prefixedKey)) {
              console.log(`[localStorage] Cleaning up "${key}" to free space`);
              localStorage.removeItem(prefixedKey);
            }
          });
        } catch (error) {
          console.error("[localStorage] Cleanup failed:", error);
        }
      },
      /**
       * 获取存储使用情况
       */
      getUsage() {
        if (!this.isAvailable) {
          return { used: 0, total: 0, percentage: 0 };
        }
        try {
          let used = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const value = localStorage.getItem(key) || "";
              used += key.length + value.length;
            }
          }
          const estimatedTotal = 5 * 1024 * 1024;
          return {
            used,
            total: estimatedTotal,
            percentage: Math.round(used / estimatedTotal * 100)
          };
        } catch (error) {
          console.error("[localStorage] Failed to get usage:", error);
          return { used: 0, total: 0, percentage: 0 };
        }
      }
    };
  }
});

// src/services/unifiedStorage.ts
function estimateSize(data) {
  try {
    const str = JSON.stringify(data);
    return str.length * 2;
  } catch {
    return Infinity;
  }
}
function selectLayer(data, preferredLayer) {
  if (preferredLayer) return preferredLayer;
  const size = estimateSize(data);
  if (size < 10 * 1024) return "local" /* LOCAL */;
  return "indexed" /* INDEXED */;
}
var memoryCache, CACHE_MAX_AGE_MS, unifiedStorage;
var init_unifiedStorage = __esm({
  "src/services/unifiedStorage.ts"() {
    "use strict";
    init_storageService();
    init_localStorageService();
    memoryCache = /* @__PURE__ */ new Map();
    CACHE_MAX_AGE_MS = 5 * 60 * 1e3;
    unifiedStorage = {
      /**
       * 保存数据（自动选择存储层）
       */
      async set(key, data, options) {
        const layer = options?.layer || selectLayer(data);
        const timestamp = Date.now();
        const size = estimateSize(data);
        try {
          switch (layer) {
            case "memory" /* MEMORY */:
              memoryCache.set(key, { data, timestamp, layer, size });
              return true;
            case "local" /* LOCAL */:
              memoryCache.delete(key);
              return localStorageService.set(key, data);
            case "indexed" /* INDEXED */:
              memoryCache.set(key, { data, timestamp, layer, size });
              if (key.startsWith("project:")) {
                const projectId = key.replace("project:", "");
                await storageService.saveProject({
                  id: projectId,
                  name: data?.name || "Untitled",
                  files: data?.files || []
                });
              } else {
                await storageService.saveSetting(key, data);
              }
              return true;
            case "cloud" /* CLOUD */:
              console.warn("[unifiedStorage] Cloud storage should use authService");
              return false;
            default:
              return false;
          }
        } catch (error) {
          console.error(`[unifiedStorage] Failed to set "${key}":`, error);
          return false;
        }
      },
      /**
       * 读取数据（自动按优先级查找）
       */
      async get(key, defaultValue, options) {
        const cached2 = memoryCache.get(key);
        if (cached2) {
          const age = Date.now() - cached2.timestamp;
          if (age < CACHE_MAX_AGE_MS) {
            return cached2.data;
          }
          memoryCache.delete(key);
        }
        const layers = options?.preferredLayer ? [options.preferredLayer] : ["memory" /* MEMORY */, "local" /* LOCAL */, "indexed" /* INDEXED */];
        for (const layer of layers) {
          try {
            let data = null;
            switch (layer) {
              case "local" /* LOCAL */:
                data = localStorageService.get(key, null);
                break;
              case "indexed" /* INDEXED */:
                if (key.startsWith("project:")) {
                  const projectId = key.replace("project:", "");
                  const project = await storageService.getProject(projectId);
                  data = project;
                } else {
                  data = await storageService.getSetting(key);
                }
                break;
            }
            if (data !== null && data !== void 0) {
              memoryCache.set(key, {
                data,
                timestamp: Date.now(),
                layer,
                size: estimateSize(data)
              });
              return data;
            }
          } catch (error) {
            console.warn(`[unifiedStorage] Failed to get "${key}" from ${layer}:`, error);
          }
        }
        return defaultValue;
      },
      /**
       * 删除数据
       */
      async remove(key) {
        memoryCache.delete(key);
        localStorageService.remove(key);
        if (key.startsWith("project:")) {
          const projectId = key.replace("project:", "");
          await storageService.deleteProject(projectId);
        } else {
          await storageService.getAllProjects();
        }
        return true;
      },
      /**
       * 批量操作（提升性能）
       */
      async setBatch(items) {
        const promises = items.map((item) => this.set(item.key, item.data, { layer: item.layer }));
        const results = await Promise.all(promises);
        return results.every((r) => r);
      },
      /**
       * 获取存储统计
       */
      async getStats() {
        const localUsage = localStorageService.getUsage();
        let memorySize = 0;
        memoryCache.forEach((item) => memorySize += item.size);
        const projects = await storageService.getAllProjects();
        let indexedSize = 0;
        projects.forEach((p) => indexedSize += estimateSize(p));
        return {
          memory: memorySize,
          local: localUsage.used,
          indexed: indexedSize,
          total: memorySize + localUsage.used + indexedSize
        };
      },
      /**
       * 清理过期缓存
       */
      cleanup() {
        const now = Date.now();
        let cleaned = 0;
        memoryCache.forEach((item, key) => {
          if (now - item.timestamp > CACHE_MAX_AGE_MS) {
            memoryCache.delete(key);
            cleaned++;
          }
        });
        if (cleaned > 0) {
          console.log(`[unifiedStorage] Cleaned ${cleaned} expired cache items`);
        }
      },
      /**
       * 导出所有数据（用于备份）
       */
      async exportAll() {
        const projects = await storageService.getAllProjects();
        const local = {};
        Object.keys(StorageKeys).forEach((key) => {
          const value = localStorageService.get(key, null);
          if (value !== null) local[key] = value;
        });
        return {
          local,
          indexed: {
            projects,
            settings: {}
            // IndexedDB settings 需要单独读取
          }
        };
      },
      /**
       * 导入数据（用于恢复）
       */
      async importAll(data) {
        try {
          if (data.local) {
            Object.entries(data.local).forEach(([key, value]) => {
              localStorageService.set(key, value);
            });
          }
          if (data.indexed?.projects) {
            for (const project of data.indexed.projects) {
              await storageService.saveProject(project);
            }
          }
          return true;
        } catch (error) {
          console.error("[unifiedStorage] Import failed:", error);
          return false;
        }
      }
    };
    setInterval(() => unifiedStorage.cleanup(), 5 * 60 * 1e3);
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        unifiedStorage.cleanup();
      });
    }
  }
});

// src/i18n/translations.ts
function interpolate2(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === void 0 ? `{${key}}` : String(value);
  });
}
var translations;
var init_translations = __esm({
  "src/i18n/translations.ts"() {
    "use strict";
    translations = {
      "zh-CN": {
        "app.name": "AI IDE",
        "app.tagline": "\u6D4F\u89C8\u5668\u5185\u5F00\u53D1\u3001\u8FD0\u884C\u4E0E AI \u534F\u4F5C",
        "toolbar.files": "\u6587\u4EF6",
        "toolbar.search": "\u641C\u7D22",
        "toolbar.ai": "AI",
        "toolbar.workspace": "\u5DE5\u4F5C\u533A\u7BA1\u7406",
        "toolbar.git": "Git",
        "toolbar.run": "\u8FD0\u884C",
        "toolbar.running": "\u6B63\u5728\u8FD0\u884C\u2026",
        "toolbar.preview": "\u9884\u89C8",
        "toolbar.commandPalette": "\u547D\u4EE4\u9762\u677F",
        "toolbar.settings": "\u8BBE\u7F6E",
        "toolbar.welcome": "\u8FD4\u56DE\u6B22\u8FCE\u9875",
        "toolbar.login": "\u767B\u5F55",
        "toolbar.logout": "\u9000\u51FA\u767B\u5F55",
        "toolbar.logoutTitle": "\u9000\u51FA\u767B\u5F55",
        "toolbar.logoutMessage": "\u5F53\u524D\u7528\u6237\uFF1A{email}\u3002\u9000\u51FA\u540E\u4ECD\u53EF\u7EE7\u7EED\u4F7F\u7528\u672C\u5730\u5DE5\u4F5C\u533A\u3002",
        "toolbar.logoutConfirm": "\u9000\u51FA",
        "toolbar.loggedOut": "\u5DF2\u9000\u51FA\u767B\u5F55",
        "toolbar.fileCount": "\u6587\u4EF6\u6570",
        "toolbar.fileCountHint": "\u5DF2\u6253\u5F00 {current} / \u4E0A\u9650 {max}\uFF08\u4E0E\u7D22\u5F15\u4E00\u81F4\uFF09",
        "sidebar.expandAll": "\u5C55\u5F00",
        "sidebar.collapseAll": "\u6298\u53E0",
        "limits.files": "\u5DE5\u4F5C\u533A {current} / {max}",
        "limits.warn": "\u63A5\u8FD1\u6587\u4EF6\u4E0A\u9650\uFF0C\u5EFA\u8BAE\u5173\u95ED\u65E0\u5173\u6807\u7B7E\u6216\u6539\u7528\u684C\u9762\u7248\u6253\u5F00\u5927\u4ED3\u5E93\u3002",
        "limits.fullBrowser": "\u5DF2\u8FBE\u6D4F\u89C8\u5668\u5DE5\u4F5C\u533A\u4E0A\u9650\uFF0C\u90E8\u5206\u6587\u4EF6\u53EF\u80FD\u65E0\u6CD5\u52A0\u5165\u7D22\u5F15\u6216 AI \u4E0A\u4E0B\u6587\u3002",
        "limits.fullDesktop": "\u5DF2\u8FBE\u684C\u9762\u7248\u5DE5\u4F5C\u533A\u4E0A\u9650\uFF0C\u8BF7\u62C6\u5206\u9879\u76EE\u6216\u6392\u9664 node_modules \u7B49\u5927\u76EE\u5F55\u3002",
        "limits.hintBrowser": "\u6D4F\u89C8\u5668\u7248\u4E0A\u9650 500 \u4E2A\u6587\u4EF6\uFF1B\u684C\u9762\u7248 2000\u3002",
        "limits.hintDesktop": "\u684C\u9762\u7248\u53EF\u7D22\u5F15\u6700\u591A 2000 \u4E2A\u6587\u4EF6\u3002",
        "limits.learnMore": "\u4E86\u89E3\u9650\u5236",
        "chat.error.payloadTooLarge": "\u8BF7\u6C42\u4F53\u8FC7\u5927\uFF08413\uFF09",
        "chat.error.payloadTooLargeTips": "\u5EFA\u8BAE\uFF1A\u2460 \u5173\u95ED\u300C\u5DE5\u4F5C\u533A\u4E0A\u4E0B\u6587\u300D\uFF1B\u2461 \u51CF\u5C11 @ \u63D0\u53CA\u7684\u6587\u4EF6\uFF1B\u2462 \u5173\u95ED\u8BED\u4E49\u68C0\u7D22\uFF1B\u2463 \u62C6\u5206\u5BF9\u8BDD\u6216\u6E05\u7A7A\u5386\u53F2\u540E\u91CD\u8BD5\u3002",
        "chat.payload.preflightWarnTitle": "\u4E0A\u4E0B\u6587\u53EF\u80FD\u8FC7\u5927\uFF0C\u5EFA\u8BAE\u5148\u7CBE\u7B80\u518D\u53D1\u9001",
        "chat.payload.preflightWarnDetail": "\u9884\u8BA1\u8BF7\u6C42\u4F53\u7EA6 {estimatedKb}KB\uFF08\u9884\u7B97 {budgetKb}KB\uFF09\uFF0C\u53EF\u80FD\u89E6\u53D1 413\u3002",
        "chat.payload.slimAndSend": "\u7CBE\u7B80\u540E\u53D1\u9001",
        "chat.payload.stillTooLarge": "\u5DF2\u7CBE\u7B80\u4F46\u8BF7\u6C42\u4ECD\u8FC7\u5927\uFF08\u7EA6 {estimatedKb}KB\uFF0C\u9884\u7B97 {budgetKb}KB\uFF09\uFF0C\u8BF7\u518D\u51CF\u5C11 @ \u6216\u5173\u95ED\u5DE5\u4F5C\u533A\u4E0A\u4E0B\u6587\u3002",
        "chat.payload.planHistory": "\u5386\u53F2\u538B\u7F29\u5230\u6700\u8FD1 {count} \u6761",
        "chat.payload.planInput": "\u7528\u6237\u8F93\u5165\u6700\u591A\u4FDD\u7559 {count} \u5B57\u7B26",
        "chat.payload.planWorkspace": "\u4E34\u65F6\u5173\u95ED\u5DE5\u4F5C\u533A\u4E0A\u4E0B\u6587",
        "chat.payload.planMention": "\u4E34\u65F6\u5173\u95ED @ \u6CE8\u5165",
        "chat.action.copy": "\u590D\u5236",
        "chat.action.copyCode": "\u590D\u5236\u4EE3\u7801",
        "chat.action.copied": "\u5DF2\u590D\u5236",
        "chat.action.copyDetail": "\u5185\u5BB9\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F",
        "chat.action.copyFailed": "\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6D4F\u89C8\u5668\u6743\u9650",
        "chat.action.retry": "\u91CD\u8BD5",
        "chat.action.continue": "\u7EE7\u7EED",
        "chat.action.continuePrompt": "\u8BF7\u7EE7\u7EED\u4E0A\u4E00\u6761\u56DE\u7B54\uFF0C\u4ECE\u65AD\u70B9\u5904\u63A5\u7740\u5199\u3002",
        "chat.error.abortedTitle": "\u5DF2\u505C\u6B62\u751F\u6210",
        "chat.error.abortedBody": "\u672C\u6B21\u56DE\u590D\u5DF2\u88AB\u624B\u52A8\u505C\u6B62\u3002",
        "chat.error.abortedHint": "\u4F60\u53EF\u4EE5\u4FEE\u6539\u95EE\u9898\u540E\u91CD\u65B0\u53D1\u9001\u3002",
        "chat.error.networkTitle": "\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25",
        "chat.error.networkBody": "\u6682\u65F6\u65E0\u6CD5\u8FDE\u4E0A\u6A21\u578B\u670D\u52A1\u3002",
        "chat.error.networkHint": "\u8BF7\u68C0\u67E5\u7F51\u7EDC\u3001API \u5730\u5740\u6216\u7A0D\u540E\u91CD\u8BD5\u3002",
        "chat.error.authTitle": "\u8BA4\u8BC1\u5931\u8D25",
        "chat.error.authBody": "API Key \u53EF\u80FD\u65E0\u6548\u6216\u672A\u914D\u7F6E\u3002",
        "chat.error.authHint": "\u8BF7\u5230\u8BBE\u7F6E\u9875\u68C0\u67E5 Provider \u4E0E API Key\u3002",
        "chat.error.quotaTitle": "\u4ECA\u65E5\u989D\u5EA6\u5DF2\u7528\u5B8C",
        "chat.error.quotaBody": "\u5F53\u524D\u5957\u9910\u7684 AI \u8C03\u7528\u6B21\u6570\u5DF2\u8FBE\u4E0A\u9650\u3002",
        "chat.error.quotaHint": "\u53EF\u5347\u7EA7\u5957\u9910\uFF0C\u6216\u660E\u5929\u518D\u8BD5\u3002",
        "chat.error.genericTitle": "\u8BF7\u6C42\u5931\u8D25",
        "chat.error.genericBody": "{message}",
        "chat.error.genericHint": "\u53EF\u70B9\u51FB\u6D88\u606F\u4E0B\u65B9\u300C\u91CD\u8BD5\u300D\uFF0C\u6216\u7F29\u77ED\u4E0A\u4E0B\u6587\u540E\u518D\u53D1\u3002",
        "toolbar.plugin": "\u63D2\u4EF6\uFF1A{label}",
        "toolbar.plans.guest": "\u67E5\u770B\u5957\u9910",
        "toolbar.plans.upgrade": "\u5347\u7EA7\u5957\u9910 \xA519\u8D77",
        "toolbar.plans.team": "\u5347\u7EA7\u56E2\u961F\u7248",
        "toolbar.collaboration": "\u534F\u4F5C",
        "sidebar.files": "\u6587\u4EF6",
        "editor.placeholder": "// \u5F00\u59CB\u7F16\u5199\u4EE3\u7801...",
        "ai.welcome": "\u4F60\u597D\uFF01\u6211\u662F\u4F60\u7684 AI \u7F16\u7A0B\u52A9\u624B\u3002",
        "ai.chat.welcome": "\u4F60\u597D\uFF0C\u6211\u662F\u4F60\u7684 AI \u7F16\u7A0B\u52A9\u624B\u3002\u5F53\u524D\u6B63\u5728\u4F7F\u7528 {provider}{modelSuffix}\u3002",
        "ai.chat.welcomeModel": " ({model})",
        "ai.chat.helpIntro": "\u6211\u53EF\u4EE5\u5E2E\u4F60\uFF1A",
        "ai.chat.bullet.explain": "\u89E3\u91CA\u5F53\u524D\u4EE3\u7801",
        "ai.chat.bullet.refactor": "\u91CD\u6784\u548C\u4F18\u5316\u5B9E\u73B0",
        "ai.chat.bullet.generate": "\u751F\u6210\u65B0\u529F\u80FD\u9AA8\u67B6",
        "ai.chat.bullet.fix": "\u5E2E\u4F60\u5B9A\u4F4D\u548C\u4FEE\u590D\u95EE\u9898",
        "ai.chat.prompt": "\u76F4\u63A5\u8F93\u5165\u4F60\u7684\u9700\u6C42\uFF0C\u6216\u8005\u5148\u70B9\u4E0B\u9762\u7684\u5FEB\u6377\u52A8\u4F5C\u5F00\u59CB\u3002",
        "ai.chat.quick.explain": "\u89E3\u91CA",
        "ai.chat.quick.refactor": "\u91CD\u6784",
        "ai.chat.quick.fix": "\u4F18\u5316",
        "ai.chat.quick.generate": "\u751F\u6210",
        "common.save": "\u4FDD\u5B58",
        "common.cancel": "\u53D6\u6D88",
        "common.close": "\u5173\u95ED",
        "modal.dialog": "\u5BF9\u8BDD\u6846",
        "welcome.badge": "AI \u539F\u751F\u6D4F\u89C8\u5668 IDE",
        "welcome.rcBadge": "RC \u516C\u6D4B",
        "welcome.stableBadge": "v{version} \u7A33\u5B9A\u7248",
        "welcome.gaBadge": "\u6B63\u5F0F\u7248",
        "welcome.desktopBadge": "\u684C\u9762\u7248",
        "welcome.cloudOk": "\u4E91\u7AEF\u8D26\u53F7\u670D\u52A1\u6B63\u5E38\uFF0C\u53EF\u6CE8\u518C\u5E76\u540C\u6B65\u5DE5\u4F5C\u533A\u3002",
        "welcome.cloudDegraded": "\u4E91\u7AEF\u6570\u636E\u5E93\u6682\u4E0D\u53EF\u7528\uFF1A\u6CE8\u518C/\u4E91\u5DE5\u4F5C\u533A\u53EF\u80FD\u5931\u8D25\u3002\u4F60\u4ECD\u53EF\u4F7F\u7528 BYOK \u4E0E\u672C\u5730\u7F16\u8F91\uFF1B\u7EF4\u62A4\u8005\u8BF7\u68C0\u67E5\u90E8\u7F72\u73AF\u5883\u53D8\u91CF\u3002",
        "welcome.networkTips": "\u9875\u9762\u52A0\u8F7D\u6162\u6216 API \u8D85\u65F6\uFF1F\u56FD\u5185\u8BBF\u95EE vercel.app \u53EF\u80FD\u4E0D\u7A33\u5B9A\u3002\u53EF\u7A0D\u540E\u91CD\u8BD5\u3001\u66F4\u6362\u7F51\u7EDC\uFF0C\u6216\u4E0B\u8F7D Windows/macOS \u684C\u9762\u7248\u3002\u81EA\u5B9A\u4E49\u57DF\u540D\u89C1 docs/CUSTOM_DOMAIN.md\u3002",
        "welcome.title": "\u66F4\u5FEB\u8FDB\u5165\u601D\u8DEF\uFF0C\u66F4\u5C11\u6D88\u8017\u5728\u73AF\u5883\u4E0A",
        "welcome.lead": "\u6253\u5F00\u6587\u4EF6\u3001\u4E0E AI \u534F\u4F5C\u3001\u8FD0\u884C\u4EE3\u7801\u3001\u7BA1\u7406\u5DE5\u4F5C\u533A\uFF0C\u5168\u90E8\u5728\u4E00\u4E2A\u8F7B\u91CF\u754C\u9762\u91CC\u5B8C\u6210\u3002\u4ECE\u4E0B\u9762\u7684\u5165\u53E3\u76F4\u63A5\u5F00\u59CB\u5DE5\u4F5C\uFF0C\u4E0D\u7528\u5148\u7A7F\u8FC7\u4E00\u5C42\u8BF4\u660E\u9875\u3002",
        "welcome.settings": "\u8BBE\u7F6E\u4E2D\u5FC3",
        "welcome.quickStart": "\u5FEB\u901F\u5F00\u59CB",
        "welcome.recent": "\u6700\u8FD1\u9879\u76EE",
        "welcome.recentFiles": "{count} \u4E2A\u6587\u4EF6",
        "welcome.recentEmpty": "\u8FD8\u6CA1\u6709\u6700\u8FD1\u9879\u76EE\u3002\u65B0\u5EFA\u4E00\u4E2A\u5DE5\u4F5C\u533A\u540E\uFF0C\u8FD9\u91CC\u4F1A\u4FDD\u7559\u4F60\u7684\u6700\u8FD1\u5165\u53E3\u3002",
        "welcome.features": "\u6838\u5FC3\u80FD\u529B",
        "welcome.shortcuts": "\u5E38\u7528\u5FEB\u6377\u952E",
        "welcome.quick.new.title": "\u4ECE\u6A21\u677F\u65B0\u5EFA\u9879\u76EE",
        "welcome.quick.new.desc": "\u9009\u62E9 React\u3001Node \u7B49 starter \u6A21\u677F\u5F00\u59CB\u7F16\u7801\u3002",
        "welcome.quick.open.title": "\u6253\u5F00\u5DE5\u4F5C\u533A\u7BA1\u7406",
        "welcome.quick.open.desc": "\u52A0\u8F7D\u4E91\u7AEF/\u672C\u5730\u5FEB\u7167\uFF0C\u6216\u5BFC\u5165\u6587\u4EF6\u5939\u3002",
        "welcome.quick.ai.title": "\u5148\u548C AI \u8BA8\u8BBA\u65B9\u6848",
        "welcome.quick.ai.desc": "\u4ECE\u9700\u6C42\u3001\u8C03\u8BD5\u6216\u91CD\u6784\u5EFA\u8BAE\u5F00\u59CB\u3002",
        "welcome.cta.template": "\u6A21\u677F",
        "welcome.cta.manage": "\u7BA1\u7406",
        "welcome.cta.ai": "AI",
        "welcome.feature.ai.title": "AI \u7ED3\u5BF9\u7F16\u7A0B",
        "welcome.feature.ai.desc": "\u5BF9\u8BDD\u751F\u6210\u3001\u91CD\u6784\u548C\u89E3\u91CA\u4EE3\u7801",
        "welcome.feature.run.title": "\u6D4F\u89C8\u5668\u5185\u8FD0\u884C",
        "welcome.feature.run.desc": "\u57FA\u4E8E WebContainer \u7684\u5373\u65F6\u6267\u884C",
        "welcome.feature.terminal.title": "\u96C6\u6210\u7EC8\u7AEF",
        "welcome.feature.terminal.desc": "\u8FB9\u5199\u8FB9\u8DD1\uFF0C\u5C11\u5207\u6362\u4E0A\u4E0B\u6587",
        "welcome.feature.git.title": "Git \u5DE5\u4F5C\u6D41",
        "welcome.feature.git.desc": "\u5728 IDE \u5185\u8FFD\u8E2A\u548C\u63D0\u4EA4\u53D8\u66F4",
        "welcome.feature.settings.title": "\u4E3B\u9898\u4E0E\u8BBE\u7F6E",
        "welcome.feature.settings.desc": "\u5FEB\u901F\u5207\u6362\u5DE5\u4F5C\u4E60\u60EF\u4E0E\u754C\u9762\u98CE\u683C",
        "welcome.feature.collab.title": "\u534F\u4F5C\u6269\u5C55",
        "welcome.feature.collab.desc": "\u5B9E\u9A8C\u6027\u623F\u95F4\u4E0E\u5728\u7EBF\u7528\u6237",
        "welcome.shortcut.newFile": "\u65B0\u5EFA\u6587\u4EF6",
        "welcome.shortcut.openProject": "\u6253\u5F00\u9879\u76EE",
        "welcome.shortcut.save": "\u7ACB\u5373\u4FDD\u5B58",
        "welcome.shortcut.run": "\u8FD0\u884C\u4EE3\u7801",
        "welcome.shortcut.commandPalette": "\u6253\u5F00\u547D\u4EE4\u9762\u677F",
        "welcome.shortcut.search": "\u5168\u5C40\u641C\u7D22",
        "welcome.footer.privacy": "\u9690\u79C1\u653F\u7B56",
        "welcome.footer.terms": "\u670D\u52A1\u6761\u6B3E",
        "welcome.footer.browser": "\u6D4F\u89C8\u5668\u80FD\u529B\u8BF4\u660E",
        "welcome.footer.aiNote": "AI \u5BF9\u8BDD\u4E0E API Key \u7531\u60A8\u9009\u62E9\u7684\u6A21\u578B\u670D\u52A1\u5546\u76F4\u63A5\u5904\u7406\u3002",
        "welcome.appUrl": "\u5F53\u524D\u8BBF\u95EE\u5730\u5740\uFF1A{url}",
        "auth.title.login": "\u6B22\u8FCE\u56DE\u6765",
        "auth.title.register": "\u521B\u5EFA\u8D26\u53F7",
        "auth.title.forgot": "\u627E\u56DE\u5BC6\u7801",
        "auth.subtitle.login": "\u767B\u5F55\u4EE5\u540C\u6B65\u60A8\u7684\u5DE5\u4F5C\u533A\u6570\u636E",
        "auth.subtitle.register": "\u6CE8\u518C\u540E\u5373\u53EF\u5F00\u59CB\u4F7F\u7528\u4E91\u540C\u6B65\u529F\u80FD",
        "auth.subtitle.forgot": "\u8F93\u5165\u60A8\u7684\u90AE\u7BB1\u4EE5\u91CD\u7F6E\u5BC6\u7801",
        "auth.oauth.github": "\u4F7F\u7528 GitHub \u767B\u5F55",
        "auth.oauth.google": "\u4F7F\u7528 Google \u767B\u5F55",
        "auth.oauth.divider": "\u6216\u4F7F\u7528\u90AE\u7BB1\u767B\u5F55",
        "auth.email": "\u90AE\u7BB1\u5730\u5740",
        "auth.password": "\u5BC6\u7801",
        "auth.confirmPassword": "\u786E\u8BA4\u5BC6\u7801",
        "auth.forgotLink": "\u5FD8\u8BB0\u5BC6\u7801\uFF1F",
        "auth.placeholder.password": "\u8F93\u5165\u5BC6\u7801",
        "auth.placeholder.passwordRegister": "\u81F3\u5C11 8 \u4F4D\u5B57\u7B26",
        "auth.placeholder.confirm": "\u518D\u6B21\u8F93\u5165\u5BC6\u7801",
        "auth.submit.login": "\u767B\u5F55",
        "auth.submit.register": "\u521B\u5EFA\u8D26\u53F7",
        "auth.submit.forgot": "\u53D1\u9001\u91CD\u7F6E\u90AE\u4EF6",
        "auth.footer.noAccount": "\u8FD8\u6CA1\u6709\u8D26\u53F7\uFF1F",
        "auth.footer.register": "\u7ACB\u5373\u6CE8\u518C",
        "auth.footer.hasAccount": "\u5DF2\u6709\u8D26\u53F7\uFF1F",
        "auth.footer.login": "\u76F4\u63A5\u767B\u5F55",
        "auth.footer.backLogin": "\u2190 \u8FD4\u56DE\u767B\u5F55",
        "auth.error.invalidEmail": "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740",
        "auth.error.passwordLength": "\u5BC6\u7801\u81F3\u5C11\u9700\u8981 8 \u4F4D\u5B57\u7B26",
        "auth.error.passwordMismatch": "\u4E24\u6B21\u8F93\u5165\u7684\u5BC6\u7801\u4E0D\u4E00\u81F4",
        "auth.error.loginFailed": "\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF",
        "auth.error.registerFailed": "\u6CE8\u518C\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
        "auth.error.resetFailed": "\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
        "auth.success.resetSent": "\u91CD\u7F6E\u5BC6\u7801\u90AE\u4EF6\u5DF2\u53D1\u9001\uFF0C\u8BF7\u68C0\u67E5\u90AE\u7BB1",
        "auth.success.login": "\u767B\u5F55\u6210\u529F",
        "auth.success.register": "\u6CE8\u518C\u6210\u529F",
        "auth.success.signout": "\u5DF2\u9000\u51FA\u767B\u5F55",
        "auth.success.oauthSync": "OAuth \u767B\u5F55\u6210\u529F",
        "workspace.success.created": "\u5DE5\u4F5C\u533A\u5DF2\u521B\u5EFA",
        "workspace.success.saved": "\u5DE5\u4F5C\u533A\u5DF2\u4FDD\u5B58",
        "workspace.success.deleted": "\u5DE5\u4F5C\u533A\u5DF2\u5220\u9664",
        "payment.success.simulate": "\u6A21\u62DF\u652F\u4ED8\u6210\u529F\uFF0C\u8BA2\u9605\u5DF2\u66F4\u65B0",
        "auth.forgot.demoMessage": "\u6682\u672A\u63A5\u5165\u771F\u5B9E\u90AE\u4EF6\u670D\u52A1\uFF1B\u8BF7\u4F7F\u7528\u6CE8\u518C\u90AE\u7BB1\u76F4\u63A5\u767B\u5F55\uFF0C\u6216\u8054\u7CFB\u7BA1\u7406\u5458\u91CD\u7F6E\u5BC6\u7801\u3002",
        "settings.kicker": "Settings Center",
        "settings.sidebar.title": "\u628A\u73AF\u5883\u8C03\u6210\u4F60\u987A\u624B\u7684\u6837\u5B50",
        "settings.sidebar.desc": "\u8FD9\u91CC\u96C6\u4E2D\u7BA1\u7406\u6A21\u578B\u63A5\u5165\u3001\u4E3B\u9898\u3001\u8BED\u8A00\u3001\u81EA\u52A8\u4FDD\u5B58\u548C\u5B9E\u9A8C\u80FD\u529B\u3002",
        "settings.section.current": "\u5F53\u524D\u5206\u533A",
        "settings.close": "\u5173\u95ED\u8BBE\u7F6E",
        "settings.tab.ai": "AI \u8BBE\u7F6E",
        "settings.tab.ai.desc": "\u6A21\u578B\u3001Key \u4E0E\u63A5\u5165\u65B9\u5F0F",
        "settings.tab.appearance": "\u5916\u89C2",
        "settings.tab.appearance.desc": "\u4E3B\u9898\u548C\u754C\u9762\u8BED\u8A00",
        "settings.tab.editor": "\u7F16\u8F91\u5668",
        "settings.tab.editor.desc": "\u4FDD\u5B58\u884C\u4E3A\u4E0E\u4E66\u5199\u4E60\u60EF",
        "settings.tab.features": "\u529F\u80FD",
        "settings.tab.features.desc": "\u5F53\u524D\u80FD\u529B\u4E0E\u6269\u5C55\u72B6\u6001",
        "settings.tab.advanced": "\u9AD8\u7EA7",
        "settings.tab.advanced.desc": "\u5B9E\u9A8C\u529F\u80FD\u4E0E\u91CD\u7F6E\u64CD\u4F5C",
        "settings.ai.provider": "AI \u63D0\u4F9B\u5546",
        "settings.ai.apiKey": "API Key",
        "settings.ai.model": "\u6A21\u578B",
        "settings.ai.endpoint": "\u672C\u5730\u7AEF\u70B9",
        "settings.ai.keyPlaceholder": "\u8F93\u5165\u4F60\u7684 API Key",
        "settings.ai.privacy": "\u9690\u79C1\u8BF4\u660E",
        "settings.ai.privacyText": "API Key \u4FDD\u5B58\u5728\u6D4F\u89C8\u5668\u672C\u5730\u3002\u9664\u4F60\u9009\u62E9\u7684\u6A21\u578B\u670D\u52A1\u5916\uFF0C\u5E94\u7528\u4E0D\u4F1A\u989D\u5916\u8F6C\u53D1\u5230\u5176\u4ED6\u7B2C\u4E09\u65B9\u670D\u52A1\u3002",
        "settings.ai.privacyGuest": " \u767B\u5F55\u8D26\u53F7\u540E\u53EF\u540C\u6B65\u4E91\u7AEF\u914D\u989D\u7EDF\u8BA1\u3002",
        "settings.theme": "\u4E3B\u9898",
        "settings.theme.light": "\u6D45\u8272",
        "settings.theme.lightDesc": "\u66F4\u9002\u5408\u767D\u5929\u4E0E\u6587\u6863\u9605\u8BFB",
        "settings.theme.dark": "\u6DF1\u8272",
        "settings.theme.darkDesc": "\u66F4\u805A\u7126\u4EE3\u7801\u4E0E\u591C\u95F4\u5DE5\u4F5C",
        "settings.uiLanguage": "\u754C\u9762\u8BED\u8A00",
        "settings.lang.zh": "\u7B80\u4F53\u4E2D\u6587",
        "settings.lang.en": "English",
        "settings.autosave": "\u81EA\u52A8\u4FDD\u5B58",
        "settings.autosave.desc": "\u5728\u4F60\u7F16\u8F91\u4EE3\u7801\u65F6\u81EA\u52A8\u4FDD\u5B58\u5230\u672C\u5730\u4E0E\u5DE5\u4F5C\u533A\u72B6\u6001\uFF0C\u51CF\u5C11\u8BEF\u5173\u9875\u9762\u5E26\u6765\u7684\u635F\u5931\u3002",
        "settings.autosave.aria": "\u81EA\u52A8\u4FDD\u5B58",
        "settings.tabCompletion.title": "Tab AI \u8865\u5168",
        "settings.tabCompletion.desc": "\u5728\u7F16\u8F91\u5668\u4E2D\u901A\u8FC7 Tab / \u5185\u8054\u8865\u5168\u63D2\u5165 AI \u5EFA\u8BAE\uFF08\u9700 BYOK\uFF09\u3002DeepSeek \u4F18\u5148\u8D70 FIM \u63A5\u53E3\uFF0C\u5176\u4ED6\u6A21\u578B\u8D70\u5BF9\u8BDD\u56DE\u9000\u3002",
        "settings.tabCompletion.maxLines": "\u8865\u5168\u6700\u5927\u884C\u6570",
        "settings.tabCompletion.maxLinesDesc": "\u5355\u6B21\u8865\u5168\u6700\u591A\u63D2\u5165\u7684\u884C\u6570\uFF081\uFF5E12\uFF09\u3002",
        "settings.editorPrefs": "\u7F16\u8F91\u504F\u597D",
        "settings.editorPrefs.desc": "\u5F53\u524D\u7248\u672C\u5148\u4FDD\u7559\u7B80\u6D01\u8BBE\u7F6E\uFF0C\u628A\u6700\u5E38\u7528\u7684\u81EA\u52A8\u4FDD\u5B58\u3001\u4E3B\u9898\u548C\u8BED\u8A00\u6536\u5728\u4E00\u5904\u3002\u540E\u7EED\u9002\u5408\u7EE7\u7EED\u8865\u5145\u5B57\u4F53\u3001\u7F29\u8FDB\u4E0E\u683C\u5F0F\u5316\u7B56\u7565\u3002",
        "settings.features.noticeTitle": "\u80FD\u529B\u8BF4\u660E",
        "settings.features.noticeDesc": "\u4E0B\u5217\u6761\u76EE\u63CF\u8FF0\u5F53\u524D\u4EA7\u54C1\u5DF2\u5177\u5907\u7684\u80FD\u529B\uFF0C\u4E0D\u662F\u72EC\u7ACB\u5F00\u5173\u3002MCP\u3001\u9879\u76EE\u89C4\u5219\u7B49\u53EF\u5728\u672C\u9875\u4E0B\u65B9\u914D\u7F6E\u5E76\u4FDD\u5B58\u3002",
        "settings.feature.review.title": "\u4EE3\u7801\u5BA1\u67E5",
        "settings.feature.review.desc": "AI \u9A71\u52A8\u7684\u8D28\u91CF\u5206\u6790\u4E0E\u5EFA\u8BAE",
        "settings.feature.completion.title": "\u667A\u80FD\u8865\u5168",
        "settings.feature.completion.desc": "\u8F85\u52A9\u751F\u6210\u548C\u8865\u5168\u5E38\u89C1\u4EE3\u7801\u7247\u6BB5",
        "settings.feature.collab.title": "\u5B9E\u65F6\u534F\u4F5C",
        "settings.feature.collab.desc": "Yjs + WebRTC \u623F\u95F4\u540C\u6B65\uFF08Beta\uFF0C\u975E\u751F\u4EA7\u7EA7 OT\uFF09",
        "settings.feature.perf.title": "\u6027\u80FD\u5206\u6790",
        "settings.feature.perf.desc": "\u67E5\u770B\u8FD0\u884C\u8F93\u51FA\u548C\u6027\u80FD\u8D8B\u52BF",
        "settings.feature.mcp.title": "MCP \u5DE5\u5177",
        "settings.feature.mcp.desc": "Agent \u53EF\u8C03\u7528\u5916\u90E8 Streamable HTTP MCP",
        "settings.feature.semantic.title": "\u8BED\u4E49\u68C0\u7D22\uFF08BYOK\uFF09",
        "settings.feature.semantic.desc": "\u5DE5\u4F5C\u533A\u6A21\u5F0F\u4E0B\uFF0C\u7528\u5F53\u524D\u6A21\u578B\u7684 Embedding API \u68C0\u7D22\u76F8\u5173\u4EE3\u7801\u7247\u6BB5\u6CE8\u5165\u5BF9\u8BDD\uFF08\u9075\u5FAA .gitignore \u4E0E\u7D22\u5F15\u4E0A\u9650\uFF09",
        "settings.semantic.onboarding.needKey": "\u8BED\u4E49\u68C0\u7D22\u9700\u8981\u5148\u586B\u5199 Embedding API Key\uFF08\u975E Ollama\uFF09\u3002\u586B\u597D\u540E\u518D\u6253\u5F00\u5F00\u5173\u3002",
        "settings.semantic.onboarding.enableHint": "\u5F00\u542F\u8BED\u4E49\u68C0\u7D22\u540E\uFF0C\u53EF\u5728\u5DE5\u4F5C\u533A\u5185\u7ED3\u5408 @ \u4E0E\u8BED\u4E49\u68C0\u7D22\u6CE8\u5165\u76F8\u5173\u4EE3\u7801\u7247\u6BB5\u3002\u5EFA\u8BAE\u5148\u5BFC\u5165\u9879\u76EE\u5E76\u7B49\u5F85\u7D22\u5F15\u5B8C\u6210\u3002",
        "settings.index.card.title": "\u7D22\u5F15\u4E0E @ \u641C\u7D22",
        "settings.index.card.desc": "\u7D22\u5F15\u5B8C\u6210\u540E\u53EF\u5728 Chat \u8F93\u5165 `@` \u9009\u62E9\u6587\u4EF6/\u7B26\u53F7\u6CE8\u5165\u4E0A\u4E0B\u6587\uFF1B\u7D22\u5F15\u53D7 .gitignore \u4E0E\u6587\u4EF6\u5927\u5C0F\u4E0A\u9650\u5F71\u54CD\u3002",
        "settings.index.retry": "\u91CD\u8BD5\u7D22\u5F15",
        "settings.index.limitLinkLabel": "\u6D4F\u89C8\u5668\u80FD\u529B\u8FB9\u754C",
        "settings.payload.card.title": "\u4E0A\u4E0B\u6587\u9884\u7B97\uFF08413 \u9884\u9632\uFF09",
        "settings.payload.card.desc": "\u53D1\u9001\u524D\u4F1A\u4F30\u7B97\u8BF7\u6C42\u4F53\uFF0C\u8D85\u9884\u7B97\u65F6\u5148\u63D0\u793A\u5E76\u63D0\u4F9B\u201C\u7CBE\u7B80\u540E\u53D1\u9001\u201D\u3002",
        "settings.payload.card.providerBudget": "\u5F53\u524D\u6A21\u578B\u9884\u7B97\uFF1A{provider} \u7EA6 {budgetKb}KB",
        "settings.payload.card.strategy": "\u81EA\u52A8\u7CBE\u7B80\u7B56\u7565\uFF1A\u5386\u53F2\u538B\u7F29\u3001\u8F93\u5165\u622A\u65AD\u3001\u4E34\u65F6\u5173\u95ED workspace/@ \u6CE8\u5165",
        "chat.mentionOnboardingTitle": "\u9996\u6B21 @ \u5F15\u5BFC",
        "chat.mentionOnboardingBody": "\u8F93\u5165 `@` \u9009\u62E9\u6587\u4EF6/\u7B26\u53F7\u4F1A\u6CE8\u5165\u4E0A\u4E0B\u6587\uFF1B\u82E5\u5217\u8868\u4E3A\u7A7A\uFF0C\u8BF7\u786E\u8BA4\u7D22\u5F15\u5DF2\u5B8C\u6210\u5E76\u7F29\u5C0F\u641C\u7D22\u8303\u56F4\u3002",
        "chat.mentionOnboardingDismiss": "\u77E5\u9053\u4E86",
        "chat.mentionBuildingBlocked": "\u7D22\u5F15\u6784\u5EFA\u4E2D\uFF0C\u8BF7\u7A0D\u540E\u518D\u7528 @ \u9009\u62E9\u6587\u4EF6/\u7B26\u53F7\u3002",
        "welcome.footer.release": "\u53D1\u884C\u8BF4\u660E",
        "settings.badge.enabled": "\u5DF2\u542F\u7528",
        "settings.badge.beta": "Beta",
        "settings.badge.experimental": "\u5B9E\u9A8C\u6027",
        "settings.advanced.caution": "\u8C28\u614E\u64CD\u4F5C",
        "settings.advanced.cautionDesc": "\u6E05\u7406\u672C\u5730\u7F13\u5B58\u6216\u6062\u590D\u9ED8\u8BA4\u7F16\u8F91\u5668\u8BBE\u7F6E\u3002\u4E0D\u4F1A\u5F71\u54CD Neon \u4E91\u7AEF\u8D26\u53F7\u4E0E\u5DE5\u4F5C\u533A\u3002",
        "settings.advanced.clear": "\u6E05\u7406\u672C\u5730\u6570\u636E",
        "settings.advanced.reset": "\u91CD\u7F6E\u9ED8\u8BA4\u8BBE\u7F6E",
        "settings.advanced.experimental": "\u5B9E\u9A8C\u529F\u80FD",
        "settings.advanced.experimentalDesc": "\u4E3A\u540E\u7EED\u8FED\u4EE3\u9884\u7559\u7684\u5165\u53E3\u3002\u7B49\u529F\u80FD\u6210\u719F\u540E\u518D\u5F00\u653E\u5B9E\u9645\u5F00\u5173\u3002",
        "settings.network.title": "\u7F51\u7EDC\u4E0E\u8BBF\u95EE",
        "settings.network.desc": "\u82E5\u7AD9\u70B9\u6253\u5F00\u6162\u6216\u767B\u5F55\u5931\u8D25\uFF0C\u53EF\u80FD\u662F\u56FD\u5185\u8BBF\u95EE vercel.app \u4E0D\u7A33\u5B9A\u3002\u53EF\u6362\u7F51\u7EDC\u91CD\u8BD5\u3001\u4F7F\u7528 BYOK \u672C\u5730\u7F16\u8F91\uFF0C\u6216\u5B89\u88C5 Windows \u684C\u9762\u7248\u3002\u7ED1\u5B9A\u81EA\u5B9A\u4E49\u57DF\u540D\u89C1 docs/CUSTOM_DOMAIN.md\u3002",
        "settings.badge.comingSoon": "\u6682\u672A\u5F00\u653E",
        "settings.footer.hint": "\u4FDD\u5B58\u540E\u7ACB\u5373\u5E94\u7528\u5230\u5F53\u524D\u5DE5\u4F5C\u533A\u3002",
        "settings.saveChanges": "\u4FDD\u5B58\u66F4\u6539",
        "subscription.title": "\u8BA2\u9605\u8BA1\u5212",
        "subscription.legalPayment": "\u4ED8\u8D39\u4E0E\u8BA2\u9605\u8BF4\u660E",
        "subscription.hero.title": "\u9009\u62E9\u66F4\u9002\u5408\u4F60\u7684\u5DE5\u4F5C\u8282\u594F",
        "subscription.hero.desc": "\u5F53\u524D\u8BA1\u5212{planSuffix}\u3002\u5347\u7EA7\u540E\u53EF\u4EE5\u83B7\u5F97\u66F4\u9AD8\u7684 AI \u914D\u989D\u3001\u66F4\u5927\u7684\u5DE5\u4F5C\u533A\u5BB9\u91CF\uFF0C\u4EE5\u53CA\u66F4\u5B8C\u6574\u7684\u534F\u4F5C\u4E0E\u7BA1\u7406\u80FD\u529B\u3002",
        "subscription.hero.planIs": "\u662F {name}",
        "subscription.hero.planActive": "\u5DF2\u542F\u7528",
        "subscription.plans.loadError": "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u5728\u7EBF\u5957\u9910\u4FE1\u606F\uFF0C\u5148\u4E3A\u4F60\u5C55\u793A\u9ED8\u8BA4\u65B9\u6848\u3002",
        "subscription.loginRequired": "\u8BF7\u5148\u767B\u5F55\u540E\u518D\u5347\u7EA7\u8BA2\u9605",
        "subscription.payFailed": "\u652F\u4ED8\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216\u7A0D\u540E\u91CD\u8BD5\u3002",
        "subscription.devUpgradeFailed": "\u5F00\u53D1\u6A21\u5F0F\u5347\u7EA7\u5931\u8D25",
        "subscription.payNotConfigured": "\u652F\u4ED8\u5C1A\u672A\u914D\u7F6E\uFF0C\u8BF7\u5728\u670D\u52A1\u7AEF\u8BBE\u7F6E\u652F\u4ED8\u5B9D\u6216\u5FAE\u4FE1\u5546\u6237\u53C2\u6570\u3002",
        "subscription.paySuccess": "\u652F\u4ED8\u6210\u529F\uFF0C\u8BA2\u9605\u5DF2\u66F4\u65B0",
        "subscription.paySuccessDetail": "\u5DF2\u6210\u529F\u5347\u7EA7\u4E3A {plan}\uFF0C\u914D\u989D\u5DF2\u540C\u6B65\u66F4\u65B0",
        "subscription.recommended": "\u63A8\u8350",
        "subscription.paymentMethods": "\u652F\u6301\u7684\u652F\u4ED8\u65B9\u5F0F",
        "subscription.unlimited": "\u65E0\u9650\u5236",
        "subscription.manage.title": "\u5F53\u524D\u8BA2\u9605",
        "subscription.manage.cancelScheduled": "\u5DF2\u5B89\u6392\u5728\u5468\u671F\u7ED3\u675F\u540E\u964D\u7EA7\u4E3A\u514D\u8D39\u7248",
        "subscription.manage.cancelUntil": "\uFF08{date} \u524D\u4ECD\u53EF\u4F7F\u7528 {plan}\uFF09",
        "subscription.manage.status": "\u72B6\u6001\uFF1A{status}",
        "subscription.manage.periodEnd": " \xB7 \u5F53\u524D\u5468\u671F\u81F3 {date}",
        "subscription.resume": "\u6062\u590D\u8BA2\u9605\u7EED\u8D39",
        "subscription.resuming": "\u6062\u590D\u4E2D\u2026",
        "subscription.cancelEnd": "\u5468\u671F\u7ED3\u675F\u540E\u53D6\u6D88",
        "subscription.processing": "\u5904\u7406\u4E2D\u2026",
        "subscription.downgradeNow": "\u7ACB\u5373\u964D\u7EA7\u514D\u8D39\u7248",
        "subscription.stripePortal": "Stripe \u8D26\u5355\u7BA1\u7406",
        "subscription.loading": "\u6B63\u5728\u52A0\u8F7D\u5957\u9910\u4FE1\u606F...",
        "subscription.currentPlan": "\u5F53\u524D\u8BA1\u5212",
        "subscription.limit.ai": "AI \u8BF7\u6C42",
        "subscription.limit.workspaces": "\u5DE5\u4F5C\u533A",
        "subscription.limit.storage": "\u5B58\u50A8\u7A7A\u95F4",
        "subscription.perDay": " / \u5929",
        "subscription.perMonth": "/\u6708",
        "subscription.unit.workspaces": " \u4E2A",
        "subscription.checkout.redirect": "\u8DF3\u8F6C\u652F\u4ED8...",
        "subscription.checkout.current": "\u5F53\u524D\u4F7F\u7528\u4E2D",
        "subscription.checkout.free": "\u7EE7\u7EED\u514D\u8D39\u4F7F\u7528",
        "subscription.checkout.cn": "\u652F\u4ED8\u5B9D / \u5FAE\u4FE1\u5347\u7EA7",
        "subscription.checkout.alipay": "\u652F\u4ED8\u5B9D\u5347\u7EA7",
        "subscription.checkout.wechat": "\u5FAE\u4FE1\u5347\u7EA7",
        "subscription.checkout.alipayHint": "\u5B89\u5168\u8DF3\u8F6C\u81F3\u652F\u4ED8\u5B9D\u6536\u94F6\u53F0\u5B8C\u6210\u4ED8\u6B3E",
        "subscription.checkout.upgrade": "\u7ACB\u5373\u5347\u7EA7",
        "subscription.checkout.beta": "\u516C\u6D4B\u514D\u8D39",
        "subscription.cancelFailed": "\u53D6\u6D88\u8BA2\u9605\u5931\u8D25",
        "subscription.cancelFailedRetry": "\u53D6\u6D88\u8BA2\u9605\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
        "subscription.resumeFailed": "\u6062\u590D\u8BA2\u9605\u5931\u8D25",
        "subscription.resumeFailedRetry": "\u6062\u590D\u8BA2\u9605\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
        "subscription.portalFailed": "\u65E0\u6CD5\u6253\u5F00 Stripe \u5BA2\u6237\u95E8\u6237",
        "subscription.portalPageFailed": "\u65E0\u6CD5\u6253\u5F00\u8D26\u5355\u7BA1\u7406\u9875\u9762",
        "subscription.updated": "\u8BA2\u9605\u72B6\u6001\u5DF2\u66F4\u65B0",
        "subscription.resumed": "\u8BA2\u9605\u5DF2\u6062\u590D",
        "subscription.plan.free.name": "\u514D\u8D39\u7248",
        "subscription.plan.free.desc": "\u4E2A\u4EBA\u5B66\u4E60\u4E0E\u65E5\u5E38\u5C0F\u9879\u76EE\uFF0C\u914D\u989D\u5DF2\u653E\u5BBD\u3002",
        "subscription.plan.free.f1": "\u57FA\u7840 AI \u5BF9\u8BDD",
        "subscription.plan.free.f2": "10 \u4E2A\u4E91\u5DE5\u4F5C\u533A",
        "subscription.plan.free.f3": "\u6BCF\u65E5 200 \u6B21\u914D\u989D",
        "subscription.plan.pro.name": "\u4E13\u4E1A\u7248",
        "subscription.plan.pro.desc": "\u9AD8\u9891\u4E2A\u4EBA\u5F00\u53D1\u8005\uFF0C\xA519/\u6708\u3002",
        "subscription.plan.pro.f1": "\u6BCF\u65E5 5000 \u6B21\u914D\u989D",
        "subscription.plan.pro.f2": "\u65E0\u9650\u5DE5\u4F5C\u533A",
        "subscription.plan.pro.f3": "\u652F\u4ED8\u5B9D\u5B89\u5168\u4ED8\u6B3E",
        "subscription.plan.enterprise.name": "\u56E2\u961F\u7248",
        "subscription.plan.enterprise.desc": "\u5C0F\u56E2\u961F\u4E0E\u91CD\u5EA6\u7528\u6237\uFF0C\xA549/\u6708\u3002",
        "subscription.plan.enterprise.f1": "\u914D\u989D\u4E0D\u9650",
        "subscription.plan.enterprise.f2": "\u65E0\u9650\u5DE5\u4F5C\u533A",
        "subscription.plan.enterprise.f3": "\u56E2\u961F\u80FD\u529B\uFF08\u89C4\u5212\uFF09",
        "command.placeholder": "\u547D\u4EE4 / \u6587\u4EF6\u540D\uFF0C\u6216 @ \u641C\u7D22\u7B26\u53F7\u4E0E\u6587\u4EF6",
        "command.empty.title": "\u6CA1\u6709\u627E\u5230\u5339\u914D\u547D\u4EE4",
        "command.empty.desc": "\u8BD5\u8BD5\u8F93\u5165\u6587\u4EF6\u540D\u3001\u529F\u80FD\u540D\uFF0C\u6216\u7528 @ \u641C\u7D22\u7B26\u53F7\uFF08\u5982 @login\uFF09\u3002",
        "command.footer.enter": "Enter \u6267\u884C",
        "command.footer.navigate": "\u2191\u2193 \u9009\u62E9",
        "command.footer.close": "ESC \u5173\u95ED",
        "command.cat.files": "\u6587\u4EF6",
        "command.cat.run": "\u8FD0\u884C",
        "command.cat.ai": "AI",
        "command.cat.collab": "\u534F\u4F5C",
        "command.cat.view": "\u89C6\u56FE",
        "command.cat.settings": "\u8BBE\u7F6E",
        "command.cat.npm": "npm scripts",
        "command.cat.index": "\u7D22\u5F15 (@)",
        "command.openFile": "\u6253\u5F00\u6587\u4EF6",
        "command.newFile": "\u65B0\u5EFA\u6587\u4EF6",
        "command.newFile.sub": "\u521B\u5EFA\u4E00\u4E2A\u7A7A\u767D\u6587\u4EF6",
        "command.newTemplate": "\u4ECE\u6A21\u677F\u65B0\u5EFA\u9879\u76EE",
        "command.newTemplate.sub": "React\u3001Node \u7B49 starter",
        "command.importFolder": "\u5BFC\u5165\u6587\u4EF6\u5939\u5230\u5DE5\u4F5C\u533A",
        "command.importFolder.sub": "\u6253\u5F00\u5BFC\u5165\u9762\u677F",
        "command.exportFile": "\u5BFC\u51FA\u5F53\u524D\u6587\u4EF6",
        "command.exportZip": "\u5BFC\u51FA\u9879\u76EE ZIP",
        "command.import": "\u5BFC\u5165\u6587\u4EF6\u6216\u9879\u76EE",
        "command.run": "\u8FD0\u884C\u4EE3\u7801",
        "command.run.sub": "\u6267\u884C\u5F53\u524D\u6587\u4EF6",
        "command.terminal": "\u663E\u793A\u6216\u9690\u85CF\u7EC8\u7AEF",
        "command.performance": "\u6027\u80FD\u5206\u6790",
        "command.performance.sub": "\u67E5\u770B\u4EE3\u7801\u6267\u884C\u8868\u73B0",
        "command.ai": "AI \u52A9\u624B",
        "command.ai.sub": "\u6253\u5F00\u5BF9\u8BDD\u9762\u677F",
        "command.review": "\u4EE3\u7801\u5BA1\u67E5",
        "command.review.sub": "\u68C0\u67E5\u4EE3\u7801\u8D28\u91CF\u4E0E\u98CE\u9669",
        "command.snippets": "\u4EE3\u7801\u7247\u6BB5\u5E93",
        "command.snippets.sub": "\u63D2\u5165\u5E38\u7528\u7247\u6BB5",
        "command.git": "Git \u9762\u677F",
        "command.git.sub": "\u67E5\u770B\u6539\u52A8\u4E0E\u5386\u53F2",
        "command.share": "\u5206\u4EAB\u9879\u76EE",
        "command.share.sub": "\u751F\u6210\u5FEB\u7167\u6216\u5BFC\u5165\u5206\u4EAB",
        "command.collab": "\u5B9E\u65F6\u534F\u4F5C",
        "command.collab.sub": "\u52A0\u5165\u5171\u4EAB\u623F\u95F4",
        "command.preview": "\u9884\u89C8\u9762\u677F",
        "command.preview.sub": "\u67E5\u770B HTML \u6216\u6587\u672C\u8F93\u51FA",
        "command.search": "\u5168\u5C40\u641C\u7D22",
        "command.search.sub": "\u5728\u6587\u4EF6\u4E2D\u67E5\u627E\u5185\u5BB9",
        "command.plugins": "\u63D2\u4EF6\u7BA1\u7406",
        "command.plugins.sub": "\u542F\u7528\u6216\u52A0\u8F7D\u6269\u5C55",
        "command.welcome": "\u8FD4\u56DE\u6B22\u8FCE\u9875",
        "command.welcome.sub": "\u5FEB\u901F\u5F00\u59CB\u3001\u6A21\u677F\u4E0E\u6700\u8FD1\u9879\u76EE",
        "command.settings": "\u8BBE\u7F6E\u4E2D\u5FC3",
        "command.settings.sub": "\u8C03\u6574\u7F16\u8F91\u5668\u4E0E AI \u914D\u7F6E",
        "command.themePicker": "\u4E3B\u9898\u9009\u62E9\u5668",
        "command.themePicker.sub": "\u6D4F\u89C8\u5168\u90E8\u7F16\u8F91\u5668\u4E3B\u9898",
        "command.themeToLight": "\u5207\u6362\u5230\u4EAE\u8272\u4E3B\u9898",
        "command.themeToDark": "\u5207\u6362\u5230\u6697\u8272\u4E3B\u9898",
        "command.autosaveOn": "\u5F00\u542F\u81EA\u52A8\u4FDD\u5B58",
        "command.autosaveOff": "\u5173\u95ED\u81EA\u52A8\u4FDD\u5B58",
        "command.index.workspace": "\u5DE5\u4F5C\u533A / \u7F16\u8F91\u5668\u6587\u4EF6",
        "mcp.loading": "\u6B63\u5728\u52A0\u8F7D MCP \u914D\u7F6E\u2026",
        "mcp.title": "MCP \u670D\u52A1\u5668",
        "mcp.desc": "\u901A\u8FC7 /api/mcp/proxy \u8FDE\u63A5 Streamable HTTP MCP\u3002\u672C\u5730 URL \u9700 dev:stack \u4E14\u5141\u8BB8 localhost\u3002",
        "mcp.empty": "\u5C1A\u672A\u914D\u7F6E MCP \u670D\u52A1\u5668\u3002\u6DFB\u52A0\u540E Agent \u53EF\u5728\u56DE\u590D\u4E2D\u4F7F\u7528 <<<mcp-tool>>> \u5757\u8C03\u7528\u5DE5\u5177\u3002",
        "mcp.displayName": "\u663E\u793A\u540D\u79F0",
        "mcp.enabled": "\u542F\u7528",
        "mcp.test": "\u6D4B\u8BD5",
        "mcp.add": "\u6DFB\u52A0 MCP \u670D\u52A1\u5668",
        "mcp.catalog.title": "\u5B98\u65B9\u63A8\u8350",
        "mcp.catalog.add": "\u6DFB\u52A0",
        "mcp.catalog.docs": "\u6587\u6863",
        "mcp.catalog.local.name": "\u672C\u5730 dev:stack",
        "mcp.catalog.local.desc": "npm run dev:stack \u540E\u6D4B\u8BD5\uFF1BURL \u9ED8\u8BA4 127.0.0.1:3001/mcp",
        "mcp.catalog.selfHosted.name": "\u81EA\u5EFA HTTP MCP",
        "mcp.catalog.selfHosted.desc": "\u586B\u5199\u4F60\u90E8\u7F72\u7684 Streamable HTTP \u7AEF\u70B9\uFF08HTTPS\uFF09",
        "mcp.catalog.community.name": "\u793E\u533A\u76EE\u5F55",
        "mcp.catalog.community.desc": "\u4ECE Smithery \u7B49\u9009\u53D6 HTTP \u517C\u5BB9\u670D\u52A1\u540E\u7C98\u8D34 URL",
        "mcp.followUp.title": "Agent \u81EA\u52A8\u8DDF\u8FDB",
        "mcp.followUp.checkbox": "\u5DE5\u5177\u8C03\u7528\u540E\u81EA\u52A8\u53D1\u8D77\u8DDF\u8FDB\u8F6E\u6B21\uFF08\u5C06\u7ED3\u679C\u53CD\u9988\u7ED9\u6A21\u578B\uFF09",
        "mcp.followUp.maxRounds": "\u6700\u5927\u8DDF\u8FDB\u8F6E\u6B21",
        "mcp.ping.checking": "\u68C0\u6D4B\u4E2D\u2026",
        "mcp.ping.ok": "\u5DF2\u8FDE\u63A5",
        "mcp.ping.fail": "\u8FDE\u63A5\u5931\u8D25",
        "rules.title": "\u9879\u76EE\u89C4\u5219",
        "rules.desc": "\u7F16\u8F91 .aide/rules.md \u6216 .cursorrules\uFF0C\u5185\u5BB9\u4F1A\u81EA\u52A8\u6CE8\u5165 Chat / Agent \u7684 system prompt\u3002",
        "rules.empty": "\u5C1A\u672A\u68C0\u6D4B\u5230\u89C4\u5219\u6587\u4EF6\u3002\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u5728\u7F16\u8F91\u5668\u4E2D\u521B\u5EFA\u6A21\u677F\u3002",
        "rules.open": "\u5728\u7F16\u8F91\u5668\u4E2D\u6253\u5F00\u89C4\u5219",
        "rules.create": "\u521B\u5EFA .aide/rules.md",
        "rules.injectedHint": "\u4FDD\u5B58\u540E\u81EA\u52A8\u6CE8\u5165 Chat / Agent \u7CFB\u7EDF\u63D0\u793A\uFF08\u8DEF\u5F84\uFF1A.aide/rules.md\uFF09",
        "tasks.title": "\u4EFB\u52A1\u6E05\u5355",
        "tasks.desc": "\u7F16\u8F91 .aide/tasks.md\uFF08Markdown \u590D\u9009\u6846\uFF09\uFF0C\u672A\u5B8C\u6210\u9879\u4F1A\u6CE8\u5165 Agent \u4E0A\u4E0B\u6587\uFF1B\u4E0B\u65B9\u4E3A\u9884\u89C8\u3002",
        "tasks.empty": "\u5C1A\u672A\u68C0\u6D4B\u5230\u4EFB\u52A1\u6587\u4EF6\u3002\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u5728\u7F16\u8F91\u5668\u4E2D\u521B\u5EFA\u6A21\u677F\u3002",
        "tasks.open": "\u5728\u7F16\u8F91\u5668\u4E2D\u6253\u5F00\u4EFB\u52A1",
        "tasks.create": "\u521B\u5EFA .aide/tasks.md",
        "tasks.summary": "\u8FDB\u5EA6 {done}/{total}\uFF08\u5269\u4F59 {open}\uFF09",
        "chat.needKey": "\u8BF7\u5148\u914D\u7F6E AI API Key\uFF0C\u6216\u8005\u5207\u6362\u5230\u672C\u5730 Ollama\uFF0C\u518D\u5F00\u59CB\u5BF9\u8BDD\u3002",
        "chat.quotaExceeded": "\u4ECA\u5929\u7684 AI \u8BF7\u6C42\u989D\u5EA6\u5DF2\u7528\u5B8C\uFF08{used}/{limit}\uFF09\u3002\n\n\u514D\u8D39\u7528\u6237\u6309\u5929\u9650\u989D\u4F7F\u7528\u3002\u7A0D\u540E\u518D\u8BD5\uFF0C\u6216\u8005\u5347\u7EA7\u5957\u9910\u4EE5\u83B7\u5F97\u66F4\u9AD8\u989D\u5EA6\u3002",
        "chat.needConfig": "\u8BF7\u5148\u5B8C\u6210 AI \u914D\u7F6E\uFF0C\u518D\u5F00\u59CB\u53D1\u6D88\u606F\u3002",
        "chat.requestFailed": "\u8BF7\u6C42\u5931\u8D25\uFF1A{message}\n\n\u4F60\u53EF\u4EE5\u68C0\u67E5\uFF1A\n- API Key \u662F\u5426\u6B63\u786E\n- \u7F51\u7EDC\u662F\u5426\u6B63\u5E38\n- \u5982\u679C\u4F7F\u7528 Ollama\uFF0C\u672C\u5730\u670D\u52A1\u662F\u5426\u5DF2\u542F\u52A8",
        "chat.unknownError": "\u672A\u77E5\u9519\u8BEF",
        "chat.sessionTitle": "\u5F53\u524D AI \u4F1A\u8BDD",
        "chat.noModel": "\u672A\u6307\u5B9A\u6A21\u578B",
        "chat.configured": "\u5DF2\u914D\u7F6E",
        "chat.pendingConfig": "\u5F85\u914D\u7F6E",
        "chat.quotaToday": "\u4ECA\u65E5\u7528\u91CF",
        "chat.agentModeTitle": "Agent \u6A21\u5F0F\uFF1A\u81EA\u52A8\u89E3\u6790\u591A\u6587\u4EF6\u6539\u52A8\u5E76\u5199\u5165\u7F16\u8F91\u5668",
        "chat.agentOn": "Agent \u5F00",
        "chat.agent": "Agent",
        "chat.workspaceEmpty": "\u5148\u5728\u5DE5\u4F5C\u533A\u4E2D\u5BFC\u5165\u6587\u4EF6\uFF0C\u624D\u80FD\u542F\u7528\u5B8C\u6574\u4E0A\u4E0B\u6587\u3002",
        "chat.workspaceSelected": "\u5DF2\u9009\u62E9 {count} \u4E2A\u5DE5\u4F5C\u533A\u6587\u4EF6",
        "chat.workspaceCtx": "\u5DE5\u4F5C\u533A\u4E0A\u4E0B\u6587",
        "chat.indexOk": "\u5DF2\u7D22\u5F15 {count} \u4E2A\u6587\u4EF6\uFF08@ \u4E0E\u8BED\u4E49\u68C0\u7D22\uFF09",
        "chat.indexCapped": "\u5DF2\u7D22\u5F15 {indexed}/{eligible} \u4E2A\u6587\u4EF6\uFF08\u5DF2\u8FBE\u4E0A\u9650\uFF0C\u5927\u6587\u4EF6\u5DF2\u8DF3\u8FC7\uFF09",
        "chat.indexHintTitle": "\u7B26\u53F7\u7D22\u5F15\u4E0E\u8BED\u4E49\u68C0\u7D22\u9075\u5FAA .gitignore \u4E0E\u6587\u4EF6\u5927\u5C0F\u4E0A\u9650",
        "chat.indexBuilding": "\u6B63\u5728\u66F4\u65B0\u9879\u76EE\u7D22\u5F15\u2026",
        "chat.indexBuildingProgress": "\u6B63\u5728\u7D22\u5F15 {indexed}/{total} \u4E2A\u6587\u4EF6\u2026",
        "chat.indexError": "\u7D22\u5F15\u5931\u8D25\uFF1A{message}",
        "chat.indexRetry": "\u91CD\u8BD5",
        "chat.thinking": "\u601D\u8003\u4E2D",
        "chat.agentChanges": "Agent \u5EFA\u8BAE\u4FEE\u6539 {count} \u4E2A\u6587\u4EF6\uFF1A{paths}",
        "chat.ignore": "\u5FFD\u7565",
        "chat.preview": "\u9884\u89C8\u53D8\u66F4",
        "chat.apply": "\u76F4\u63A5\u5E94\u7528",
        "chat.inputPlaceholder": "\u8F93\u5165\u6D88\u606F\uFF1B@ \u6587\u4EF6\u6216\u7B26\u53F7\uFF08\u4F1A\u6CE8\u5165\u4E0A\u4E0B\u6587\uFF09\uFF1BEnter \u53D1\u9001",
        "chat.inputPlaceholderNoConfig": "\u8BF7\u5148\u914D\u7F6E API Key \u6216\u672C\u5730 Ollama",
        "chat.stop": "\u505C\u6B62\u751F\u6210",
        "chat.sendButton": "\u53D1\u9001",
        "chat.send.explain": "\u8BF7\u89E3\u91CA\u8FD9\u6BB5\u4EE3\u7801\u3002",
        "chat.send.refactor": "\u8BF7\u91CD\u6784\u8FD9\u6BB5\u4EE3\u7801\u3002",
        "chat.send.fix": "\u8BF7\u4F18\u5316\u8FD9\u6BB5\u4EE3\u7801\u7684\u5B9E\u73B0\u548C\u6027\u80FD\u3002",
        "chat.send.generate": "\u57FA\u4E8E\u5F53\u524D\u4EE3\u7801\uFF0C\u751F\u6210\u4E00\u4E2A\u76F8\u5173\u7684\u65B0\u529F\u80FD\u3002",
        "chat.prompt.userRequest": "\u7528\u6237\u8BF7\u6C42\uFF1A{action}",
        "chat.prompt.editorFile": "\u5F53\u524D\u7F16\u8F91\u5668\u6587\u4EF6:\n```\n{code}\n```",
        "chat.system.default": "\u4F60\u662F\u4E00\u540D\u4E13\u4E1A\u7684\u7F16\u7A0B\u52A9\u624B\u3002\u5F53\u524D\u4EE3\u7801\u5982\u4E0B\uFF1A\n\n```\n{code}\n```\n\n\u8BF7\u6839\u636E\u7528\u6237\u7684\u95EE\u9898\u7ED9\u51FA\u6E05\u6670\u53EF\u6267\u884C\u7684\u5E2E\u52A9\u3002\u5982\u679C\u9700\u8981\u8FD4\u56DE\u4EE3\u7801\uFF0C\u8BF7\u5C3D\u91CF\u6807\u6CE8\u6587\u4EF6\u540D\uFF0C\u5E76\u8F93\u51FA\u5B8C\u6574\u4EE3\u7801\u5757\u3002",
        "chat.mcp.followUp": "MCP \u5DE5\u5177\u5DF2\u6267\u884C\uFF0C\u7ED3\u679C\u5982\u4E0B\u3002\u8BF7\u7EE7\u7EED\u5B8C\u6210\u4EFB\u52A1\uFF1B\u82E5\u8FD8\u9700\u8C03\u7528\u5DE5\u5177\uFF0C\u53EF\u518D\u8F93\u51FA <<<mcp-tool>>> \u5757\u3002\n\n{log}",
        "chat.mcp.results": "**MCP \u5DE5\u5177\u7ED3\u679C**",
        "chat.agentToolsActive": "\u5DE5\u5177 Agent\uFF08\u591A\u8F6E\u8BFB\u5199\uFF09",
        "chat.agentActivityTitle": "Agent \u6D3B\u52A8",
        "chat.subscriptionExpired": "\u4E13\u4E1A\u7248\u8BA2\u9605\u5DF2\u5230\u671F\uFF0C\u5DF2\u6062\u590D\u4E3A\u514D\u8D39\u7248\u6BCF\u65E5\u914D\u989D\u3002\u7EED\u8D39\u53EF\u5728\u8BBE\u7F6E\u6216\u300C\u67E5\u770B\u5957\u9910\u300D\u4E2D\u5B8C\u6210\u3002",
        "agent.settings.loading": "\u52A0\u8F7D Agent \u8BBE\u7F6E\u2026",
        "agent.settings.title": "Agent \u5DE5\u5177\u5FAA\u73AF",
        "agent.settings.desc": "\u50CF Cursor \u4E00\u6837\u901A\u8FC7 list/read/write \u5DE5\u5177\u591A\u8F6E\u6539\u9879\u76EE\uFF1BDeepSeek \u7B49 OpenAI \u517C\u5BB9\u6A21\u578B\u53EF\u7528\u3002",
        "agent.settings.useTools": "\u542F\u7528\u5DE5\u5177\u5FAA\u73AF",
        "agent.settings.useToolsDesc": "\u5173\u95ED\u540E Agent \u6A21\u5F0F\u4ECD\u7528 Markdown \u4EE3\u7801\u5757\u89E3\u6790\uFF08\u65E7\u884C\u4E3A\uFF09\u3002",
        "agent.settings.autoApply": "\u81EA\u52A8\u5E94\u7528\u5199\u5165",
        "agent.settings.autoApplyDesc": "\u5173\u95ED\u65F6 write_file \u5148\u8FDB\u5165 Diff \u9884\u89C8\uFF0C\u786E\u8BA4\u540E\u518D\u5199\u5165\u7F16\u8F91\u5668\u4E0E\u672C\u5730\u76EE\u5F55\u3002",
        "agent.settings.maxRounds": "\u6700\u5927\u5DE5\u5177\u8F6E\u6570",
        "agent.settings.maxRoundsDesc": "\u6BCF\u8F6E\u8BA1\u4E00\u6B21 AI \u8BF7\u6C42\u989D\u5EA6\uFF1B\u5EFA\u8BAE 8\uFF5E12\u3002",
        "agent.settings.terminalContext": "\u6CE8\u5165\u7EC8\u7AEF\u6700\u8FD1\u8F93\u51FA",
        "agent.settings.terminalContextDesc": "\u5C06\u96C6\u6210\u7EC8\u7AEF\u6700\u8FD1\u82E5\u5E72\u884C\u5199\u5165 Chat/Agent \u4E0A\u4E0B\u6587\uFF08\u53EA\u8BFB\u6458\u8981\uFF0C\u975E Cascade\uFF09",
        "agent.settings.terminalLines": "\u7EC8\u7AEF\u884C\u6570\u4E0A\u9650",
        "agent.tool.list_files": "\u5217\u51FA\u6587\u4EF6",
        "agent.tool.read_file": "\u8BFB\u53D6",
        "agent.tool.write_file": "\u5199\u5165",
        "agent.tool.search_repo": "\u641C\u7D22",
        "agent.tool.grep_repo": "\u5185\u5BB9\u641C\u7D22",
        "agent.tool.run_command": "\u8FD0\u884C\u547D\u4EE4",
        "agent.tool.move_file": "\u79FB\u52A8/\u91CD\u547D\u540D\u6587\u4EF6",
        "agent.tool.delete_file": "\u5220\u9664\u6587\u4EF6",
        "agent.tool.create_dir": "\u65B0\u5EFA\u76EE\u5F55",
        "agent.tool.lineOk": "\u2713 {tool} {detail}",
        "agent.tool.lineFail": "\u2717 {tool} {detail}",
        "agent.tool.truncated": "\uFF08\u8F93\u51FA\u5DF2\u622A\u65AD\uFF09",
        "agent.toolPanel.title": "Agent \u5DE5\u5177\u8C03\u7528",
        "agent.toolPanel.failed": "\u9879\u5931\u8D25",
        "agent.error.toolsUnsupported": "\u5F53\u524D\u6A21\u578B ({provider}) \u4E0D\u652F\u6301\u5DE5\u5177\u5FAA\u73AF\uFF0C\u5DF2\u56DE\u9000 Markdown Agent\u3002",
        "quota.today": "\u4ECA\u65E5 AI \u7528\u91CF",
        "quota.exhausted": "\u4ECA\u65E5\u989D\u5EA6\u5DF2\u7528\u5B8C\uFF0C\u8BF7\u660E\u5929\u518D\u8BD5\u6216\u5347\u7EA7\u5957\u9910\u3002",
        "quota.unlimitedPlan": "\u5F53\u524D\u8BA1\u5212\u914D\u989D\u4E0D\u9650\u3002",
        "quota.remaining": "\u5269\u4F59\u7EA6 {count} \u6B21",
        "quota.plan": "\u8BA1\u5212",
        "sidebar.filenamePlaceholder": "\u8F93\u5165\u6587\u4EF6\u540D\uFF0C\u4F8B\u5982 index.ts",
        "sidebar.create": "\u521B\u5EFA",
        "sidebar.deleteFile": "\u5220\u9664\u6587\u4EF6",
        "plugin.ok": "\u786E\u5B9A",
        "plugin.close": "\u5173\u95ED",
        "plugin.title": "\u63D2\u4EF6\u7BA1\u7406",
        "plugin.builtin": "\u5185\u7F6E",
        "plugin.running": "\u8FD0\u884C\u4E2D",
        "plugin.author": "\u4F5C\u8005\uFF1A{name}",
        "plugin.permissions": "\u6743\u9650\uFF1A{perms}",
        "plugin.disable": "\u505C\u7528",
        "plugin.enable": "\u542F\u7528",
        "plugin.disabled": "\u63D2\u4EF6\u5DF2\u505C\u7528\u3002",
        "plugin.enabled": "\u63D2\u4EF6\u5DF2\u542F\u7528\u3002",
        "plugin.enableFailed": "\u63D2\u4EF6\u542F\u7528\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6743\u9650\u4E0E\u517C\u5BB9\u6027\u3002",
        "plugin.loadFailed": "\u63D2\u4EF6\u52A0\u8F7D\u5931\u8D25",
        "plugin.storageFailed": "\u63D2\u4EF6\u5DF2\u52A0\u8F7D\u4F46\u672A\u80FD\u5199\u5165\u672C\u5730\u5B58\u50A8",
        "plugin.installed": "\u63D2\u4EF6\u5DF2\u5B89\u88C5\u5E76\u901A\u8FC7\u6C99\u7BB1\u6821\u9A8C\u3002",
        "plugin.installFailed": "\u5B89\u88C5\u5931\u8D25",
        "plugin.flash.marketInstalled": "\u5DF2\u4ECE\u63D2\u4EF6\u5E02\u573A\u5B89\u88C5\uFF0C\u53EF\u5728\u300C\u5DF2\u5B89\u88C5\u300D\u4E2D\u542F\u7528\u3002",
        "plugin.removed": "\u63D2\u4EF6\u5DF2\u79FB\u9664\u3002",
        "plugin.hero.title": "\u628A IDE \u62FC\u6210\u66F4\u8D34\u5408\u4F60\u5DE5\u4F5C\u65B9\u5F0F\u7684\u5DE5\u5177",
        "plugin.hero.desc": "\u5185\u7F6E\u63D2\u4EF6\u3001\u5B98\u65B9\u5E02\u573A\u76EE\u5F55\u4E0E\u624B\u52A8 JSON \u5B89\u88C5\u3002\u7B2C\u4E09\u65B9\u63D2\u4EF6\u5728 Worker \u6C99\u7BB1\u4E2D\u8FD0\u884C\uFF0C\u5E76\u53D7\u6743\u9650\u4EE4\u724C\u7EA6\u675F\u3002",
        "plugin.count.installed": "{count} \u4E2A\u5DF2\u5B89\u88C5",
        "plugin.count.running": "{count} \u4E2A\u8FD0\u884C\u4E2D",
        "plugin.count.market": "{count} \u4E2A\u5E02\u573A\u6761\u76EE",
        "plugin.footer": "\u63D2\u4EF6\u7CFB\u7EDF v1.1 \xB7 \u6C99\u7BB1 + \u5B98\u65B9\u76EE\u5F55",
        "plugin.repo": "\u4ED3\u5E93\u8BF4\u660E",
        "plugin.tab.installed": "\u5DF2\u5B89\u88C5",
        "plugin.tab.market": "\u63D2\u4EF6\u5E02\u573A",
        "plugin.tab.manual": "\u624B\u52A8\u5B89\u88C5",
        "plugin.empty": "\u8FD8\u6CA1\u6709\u63D2\u4EF6\u3002\u6253\u5F00\u300C\u63D2\u4EF6\u5E02\u573A\u300D\u5B89\u88C5\u5B98\u65B9\u793A\u4F8B\u3002",
        "plugin.official": "\u5B98\u65B9",
        "plugin.badge.installed": "\u5DF2\u5B89\u88C5",
        "plugin.install": "\u5B89\u88C5",
        "plugin.manual.desc": "\u7C98\u8D34\u63D2\u4EF6 JSON\uFF08manifest + source\uFF09\u3002\u5F00\u53D1\u73AF\u5883\u53EF\u5B89\u88C5\u4EFB\u610F\u901A\u8FC7\u6821\u9A8C\u7684\u5305\uFF1B\u751F\u4EA7\u73AF\u5883\u9ED8\u8BA4\u7981\u7528\u624B\u52A8\u7B2C\u4E09\u65B9 JSON\u3002",
        "plugin.manual.install": "\u5B89\u88C5\u63D2\u4EF6",
        "plugin.manual.sample": "\u52A0\u8F7D\u793A\u4F8B JSON",
        "empty.files.title": "\u8FD9\u91CC\u8FD8\u6CA1\u6709\u6587\u4EF6",
        "empty.files.desc": "\u65B0\u5EFA\u4E00\u4E2A\u6587\u4EF6\u5F00\u59CB\u7F16\u7801\uFF0C\u6216\u8005\u628A\u73B0\u6709\u9879\u76EE\u5BFC\u5165\u8FDB\u6765\u3002",
        "empty.files.new": "\u65B0\u5EFA\u6587\u4EF6",
        "empty.files.import": "\u5BFC\u5165\u6587\u4EF6",
        "empty.files.tip1": "\u652F\u6301\u62D6\u62FD\u5BFC\u5165",
        "empty.files.tip2": "\u652F\u6301\u6A21\u677F\u5FEB\u901F\u5F00\u59CB",
        "empty.files.tip3": "\u5FEB\u6377\u952E Ctrl+N \u65B0\u5EFA\u6587\u4EF6",
        "empty.search.title": "\u5F00\u59CB\u641C\u7D22\u9879\u76EE\u5185\u5BB9",
        "empty.search.desc": "\u8F93\u5165\u5173\u952E\u8BCD\uFF0C\u5728\u5F53\u524D\u9879\u76EE\u4E2D\u67E5\u627E\u6587\u4EF6\u540D\u6216\u4EE3\u7801\u7247\u6BB5\u3002",
        "empty.search.tip1": "\u652F\u6301\u5168\u5C40\u641C\u7D22",
        "empty.search.tip2": "\u652F\u6301\u66FF\u6362",
        "empty.search.tip3": "\u5FEB\u6377\u952E Ctrl+Shift+F \u6253\u5F00",
        "empty.terminal.title": "\u7EC8\u7AEF\u5DF2\u51C6\u5907\u597D",
        "empty.terminal.desc": "\u53EF\u4EE5\u76F4\u63A5\u8FD0\u884C Node.js \u547D\u4EE4\uFF0C\u6216\u5728\u8FD9\u91CC\u89C2\u5BDF\u9879\u76EE\u8F93\u51FA\u3002",
        "empty.git.title": "Git \u9762\u677F\u7B49\u5F85\u9879\u76EE\u63A5\u5165",
        "empty.git.desc": "\u6253\u5F00\u4ED3\u5E93\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u53D8\u66F4\u3001\u63D0\u4EA4\u548C\u7248\u672C\u64CD\u4F5C\u3002",
        "empty.workspace.title": "\u5DE5\u4F5C\u533A\u8FD8\u662F\u7A7A\u7684",
        "empty.workspace.desc": "\u4E0A\u4F20\u9879\u76EE\u6587\u4EF6\u5939\uFF0C\u8BA9 AI \u548C\u7F16\u8F91\u5668\u4E00\u8D77\u7406\u89E3\u5B8C\u6574\u4E0A\u4E0B\u6587\u3002",
        "empty.workspace.upload": "\u4E0A\u4F20\u6587\u4EF6\u5939",
        "feedback.closeToast": "\u5173\u95ED\u63D0\u793A",
        "common.confirm": "\u786E\u8BA4",
        "common.ok": "\u786E\u5B9A",
        "confirm.clearData.title": "\u6E05\u7406\u672C\u5730\u6570\u636E",
        "confirm.clearData.message": "\u5C06\u6E05\u9664\u6D4F\u89C8\u5668\u4E2D\u7684\u9879\u76EE\u7F13\u5B58\u3001\u8BBE\u7F6E\u4E0E IndexedDB\u3002\u4E91\u7AEF\u8D26\u53F7\u6570\u636E\u4E0D\u53D7\u5F71\u54CD\u3002",
        "confirm.clearData.confirm": "\u6E05\u7406",
        "confirm.reset.title": "\u91CD\u7F6E\u9ED8\u8BA4\u8BBE\u7F6E",
        "confirm.reset.message": "\u5C06\u6062\u590D\u4E3B\u9898\u3001\u81EA\u52A8\u4FDD\u5B58\u4E0E AI \u914D\u7F6E\u4E3A\u9ED8\u8BA4\u503C\uFF08\u4E0D\u5220\u9664\u5DE5\u4F5C\u533A\u6587\u4EF6\u5217\u8868\uFF09\u3002",
        "confirm.reset.confirm": "\u91CD\u7F6E",
        "notify.signedIn": "\u5DF2\u767B\u5F55\uFF1A{email}",
        "notify.localCleared": "\u672C\u5730\u6570\u636E\u5DF2\u6E05\u7406",
        "notify.localClearedDetail": "\u5EFA\u8BAE\u5237\u65B0\u9875\u9762\u540E\u91CD\u65B0\u767B\u5F55\u3002",
        "notify.clearFailed": "\u6E05\u7406\u5931\u8D25",
        "notify.clearFailedDetail": "\u8BF7\u5C1D\u8BD5\u5728\u6D4F\u89C8\u5668\u8BBE\u7F6E\u4E2D\u624B\u52A8\u6E05\u9664\u7AD9\u70B9\u6570\u636E\u3002",
        "notify.defaultsRestored": "\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E",
        "notify.workspaceLoaded": "\u5DE5\u4F5C\u533A\u5DF2\u52A0\u8F7D",
        "notify.workspaceLoadedDetail": "\u5171 {count} \u4E2A\u6587\u4EF6\u3002",
        "notify.autosaveOn": "\u81EA\u52A8\u4FDD\u5B58\u5DF2\u5F00\u542F",
        "notify.autosaveOff": "\u81EA\u52A8\u4FDD\u5B58\u5DF2\u5173\u95ED",
        "notify.projectOpenFailed": "\u65E0\u6CD5\u6253\u5F00\u9879\u76EE",
        "notify.projectOpenFailedDetail": "\u672A\u627E\u5230\u8BE5\u5DE5\u4F5C\u533A\uFF0C\u8BF7\u4ECE\u5DE5\u4F5C\u533A\u7BA1\u7406\u91CD\u65B0\u4FDD\u5B58\u6216\u52A0\u8F7D",
        "notify.projectOpened": "\u9879\u76EE\u5DF2\u6253\u5F00",
        "notify.testFileAdded": "\u6D4B\u8BD5\u6587\u4EF6\u5DF2\u6DFB\u52A0",
        "runtime.status.error": "\u8FD0\u884C\u73AF\u5883\u5F02\u5E38",
        "runtime.status.running": "\u8FD0\u884C\u4E2D",
        "runtime.status.ready": "\u8FD0\u884C\u73AF\u5883\u5DF2\u5C31\u7EEA",
        "runtime.status.loading": "\u6B63\u5728\u51C6\u5907\u8FD0\u884C\u73AF\u5883",
        "runtime.status.notReady": "\u8FD0\u884C\u73AF\u5883\u672A\u5C31\u7EEA",
        "editor.runtimeFailed": "\u8FD0\u884C\u73AF\u5883\u542F\u52A8\u5931\u8D25",
        "editor.runtimeRetry": "\u91CD\u8BD5",
        "editor.restarting": "\u6B63\u5728\u91CD\u65B0\u542F\u52A8\u8FD0\u884C\u73AF\u5883",
        "editor.meta.lines": "{count} \u884C",
        "editor.meta.chars": "{count} \u5B57\u7B26",
        "editor.action.snippet": "\u7247\u6BB5",
        "editor.action.review": "\u5BA1\u67E5",
        "editor.action.terminal": "\u7EC8\u7AEF",
        "editor.action.hideTerminal": "\u9690\u85CF\u7EC8\u7AEF",
        "editor.action.snippetTitle": "\u6253\u5F00\u4EE3\u7801\u7247\u6BB5\u5E93",
        "editor.action.reviewTitle": "AI \u4EE3\u7801\u5BA1\u67E5",
        "editor.action.terminalTitle": "\u663E\u793A\u7EC8\u7AEF",
        "notify.aiSettingsSaved": "AI \u8BBE\u7F6E\u5DF2\u4FDD\u5B58",
        "notify.aiSettingsSavedDetail": "{provider} / {model}",
        "notify.templateApplied": "\u6A21\u677F\u5DF2\u5E94\u7528",
        "notify.templateAppliedDetail": "\u5DF2\u751F\u6210 {count} \u4E2A\u6587\u4EF6\u3002",
        "notify.themeSwitched": "\u4E3B\u9898\u5DF2\u5207\u6362",
        "notify.themeLight": "\u6D45\u8272\u6A21\u5F0F",
        "notify.themeDark": "\u6DF1\u8272\u6A21\u5F0F",
        "notify.runtimeInit": "\u8FD0\u884C\u73AF\u5883\u4ECD\u5728\u521D\u59CB\u5316",
        "notify.runtimeInitFile": "WebContainer \u51C6\u5907\u597D\u540E\u5373\u53EF\u8FD0\u884C\u5F53\u524D\u6587\u4EF6\u3002",
        "notify.runtimeInitNpm": "WebContainer \u51C6\u5907\u597D\u540E\u5373\u53EF\u8FD0\u884C npm scripts\u3002",
        "notify.runComplete": "\u8FD0\u884C\u5B8C\u6210",
        "notify.runFailed": "\u8FD0\u884C\u5931\u8D25",
        "notify.runExitCode": "\u8FDB\u7A0B\u9000\u51FA\u7801\uFF1A{code}",
        "notify.commandFailed": "\u547D\u4EE4\u6267\u884C\u5931\u8D25",
        "notify.scriptFailed": "\u811A\u672C\u6267\u884C\u5931\u8D25",
        "notify.scriptRan": "\u811A\u672C\u5DF2\u6267\u884C",
        "notify.scriptRanDetail": "npm run {script}",
        "notify.filesImported": "\u6587\u4EF6\u5DF2\u5BFC\u5165",
        "notify.filesImportedDetail": "\u5171\u5BFC\u5165 {count} \u4E2A\u6587\u4EF6\u3002",
        "notify.fileExists": "\u6587\u4EF6\u5DF2\u5B58\u5728",
        "notify.fileExistsDetail": "\u8BF7\u6362\u4E00\u4E2A\u6587\u4EF6\u540D\u540E\u518D\u521B\u5EFA\u3002",
        "notify.fileCreated": "\u6587\u4EF6\u5DF2\u521B\u5EFA",
        "notify.keepOneFile": "\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u6587\u4EF6",
        "notify.keepOneFileDetail": "\u5F53\u524D\u5DE5\u4F5C\u533A\u9700\u8981\u4FDD\u7559\u4E00\u4E2A\u53EF\u7F16\u8F91\u6587\u4EF6\u3002",
        "notify.fileDeleted": "\u6587\u4EF6\u5DF2\u5220\u9664",
        "notify.fileExported": "\u6587\u4EF6\u5DF2\u5BFC\u51FA",
        "notify.zipExported": "\u9879\u76EE ZIP \u5DF2\u5BFC\u51FA",
        "notify.zipExportedDetail": "{count} \u4E2A\u6587\u4EF6\u5DF2\u6253\u5305\u3002",
        "notify.zipExportFailed": "\u5BFC\u51FA ZIP \u5931\u8D25",
        "notify.zipPackFailed": "\u6253\u5305\u5931\u8D25",
        "notify.sessionExpired": "\u767B\u5F55\u5DF2\u8FC7\u671F",
        "notify.sessionExpiredDetail": "\u8BF7\u91CD\u65B0\u767B\u5F55\u4EE5\u7EE7\u7EED\u540C\u6B65\u5DE5\u4F5C\u533A\u4E0E\u8BA2\u9605\u72B6\u6001\u3002",
        "notify.apiUnavailable": "\u4E91\u670D\u52A1\u6682\u4E0D\u53EF\u7528",
        "notify.apiUnavailableDetail": "\u6570\u636E\u5E93\u6216 API \u672A\u5C31\u7EEA\u3002\u82E5\u5DF2\u90E8\u7F72\uFF0C\u8BF7\u68C0\u67E5 Vercel \u7684 DATABASE_URL \u4E0E AUTH_SECRET\u3002",
        "notify.apiError": "\u670D\u52A1\u5668\u9519\u8BEF",
        "notify.apiErrorDetail": "\u8BF7\u6C42\u5931\u8D25\uFF08HTTP {status}\uFF09\u3002\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u8054\u7CFB\u7EF4\u62A4\u8005\u3002",
        "notify.subscriptionSuccess": "\u8BA2\u9605\u6210\u529F",
        "notify.subscriptionSyncing": "\u652F\u4ED8\u5DF2\u5B8C\u6210\uFF0C\u8BA1\u5212\u540C\u6B65\u4E2D\uFF08\u5F53\u524D\u663E\u793A\uFF1A{plan}\uFF09\u3002\u82E5\u672A\u66F4\u65B0\u8BF7\u5237\u65B0\u9875\u9762\u3002",
        "notify.subscriptionCurrentPlan": "\u5F53\u524D\u8BA1\u5212\uFF1A{plan}",
        "notify.subscriptionCanceled": "\u7ED3\u8D26\u5DF2\u53D6\u6D88",
        "notify.subscriptionCanceledDetail": "\u4F60\u4ECD\u53EF\u7EE7\u7EED\u4F7F\u7528\u5F53\u524D\u8BA1\u5212\u3002",
        "notify.subscriptionUpdated": "\u8BA2\u9605\u4FE1\u606F\u5DF2\u66F4\u65B0",
        "notify.quotaExceeded": "\u4ECA\u65E5 AI \u989D\u5EA6\u5DF2\u7528\u5B8C",
        "notify.quotaExceededDetail": "\u5DF2\u7528 {used}/{limit}\u3002\u7A0D\u540E\u518D\u8BD5\u6216\u5347\u7EA7\u5957\u9910\u3002",
        "notify.autosaveProjectName": "\u5DE5\u4F5C\u533A\uFF08{count} \u4E2A\u6587\u4EF6\uFF09",
        "wm.title": "\u5DE5\u4F5C\u533A\u7BA1\u7406",
        "wm.hero.title": "\u4FDD\u5B58\u9636\u6BB5\u6210\u679C\uFF0C\u4E5F\u7ED9\u6062\u590D\u7559\u540E\u8DEF",
        "wm.hero.loggedIn": "\u5DF2\u767B\u5F55\uFF1A\u4FDD\u5B58\u4F1A\u540C\u6B65\u5230\u4E91\u7AEF\uFF08\u5E76\u4FDD\u7559\u672C\u5730\u526F\u672C\uFF09\u3002\u5217\u8868\u4E2D\u5E26\u300C\u4E91\u7AEF\u300D\u6807\u8BB0\u7684\u6761\u76EE\u6765\u81EA\u670D\u52A1\u5668\u3002",
        "wm.hero.guest": "\u8FD9\u91CC\u53EF\u4EE5\u4FDD\u5B58\u5F53\u524D\u5DE5\u4F5C\u533A\u3001\u5BFC\u5165\u65E7\u5907\u4EFD\u3001\u5BFC\u51FA\u5168\u90E8\u6570\u636E\uFF0C\u6216\u4ECE\u81EA\u52A8\u5907\u4EFD\u6062\u590D\u5230\u4E4B\u524D\u7684\u72B6\u6001\u3002",
        "wm.listLoadFailed": "\u8BFB\u53D6\u5DE5\u4F5C\u533A\u5217\u8868\u5931\u8D25\u3002",
        "wm.saveFailed": "\u4FDD\u5B58\u5931\u8D25",
        "wm.saved": "\u5DE5\u4F5C\u533A\u5DF2\u4FDD\u5B58",
        "wm.saved.flash": "\u5DE5\u4F5C\u533A\u5DF2\u4FDD\u5B58\u3002",
        "wm.saved.cloud": "{count} \u4E2A\u6587\u4EF6\u5DF2\u540C\u6B65\u5230\u4E91\u7AEF\u3002",
        "wm.saved.local": "{count} \u4E2A\u6587\u4EF6\u5DF2\u5199\u5165\u672C\u5730\u5907\u4EFD\u3002",
        "wm.confirm.load.title": "\u52A0\u8F7D\u5DE5\u4F5C\u533A",
        "wm.confirm.load.message": "\u8981\u52A0\u8F7D\u300C{name}\u300D\u5417\uFF1F\u5F53\u524D\u672A\u4FDD\u5B58\u7684\u6539\u52A8\u53EF\u80FD\u4F1A\u4E22\u5931\u3002",
        "wm.confirm.load.confirm": "\u52A0\u8F7D",
        "wm.loadFailed": "\u52A0\u8F7D\u5931\u8D25",
        "wm.loadFailedDetail": "\u65E0\u6CD5\u8BFB\u53D6\u5DE5\u4F5C\u533A\u5185\u5BB9",
        "wm.confirm.delete.title": "\u5220\u9664\u5DE5\u4F5C\u533A",
        "wm.confirm.delete.message": "\u786E\u5B9A\u5220\u9664\u300C{name}\u300D\u5417\uFF1F\u8FD9\u4E2A\u5907\u4EFD\u5220\u9664\u540E\u65E0\u6CD5\u4ECE\u5217\u8868\u6062\u590D\u3002",
        "wm.confirm.delete.confirm": "\u5220\u9664",
        "wm.deleteFailed": "\u5220\u9664\u5931\u8D25",
        "wm.deleted": "\u5DE5\u4F5C\u533A\u5DF2\u5220\u9664",
        "wm.deleted.flash": "\u5DE5\u4F5C\u533A\u5DF2\u5220\u9664\u3002",
        "wm.exportFailed": "\u5BFC\u51FA\u5931\u8D25",
        "wm.exportFailedDetail": "\u65E0\u6CD5\u8BFB\u53D6\u4E91\u7AEF\u5DE5\u4F5C\u533A",
        "wm.exported": "\u5DE5\u4F5C\u533A\u5DF2\u5BFC\u51FA",
        "wm.importSuccess": "\u5DE5\u4F5C\u533A\u5BFC\u5165\u6210\u529F\u3002",
        "wm.importFailed": "\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6587\u4EF6\u683C\u5F0F\u3002",
        "wm.exportAll": "\u5168\u90E8\u6570\u636E\u5DF2\u5BFC\u51FA",
        "wm.noAutoBackup": "\u6CA1\u6709\u627E\u5230\u81EA\u52A8\u5907\u4EFD",
        "wm.confirm.restore.title": "\u6062\u590D\u81EA\u52A8\u5907\u4EFD",
        "wm.confirm.restore.message": "\u627E\u5230\u4E00\u4EFD\u81EA\u52A8\u5907\u4EFD\u3002\u6062\u590D\u540E\u4F1A\u66FF\u6362\u5F53\u524D\u7F16\u8F91\u5668\u4E2D\u7684\u6587\u4EF6\u548C\u90E8\u5206\u8BBE\u7F6E\u3002",
        "wm.confirm.restore.confirm": "\u6062\u590D",
        "wm.autoBackupDetected": "\u68C0\u6D4B\u5230\u81EA\u52A8\u5907\u4EFD",
        "wm.restoreBackup": "\u6062\u590D\u5907\u4EFD",
        "wm.saveCurrent": "\u4FDD\u5B58\u5F53\u524D\u5DE5\u4F5C\u533A",
        "wm.local.sectionTitle": "\u6253\u5F00\u672C\u673A\u9879\u76EE\uFF08\u50CF Cursor\uFF09",
        "wm.local.sectionDesc": "\u9009\u62E9\u7535\u8111\u4E0A\u7684\u6587\u4EF6\u5939\uFF0C\u5728 IDE \u91CC\u7F16\u8F91\u5E76\u81EA\u52A8\u5199\u56DE\u78C1\u76D8\u3002\u9002\u5408\u771F\u5B9E\u9879\u76EE\u5F00\u53D1\u3002",
        "wm.cloud.sectionTitle": "\u4E91\u7AEF\u5FEB\u7167\u4E0E\u5907\u4EFD",
        "wm.cloud.sectionDesc": "\u4FDD\u5B58\u5230\u8D26\u53F7\u3001\u5BFC\u5165/\u5BFC\u51FA JSON\u3001\u81EA\u52A8\u5907\u4EFD\u6062\u590D\u3002",
        "wm.importBackup": "\u5BFC\u5165\u5907\u4EFD",
        "wm.exportAllBtn": "\u5BFC\u51FA\u5168\u90E8\u6570\u636E",
        "wm.namePlaceholder": "\u5DE5\u4F5C\u533A\u540D\u79F0",
        "wm.descPlaceholder": "\u63CF\u8FF0\uFF08\u53EF\u9009\uFF09",
        "wm.searchPlaceholder": "\u641C\u7D22\u5DE5\u4F5C\u533A",
        "wm.loading": "\u6B63\u5728\u52A0\u8F7D\u5DE5\u4F5C\u533A\u5217\u8868\u2026",
        "wm.empty.title": "\u8FD8\u6CA1\u6709\u4FDD\u5B58\u8FC7\u5DE5\u4F5C\u533A",
        "wm.empty.desc": "\u5148\u628A\u5F53\u524D\u8FDB\u5EA6\u5B58\u4E0B\u6765\uFF0C\u4E4B\u540E\u5C31\u80FD\u968F\u65F6\u56DE\u5230\u8FD9\u91CC\u3002",
        "wm.badge.cloud": "\u4E91\u7AEF",
        "wm.badge.local": "\u672C\u5730",
        "wm.meta.cloudLazy": "\u4E91\u7AEF\uFF08\u52A0\u8F7D\u65F6\u62C9\u53D6\uFF09",
        "wm.meta.fileCount": "{count} \u4E2A\u6587\u4EF6",
        "wm.action.load": "\u52A0\u8F7D",
        "wm.action.exportTitle": "\u5BFC\u51FA\u5DE5\u4F5C\u533A",
        "wm.action.deleteTitle": "\u5220\u9664\u5DE5\u4F5C\u533A",
        "wp.title": "\u5DE5\u4F5C\u533A\u4E0A\u4E0B\u6587",
        "wp.stat.files": "\u6587\u4EF6",
        "wp.stat.selected": "\u9009\u4E2D",
        "wp.stat.size": "\u4F53\u79EF",
        "wp.importing": "\u6B63\u5728\u5BFC\u5165 {current} / {total}",
        "wp.drop.title": "\u62D6\u653E\u6587\u4EF6\u6216\u6587\u4EF6\u5939\u5230\u8FD9\u91CC",
        "wp.drop.hint": "\u4E5F\u53EF\u4EE5\u70B9\u51FB\u9009\u62E9\u591A\u4E2A\u6587\u4EF6\uFF0C\u7528\u4E8E\u7ED9 AI \u63D0\u4F9B\u5B8C\u6574\u9879\u76EE\u4E0A\u4E0B\u6587\u3002",
        "wp.selectAll": "\u5168\u9009",
        "wp.deselectAll": "\u53D6\u6D88\u5168\u9009",
        "wp.clear": "\u6E05\u7A7A",
        "wp.empty.title": "\u5DE5\u4F5C\u533A\u4E0A\u4E0B\u6587\u4E3A\u7A7A",
        "wp.empty.desc": "\u5BFC\u5165\u6587\u4EF6\u540E\uFF0CAI \u52A9\u624B\u53EF\u4EE5\u57FA\u4E8E\u8FD9\u4E9B\u5185\u5BB9\u7406\u89E3\u9879\u76EE\u3002",
        "wp.close": "\u5173\u95ED",
        "wp.toggleSelect": "\u5207\u6362\u9009\u62E9",
        "wp.removeFromContext": "\u79FB\u51FA\u4E0A\u4E0B\u6587",
        "wp.defaultProjectName": "\u5F53\u524D\u9879\u76EE",
        "wp.notify.imported": "\u5DE5\u4F5C\u533A\u6587\u4EF6\u5DF2\u5BFC\u5165",
        "wp.notify.importedDetail": "{count} \u4E2A\u6587\u4EF6\u5DF2\u52A0\u5165\u4E0A\u4E0B\u6587\u3002",
        "wp.notify.importFailed": "\u5BFC\u5165\u5931\u8D25",
        "wp.notify.importDone": "\u6587\u4EF6\u5BFC\u5165\u5B8C\u6210",
        "wp.notify.importDoneDetail": "\u6210\u529F {success} \u4E2A\uFF0C\u5931\u8D25 {failed} \u4E2A\u3002",
        "wp.notify.removed": "\u5DF2\u79FB\u51FA\u4E0A\u4E0B\u6587",
        "wp.notify.selectAll": "\u5DF2\u5168\u9009\u5DE5\u4F5C\u533A\u6587\u4EF6",
        "wp.notify.deselectAll": "\u5DF2\u53D6\u6D88\u5168\u90E8\u9009\u62E9",
        "wp.confirm.clear.title": "\u6E05\u7A7A\u5DE5\u4F5C\u533A\u4E0A\u4E0B\u6587",
        "wp.confirm.clear.message": "\u786E\u5B9A\u8981\u6E05\u7A7A\u5DE5\u4F5C\u533A\u5417\uFF1F\u6240\u6709\u5BFC\u5165\u7684\u4E0A\u4E0B\u6587\u6587\u4EF6\u90FD\u4F1A\u88AB\u79FB\u9664\u3002",
        "wp.confirm.clear.confirm": "\u6E05\u7A7A",
        "wp.notify.cleared": "\u5DE5\u4F5C\u533A\u5DF2\u6E05\u7A7A",
        "wp.local.openFolder": "\u6253\u5F00\u672C\u5730\u9879\u76EE\u6587\u4EF6\u5939",
        "wp.local.restore": "\u6062\u590D\u4E0A\u6B21\u672C\u5730\u9879\u76EE",
        "wp.local.openTitle": "\u5DF2\u7ED1\u5B9A\u672C\u5730\u9879\u76EE\uFF1A{name}",
        "wp.local.openDetail": "\u5DF2\u5BFC\u5165 {count} \u4E2A\u6587\u4EF6\u5230\u5DE5\u4F5C\u533A\uFF0C\u4FDD\u5B58\u5C06\u5199\u56DE\u78C1\u76D8\u3002",
        "wp.local.openDetailCapped": "\u5DF2\u5BFC\u5165 {count} \u4E2A\u6587\u4EF6\uFF08\u5DF2\u8FBE\u4E0A\u9650\uFF0C\u90E8\u5206\u6587\u4EF6\u672A\u5BFC\u5165\uFF09\u3002",
        "wp.local.restoreTitle": "\u5DF2\u6062\u590D\u672C\u5730\u9879\u76EE",
        "wp.local.restoreNone": "\u6CA1\u6709\u53EF\u6062\u590D\u7684\u672C\u5730\u9879\u76EE\uFF0C\u8BF7\u5148\u6253\u5F00\u6587\u4EF6\u5939\u3002",
        "wp.local.bound": "\u672C\u5730\u78C1\u76D8\uFF1A{name}",
        "wp.local.unsupported": "\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u76F4\u63A5\u8BFB\u5199\u672C\u5730\u6587\u4EF6\u5939\uFF0C\u8BF7\u4F7F\u7528 Chrome \u6216 Edge\u3002",
        "wp.local.permissionDenied": "\u672A\u6388\u4E88\u6587\u4EF6\u5939\u5199\u5165\u6743\u9650\u3002",
        "wp.local.openFailed": "\u6253\u5F00\u672C\u5730\u9879\u76EE\u5931\u8D25",
        "wp.ctx.rename": "\u91CD\u547D\u540D (F2)",
        "wp.ctx.delete": "\u5220\u9664",
        "wp.ctx.move": "\u79FB\u52A8\u5230\u2026",
        "wp.ctx.newFolder": "\u65B0\u5EFA\u5B50\u6587\u4EF6\u5939",
        "wp.newFolder.btn": "\u65B0\u5EFA\u6587\u4EF6\u5939",
        "wp.newFolder.placeholder": "\u6587\u4EF6\u5939\u540D\u79F0",
        "wp.newFolder.create": "\u521B\u5EFA",
        "wp.newFolder.cancel": "\u53D6\u6D88",
        "wp.newFolder.failed": "\u521B\u5EFA\u6587\u4EF6\u5939\u5931\u8D25",
        "wp.move.prompt": "\u8F93\u5165\u65B0\u7684\u76F8\u5BF9\u8DEF\u5F84\uFF08\u79FB\u52A8/\u91CD\u547D\u540D\uFF09",
        "wp.rename.exists": "\u76EE\u6807\u8DEF\u5F84\u5DF2\u5B58\u5728",
        "wp.rename.failed": "\u91CD\u547D\u540D\u5931\u8D25",
        "wp.confirm.deleteFile.title": "\u5220\u9664\u6587\u4EF6",
        "wp.confirm.deleteFile.message": "\u786E\u5B9A\u5220\u9664\u300C{path}\u300D\u5417\uFF1F",
        "wp.confirm.deleteFile.confirm": "\u5220\u9664",
        "wp.confirm.deleteFolder.title": "\u5220\u9664\u6587\u4EF6\u5939",
        "wp.confirm.deleteFolder.message": "\u5C06\u5220\u9664\u300C{path}\u300D\u53CA\u5176\u4E0B\u6240\u6709\u6587\u4EF6\uFF0C\u786E\u5B9A\u5417\uFF1F",
        "wp.notify.renamed": "\u5DF2\u91CD\u547D\u540D",
        "wp.notify.renamedDetail": "\u5DF2\u66F4\u65B0 {count} \u4E2A\u8DEF\u5F84",
        "wp.notify.moved": "\u5DF2\u79FB\u52A8",
        "wp.notify.deleted": "\u5DF2\u5220\u9664",
        "wp.notify.deletedDetail": "\u5DF2\u79FB\u9664 {count} \u4E2A\u6587\u4EF6",
        "wp.notify.folderCreated": "\u5DF2\u521B\u5EFA\u6587\u4EF6\u5939",
        "snippet.title": "\u4EE3\u7801\u7247\u6BB5\u5E93",
        "snippet.searchPlaceholder": "\u641C\u7D22\u540D\u79F0\u3001\u6807\u7B7E\u6216\u4EE3\u7801",
        "snippet.allLanguages": "\u5168\u90E8\u8BED\u8A00",
        "snippet.new": "\u65B0\u5EFA",
        "snippet.form.name": "\u540D\u79F0",
        "snippet.form.namePlaceholder": "\u4F8B\u5982\uFF1AReact useState Hook",
        "snippet.form.language": "\u8BED\u8A00",
        "snippet.form.description": "\u63CF\u8FF0",
        "snippet.form.descriptionPlaceholder": "\u7B80\u77ED\u63CF\u8FF0\u8FD9\u4E2A\u7247\u6BB5\u7684\u7528\u9014",
        "snippet.form.tags": "\u6807\u7B7E",
        "snippet.form.code": "\u4EE3\u7801",
        "snippet.form.codePlaceholder": "\u5728\u8FD9\u91CC\u7C98\u8D34\u6216\u8F93\u5165\u4EE3\u7801\u7247\u6BB5",
        "snippet.form.update": "\u66F4\u65B0",
        "snippet.empty.title": "\u6CA1\u6709\u627E\u5230\u4EE3\u7801\u7247\u6BB5",
        "snippet.empty.desc": "\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u65B0\u5EFA\u4E00\u4E2A\u5E38\u7528\u7247\u6BB5\u3002",
        "snippet.badge.builtin": "\u5185\u7F6E",
        "snippet.copyTitle": "\u590D\u5236",
        "snippet.editTitle": "\u7F16\u8F91\u6216\u53E6\u5B58",
        "snippet.deleteTitle": "\u5220\u9664",
        "snippet.insert": "\u63D2\u5165\u5230\u7F16\u8F91\u5668",
        "snippet.copySuffix": " \u526F\u672C",
        "snippet.notify.updated": "\u4EE3\u7801\u7247\u6BB5\u5DF2\u66F4\u65B0",
        "snippet.notify.saved": "\u4EE3\u7801\u7247\u6BB5\u5DF2\u4FDD\u5B58",
        "snippet.notify.builtinNoDelete": "\u5185\u7F6E\u7247\u6BB5\u4E0D\u53EF\u5220\u9664",
        "snippet.notify.builtinNoDeleteDetail": "\u4F60\u53EF\u4EE5\u590D\u5236\u540E\u53E6\u5B58\u4E3A\u81EA\u5DF1\u7684\u7247\u6BB5\u3002",
        "snippet.confirm.delete.title": "\u5220\u9664\u4EE3\u7801\u7247\u6BB5",
        "snippet.confirm.delete.message": "\u786E\u5B9A\u5220\u9664\u300C{name}\u300D\u5417\uFF1F",
        "snippet.notify.deleted": "\u4EE3\u7801\u7247\u6BB5\u5DF2\u5220\u9664",
        "snippet.notify.copied": "\u5DF2\u590D\u5236\u4EE3\u7801\u7247\u6BB5",
        "snippet.notify.inserted": "\u4EE3\u7801\u7247\u6BB5\u5DF2\u63D2\u5165",
        "prompt.ws.emptyAssistant": "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u7F16\u7A0B\u52A9\u624B\u3002",
        "prompt.ws.emptyAssistantWith": "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u7F16\u7A0B\u52A9\u624B\u3002{context}",
        "prompt.ws.intro": "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u7F16\u7A0B\u52A9\u624B\u3002\u5F53\u524D\u5DE5\u4F5C\u533A\u5171 {count} \u4E2A\u6587\u4EF6\u3002",
        "prompt.ws.catalogTitle": "## \u5DE5\u4F5C\u533A\u6587\u4EF6\u6E05\u5355",
        "prompt.ws.catalogLegend": "\uFF08\u2713 = \u5DF2\u9009\u4E2D\u5E76\u9644\u5B8C\u6574\u5185\u5BB9\uFF0C\u25CB = \u4EC5\u6458\u8981\uFF09",
        "prompt.ws.unselectedTitle": "## \u672A\u9009\u4E2D\u6587\u4EF6\u6458\u8981",
        "prompt.ws.selectedTitle": "## \u5DF2\u9009\u4E2D\u6587\u4EF6\uFF08\u5B8C\u6574\u5185\u5BB9\uFF09",
        "prompt.ws.instructionsTitle": "## \u6307\u4EE4",
        "prompt.ws.instruction1": "1. \u4F60\u53EF\u4EE5\u4FEE\u6539\u5DE5\u4F5C\u533A\u6E05\u5355\u4E2D\u7684\u4EFB\u4F55\u6587\u4EF6",
        "prompt.ws.instruction2": "2. \u521B\u5EFA\u65B0\u6587\u4EF6\u65F6\u8BF7\u4F7F\u7528\u683C\u5F0F: ```filename.ext\n\u5185\u5BB9\n```",
        "prompt.ws.instruction3": "3. \u4FEE\u6539\u73B0\u6709\u6587\u4EF6\u65F6\u8BF7\u8F93\u51FA\u5B8C\u6574\u7684\u65B0\u6587\u4EF6\u5185\u5BB9",
        "prompt.ws.instruction4": "4. \u5982\u679C\u5220\u9664\u6587\u4EF6\uFF0C\u8BF7\u660E\u786E\u8BF4\u660E",
        "prompt.ws.instruction5": "5. \u5982\u679C\u79FB\u52A8/\u91CD\u547D\u540D\u6587\u4EF6\uFF0C\u8BF7\u8BF4\u660E\u539F\u8DEF\u5F84\u548C\u65B0\u8DEF\u5F84",
        "prompt.ws.noFiles": "\uFF08\u65E0\u6587\u4EF6\uFF09",
        "prompt.ws.omittedLines": "\u2026 (\u7701\u7565 {skipped} \u884C\uFF0C\u5171 {total} \u884C)",
        "prompt.code.base": "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u7F16\u7A0B\u52A9\u624B\u3002\u5F53\u524D\u4EE3\u7801\u4E0A\u4E0B\u6587:\n\n{context}\n\n",
        "prompt.code.explain": "\u8BF7\u8BE6\u7EC6\u89E3\u91CA\u8FD9\u6BB5\u4EE3\u7801\u7684\u529F\u80FD\u3001\u539F\u7406\u548C\u6F5C\u5728\u95EE\u9898\u3002",
        "prompt.code.refactor": "\u8BF7\u91CD\u6784\u8FD9\u6BB5\u4EE3\u7801\uFF0C\u4F7F\u5176\u66F4\u6E05\u6670\u3001\u9AD8\u6548\u3001\u53EF\u7EF4\u62A4\u3002\u8F93\u51FA\u5B8C\u6574\u7684\u91CD\u6784\u540E\u4EE3\u7801\u3002",
        "prompt.code.generate": "\u8BF7\u6839\u636E\u9700\u6C42\u751F\u6210\u4EE3\u7801\u3002\u5982\u9700\u8981\u591A\u4E2A\u6587\u4EF6\uFF0C\u8BF7\u7528 ```filename.ext \u683C\u5F0F\u6807\u6CE8\u3002",
        "prompt.code.fix": "\u8FD9\u6BB5\u4EE3\u7801\u6709\u95EE\u9898\uFF0C\u8BF7\u627E\u51FA\u95EE\u9898\u5E76\u63D0\u4F9B\u4FEE\u590D\u540E\u7684\u5B8C\u6574\u4EE3\u7801\u3002",
        "search.failed": "\u641C\u7D22\u5931\u8D25",
        "search.placeholder.tabs": "\u641C\u7D22\u5DF2\u6253\u5F00\u6587\u4EF6\u2026",
        "search.placeholder.workspace": "\u641C\u7D22\u6574\u4E2A\u5DE5\u4F5C\u533A\u2026",
        "search.closeTitle": "\u5173\u95ED\u641C\u7D22 (Esc)",
        "search.replacePlaceholder": "\u66FF\u6362\u4E3A...",
        "search.option.case": "\u533A\u5206\u5927\u5C0F\u5199",
        "search.option.wholeWord": "\u5168\u8BCD\u5339\u914D",
        "search.option.regex": "\u6B63\u5219",
        "search.scope.tabs": "\u6253\u5F00\u6587\u4EF6",
        "search.scope.workspace": "\u5DE5\u4F5C\u533A",
        "search.summary": "{matches} \u5904 \xB7 {files} \u4E2A\u6587\u4EF6",
        "search.summary.workspaceFiles": " \xB7 \u5171 {count} \u4E2A\u53EF\u641C\u6587\u4EF6",
        "search.toggleReplaceHide": "\u9690\u85CF\u66FF\u6362",
        "search.toggleReplaceShow": "\u663E\u793A\u66FF\u6362",
        "search.replaceAllPreview": "\u9884\u89C8\u5E76\u5168\u90E8\u66FF\u6362\uFF08{count} \u5904\uFF09",
        "search.replacePreview": "\u66FF\u6362\u9884\u89C8",
        "search.replacePreviewMatches": "{count} \u5904",
        "search.replacePreviewLines": " (\u884C {lines})",
        "search.replaceConfirm": "\u786E\u8BA4\u66FF\u6362",
        "search.replaceOne": "\u66FF\u6362",
        "search.searching": "\u6B63\u5728\u641C\u7D22...",
        "search.noResults": "\u672A\u627E\u5230\u5339\u914D\u9879",
        "search.fileGroup": "\uFF08{count}\uFF09",
        "git.statusReadFailed": "Git \u72B6\u6001\u8BFB\u53D6\u5931\u8D25",
        "git.actionFailed": "Git \u64CD\u4F5C\u5931\u8D25",
        "git.stagedFile": "\u5DF2\u6682\u5B58\u6587\u4EF6",
        "git.commitDone": "\u63D0\u4EA4\u5B8C\u6210",
        "git.stagedAll": "\u5DF2\u6682\u5B58\u5168\u90E8\u6539\u52A8",
        "git.stagedAllDetail": "{count} \u4E2A\u6587\u4EF6",
        "git.unstaged": "\u5DF2\u53D6\u6D88\u6682\u5B58",
        "git.diffReadFailed": "\u65E0\u6CD5\u8BFB\u53D6\u5DEE\u5F02",
        "git.diffViewFailed": "\u65E0\u6CD5\u67E5\u770B\u5DEE\u5F02",
        "git.discarded": "\u5DF2\u653E\u5F03\u6539\u52A8",
        "git.discardedAll": "\u5DF2\u653E\u5F03\u5168\u90E8\u672A\u6682\u5B58\u6539\u52A8",
        "git.discardedAllDetail": "{count} \u4E2A\u6587\u4EF6",
        "git.branchSwitched": "\u5DF2\u5207\u6362\u5206\u652F",
        "git.waitRuntime": "\u8FD0\u884C\u73AF\u5883\u51C6\u5907\u597D\u540E\uFF0CGit \u9762\u677F\u4F1A\u81EA\u52A8\u8FDE\u63A5\u5230\u5F53\u524D\u5DE5\u4F5C\u533A\u3002",
        "git.notInit.title": "\u8FD9\u4E2A\u5DE5\u4F5C\u533A\u8FD8\u6CA1\u6709\u521D\u59CB\u5316 Git",
        "git.notInit.desc": "\u521D\u59CB\u5316\u540E\u53EF\u4EE5\u5728\u8FD9\u91CC\u67E5\u770B\u6539\u52A8\u3001\u6682\u5B58\u6587\u4EF6\uFF0C\u5E76\u63D0\u4EA4\u7248\u672C\u8BB0\u5F55\u3002",
        "git.initBusy": "\u6B63\u5728\u521D\u59CB\u5316...",
        "git.initRepo": "\u521D\u59CB\u5316\u4ED3\u5E93",
        "git.refreshTitle": "\u5237\u65B0 Git \u72B6\u6001",
        "git.refresh": "\u5237\u65B0",
        "git.tab.changes": "\u6539\u52A8 {count}",
        "git.tab.history": "\u5386\u53F2 {count}",
        "git.unstagedLabel": "\u672A\u6682\u5B58",
        "git.unstagedCount": "{count} \u4E2A\u6587\u4EF6",
        "git.discardAll": "\u5168\u90E8\u653E\u5F03",
        "git.stageAll": "\u5168\u90E8\u6682\u5B58",
        "git.diff": "\u5DEE\u5F02",
        "git.discardFileTitle": "\u653E\u5F03\u6B64\u6587\u4EF6\u7684\u672A\u6682\u5B58\u6539\u52A8",
        "git.stageTitle": "\u6682\u5B58",
        "git.stagedLabel": "\u5DF2\u6682\u5B58",
        "git.unstage": "\u53D6\u6D88\u6682\u5B58",
        "git.commitPlaceholder": "\u5199\u4E00\u53E5\u8FD9\u6B21\u63D0\u4EA4\u505A\u4E86\u4EC0\u4E48",
        "git.committing": "\u63D0\u4EA4\u4E2D...",
        "git.commit": "\u63D0\u4EA4",
        "git.noChanges": "\u5F53\u524D\u6CA1\u6709\u672A\u63D0\u4EA4\u7684\u6539\u52A8\u3002",
        "git.noCommits": "\u6682\u65E0\u63D0\u4EA4\u8BB0\u5F55\u3002",
        "panel.git.subtitle": "\u67E5\u770B\u6539\u52A8\u4E0E\u63D0\u4EA4\u5386\u53F2",
        "panel.chat.title": "AI \u52A9\u624B",
        "panel.chat.subtitle": "\u5F53\u524D\u6587\u4EF6\u4E0E\u5DE5\u4F5C\u533A\u534F\u4F5C",
        "panel.backgroundJobs.title": "\u540E\u53F0\u4EFB\u52A1",
        "panel.backgroundJobs.subtitle": "\u5173\u9875\u540E\u670D\u52A1\u7AEF\u7EE7\u7EED\u6267\u884C\uFF08\u4E0E Chat \u4EFB\u52A1\u961F\u5217\u533A\u5206\uFF09",
        "toolbar.backgroundJobs": "\u540E\u53F0\u4EFB\u52A1",
        "backgroundJobs.hint": "\u6BCF 5 \u79D2\u81EA\u52A8\u5237\u65B0\u8FDB\u884C\u4E2D\u7684\u4EFB\u52A1",
        "backgroundJobs.hintFree": "\u514D\u8D39\u7248\uFF1A\u6BCF\u65E5 2 \u6B21\u3001\u540C\u65F6 1 \u4E2A\u4EFB\u52A1\u3002\u5347\u7EA7\u4E13\u4E1A\u7248\u653E\u5BBD\u9650\u5236\u3002",
        "backgroundJobs.empty": "\u6682\u65E0\u540E\u53F0\u4EFB\u52A1\u3002\u5728 Chat Agent \u6A21\u5F0F\u70B9\u51FB\u300C\u540E\u53F0\u8FD0\u884C\u300D\u63D0\u4EA4\u3002",
        "backgroundJobs.loginRequired": "\u767B\u5F55\u540E\u53EF\u4F7F\u7528\u540E\u53F0 Agent",
        "backgroundJobs.login": "\u767B\u5F55",
        "backgroundJobs.loadFailed": "\u52A0\u8F7D\u4EFB\u52A1\u5931\u8D25",
        "backgroundJobs.cancelFailed": "\u53D6\u6D88\u5931\u8D25",
        "backgroundJobs.cancelled": "\u4EFB\u52A1\u5DF2\u53D6\u6D88",
        "backgroundJobs.cancel": "\u53D6\u6D88\u4EFB\u52A1",
        "backgroundJobs.refresh": "\u5237\u65B0",
        "backgroundJobs.detailTitle": "\u4EFB\u52A1\u8BE6\u60C5",
        "backgroundJobs.repoKey": "\u5DE5\u4F5C\u533A",
        "backgroundJobs.progress": "\u8FDB\u5EA6",
        "backgroundJobs.result": "\u7ED3\u679C",
        "backgroundJobs.finishedAt": "\u5B8C\u6210\u65F6\u95F4",
        "backgroundJobs.status.queued": "\u6392\u961F\u4E2D",
        "backgroundJobs.status.running": "\u8FD0\u884C\u4E2D",
        "backgroundJobs.status.succeeded": "\u5DF2\u5B8C\u6210",
        "backgroundJobs.status.failed": "\u5931\u8D25",
        "backgroundJobs.status.cancelled": "\u5DF2\u53D6\u6D88",
        "backgroundJobs.cloudWritebackOk": "\u5DF2\u5199\u5165\u4E91\u5DE5\u4F5C\u533A {workspace}\uFF08{count} \u4E2A\u6587\u4EF6\uFF09",
        "backgroundJobs.previewDiff": "\u9884\u89C8 Diff",
        "backgroundJobs.openCloud": "\u6253\u5F00\u4E91\u5DE5\u4F5C\u533A",
        "backgroundJobs.reloadCloudHint": "\u4E91\u5DE5\u4F5C\u533A\u5DF2\u66F4\u65B0",
        "backgroundJobs.reloadCloudDetail": "\u8BF7\u4ECE\u5DE5\u4F5C\u533A\u7BA1\u7406\u5668\u52A0\u8F7D\u300C{workspace}\u300D\u4EE5\u67E5\u770B\u6587\u4EF6",
        "backgroundJobs.reloadCloudFailed": "\u65E0\u6CD5\u52A0\u8F7D\u4E91\u5DE5\u4F5C\u533A",
        "backgroundJobs.upgradePro": "\u5347\u7EA7\u4E13\u4E1A\u7248",
        "backgroundJobs.notifyOnComplete": "\u5B8C\u6210\u65F6\u684C\u9762\u901A\u77E5",
        "backgroundJobs.notifySucceeded": "\u540E\u53F0\u4EFB\u52A1\u5DF2\u5B8C\u6210",
        "backgroundJobs.notifyFailed": "\u540E\u53F0\u4EFB\u52A1\u5931\u8D25",
        "backgroundJobs.notifyCancelled": "\u540E\u53F0\u4EFB\u52A1\u5DF2\u53D6\u6D88",
        "backgroundJobs.notifyDesktopSucceeded": "\u540E\u53F0\u4EFB\u52A1\u5DF2\u5B8C\u6210",
        "backgroundJobs.notifyDesktopFailed": "\u540E\u53F0\u4EFB\u52A1\u5931\u8D25",
        "backgroundJobs.notifyDesktopCancelled": "\u540E\u53F0\u4EFB\u52A1\u5DF2\u53D6\u6D88",
        "backgroundJobs.activeBadge": "{count} \u4E2A\u8FDB\u884C\u4E2D\u7684\u540E\u53F0\u4EFB\u52A1",
        "backgroundJobs.applyToIde": "\u5E94\u7528\u5230 IDE",
        "backgroundJobs.applyToIdeOk": "\u5DF2\u5408\u5E76\u5230\u5F53\u524D\u7F16\u8F91\u5668",
        "backgroundJobs.applyToIdeOkDetail": "\u5DF2\u66F4\u65B0 {count} \u4E2A\u6587\u4EF6",
        "backgroundJobs.applyToIdeEmpty": "\u6CA1\u6709\u53EF\u5E94\u7528\u7684\u6587\u4EF6\u53D8\u66F4",
        "plan.catalog.runInBackground": "\u540E\u53F0\u8FD0\u884C",
        "plan.catalog.runAllInBackground": "\u5168\u90E8\u540E\u53F0\u8FD0\u884C ({count})",
        "plan.host.runBackgroundAlreadyQueued.title": "\u6B65\u9AA4\u5DF2\u5728\u540E\u53F0\u961F\u5217",
        "plan.host.runBackgroundAlreadyQueued.detail": "\u6240\u9009\u6B65\u9AA4\u5DF2\u5728\u6392\u961F\u6216\u8FD0\u884C\u4E2D\uFF0C\u65E0\u9700\u91CD\u590D\u63D0\u4EA4\u3002",
        "plan.host.runBackgroundSkipped.title": "\u90E8\u5206\u6B65\u9AA4\u5DF2\u8DF3\u8FC7",
        "plan.host.runBackgroundSkipped.detail": "\u5DF2\u8DF3\u8FC7 {count} \u4E2A\u91CD\u590D\u6216\u5DF2\u5728\u961F\u5217\u4E2D\u7684\u6B65\u9AA4\u3002",
        "plan.host.runBackgroundConfirm.title": "\u63D0\u4EA4\u540E\u53F0\u4EFB\u52A1\uFF1F",
        "plan.host.runBackgroundConfirm.message": "\u5C06\u628A {count} \u4E2A\u8BA1\u5212\u6B65\u9AA4\u63D0\u4EA4\u4E3A\u540E\u53F0\u4EFB\u52A1\uFF08{path}\uFF09\u3002\n\n{preview}{more}",
        "plan.host.runBackgroundConfirm.confirm": "\u63D0\u4EA4\u540E\u53F0",
        "plan.host.runBackgroundQueued.title": "\u5DF2\u63D0\u4EA4\u540E\u53F0\u4EFB\u52A1",
        "plan.host.runBackgroundQueued.detail": "\u5DF2\u6392\u961F {count} \u4E2A\u6B65\u9AA4\uFF08{path}\uFF09",
        "backgroundJobs.filterLabel": "\u4EFB\u52A1\u7B5B\u9009",
        "backgroundJobs.filter.all": "\u5168\u90E8",
        "backgroundJobs.filter.active": "\u8FDB\u884C\u4E2D",
        "backgroundJobs.filter.finished": "\u5DF2\u7ED3\u675F",
        "backgroundJobs.filterEmpty": "\u5F53\u524D\u7B5B\u9009\u4E0B\u6CA1\u6709\u4EFB\u52A1",
        "backgroundJobs.retry": "\u91CD\u8BD5",
        "backgroundJobs.retryQueued": "\u5DF2\u91CD\u65B0\u63D0\u4EA4\u540E\u53F0\u4EFB\u52A1",
        "backgroundJobs.retryFailed": "\u91CD\u8BD5\u5931\u8D25",
        "backgroundJobs.autoMarkPlanStep": "\u5B8C\u6210\u65F6\u81EA\u52A8\u52FE\u9009\u8BA1\u5212\u6B65\u9AA4",
        "backgroundJobs.markPlanStep": "\u6807\u8BB0\u8BA1\u5212\u6B65\u9AA4\u5B8C\u6210",
        "backgroundJobs.planStepMarked": "\u8BA1\u5212\u6B65\u9AA4\u5DF2\u6807\u8BB0\u5B8C\u6210",
        "backgroundJobs.planStepMarkedDetail": "{path}\uFF1A{step}",
        "backgroundJobs.planStepAlreadyDone": "\u8BA1\u5212\u6B65\u9AA4\u5DF2\u662F\u5B8C\u6210\u72B6\u6001\u6216\u8BA1\u5212\u6587\u4EF6\u4E0D\u5B58\u5728",
        "backgroundJobs.planSource": "\u6765\u6E90\u8BA1\u5212",
        "backgroundJobs.copyPrompt": "\u590D\u5236 Prompt",
        "backgroundJobs.copyPromptOk": "\u5DF2\u590D\u5236",
        "backgroundJobs.copyPromptFailed": "\u590D\u5236\u5931\u8D25",
        "backgroundJobs.notifyClickHint": "\u70B9\u51FB\u67E5\u770B\u540E\u53F0\u4EFB\u52A1",
        "chat.backgroundRun.button": "\u540E\u53F0\u8FD0\u884C\uFF08\u5173\u9875\u540E\u7EE7\u7EED\uFF09",
        "chat.backgroundRun.taskHeading": "\u7528\u6237\u4EFB\u52A1",
        "chat.backgroundRun.queued": "\u5DF2\u63D0\u4EA4\u540E\u53F0\u4EFB\u52A1",
        "chat.backgroundRun.queuedDetail": "\u53EF\u5728\u300C\u540E\u53F0\u4EFB\u52A1\u300D\u9762\u677F\u67E5\u770B\u8FDB\u5EA6",
        "chat.backgroundRun.failed": "\u63D0\u4EA4\u540E\u53F0\u4EFB\u52A1\u5931\u8D25",
        "chat.backgroundRun.upgradeHint": "\u514D\u8D39\u7248\u914D\u989D\u5DF2\u7528\u5B8C\uFF0C\u53EF\u5347\u7EA7\u4E13\u4E1A\u7248\u4EE5\u83B7\u5F97\u66F4\u591A\u540E\u53F0\u4EFB\u52A1\u989D\u5EA6\u3002",
        "aiSettings.title": "AI \u6A21\u578B\u8BBE\u7F6E",
        "aiSettings.provider": "AI \u63D0\u4F9B\u5546",
        "aiSettings.model": "\u6A21\u578B",
        "aiSettings.apiKeyHint": "API Key \u4EC5\u5B58\u50A8\u5728\u672C\u5730\u6D4F\u89C8\u5668\u4E2D",
        "aiSettings.advancedShow": "\u9AD8\u7EA7\u8BBE\u7F6E",
        "aiSettings.advancedHide": "\u9690\u85CF\u9AD8\u7EA7\u8BBE\u7F6E",
        "aiSettings.endpoint": "\u81EA\u5B9A\u4E49 API \u7AEF\u70B9 (\u53EF\u9009)",
        "aiSettings.endpointHint": "\u7528\u4E8E\u81EA\u5EFA API \u4EE3\u7406\u6216\u517C\u5BB9 OpenAI \u683C\u5F0F\u7684\u670D\u52A1",
        "template.title": "\u9009\u62E9\u9879\u76EE\u6A21\u677F",
        "template.fileCount": "{count} \u4E2A\u6587\u4EF6",
        "import.title": "\u5BFC\u5165\u9879\u76EE",
        "import.hero.title": "\u628A\u4EE3\u7801\u5E26\u8FDB\u6765\uFF0C\u7136\u540E\u9A6C\u4E0A\u5F00\u5DE5",
        "import.hero.desc": "\u652F\u6301 GitHub \u4ED3\u5E93\u3001\u76F4\u63A5\u4E0A\u4F20\u6587\u4EF6\uFF0C\u4EE5\u53CA ZIP \u6253\u5305\u5BFC\u5165\u3002\u5BFC\u5165\u540E\u4F1A\u81EA\u52A8\u8BC6\u522B\u5E38\u89C1\u8BED\u8A00\u7C7B\u578B\u3002",
        "import.tab.upload": "\u4E0A\u4F20\u6587\u4EF6",
        "import.tab.zip": "ZIP \u5BFC\u5165",
        "import.githubUrl": "GitHub \u4ED3\u5E93\u5730\u5740",
        "import.branch": "\u5206\u652F",
        "import.token": "GitHub Token\uFF08\u53EF\u9009\uFF09",
        "import.tokenPlaceholder": "\u7528\u4E8E\u79C1\u6709\u4ED3\u5E93",
        "import.importing": "\u5BFC\u5165\u4E2D...",
        "import.importRepo": "\u5BFC\u5165\u4ED3\u5E93",
        "import.error.invalidUrl": "\u8BF7\u8F93\u5165\u6709\u6548\u7684 GitHub \u4ED3\u5E93\u5730\u5740\u3002",
        "import.error.branches": "\u8BFB\u53D6\u4ED3\u5E93\u5206\u652F\u5931\u8D25\u3002",
        "import.error.noTextFiles": "\u6CA1\u6709\u627E\u5230\u53EF\u5BFC\u5165\u7684\u6587\u672C\u6587\u4EF6\u3002",
        "import.error.selectZip": "\u8BF7\u9009\u62E9 ZIP \u6587\u4EF6\u3002",
        "import.error.zipEmpty": "ZIP \u4E2D\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6587\u4EF6\u3002",
        "import.error.zipParse": "\u89E3\u6790 ZIP \u5931\u8D25\uFF1A{message}",
        "import.error.dropZip": "\u8BF7\u62D6\u5165 ZIP \u6587\u4EF6\u3002",
        "import.drop.upload.title": "\u70B9\u51FB\u6216\u62D6\u62FD\u6587\u4EF6\u5230\u8FD9\u91CC",
        "import.drop.upload.subtitle": "\u9002\u5408\u5C11\u91CF\u6E90\u7801\u6587\u4EF6\u3001\u914D\u7F6E\u6587\u4EF6\u548C\u6587\u6863\u5FEB\u901F\u5BFC\u5165\u3002\u652F\u6301\u591A\u9009\u3002",
        "import.drop.zip.title": "\u5BFC\u5165 ZIP \u6253\u5305\u9879\u76EE",
        "import.drop.zip.subtitle": "\u9002\u5408\u628A\u5B8C\u6574\u9879\u76EE\u4E00\u6B21\u6027\u5E26\u8FDB\u6765\uFF0C\u4E5F\u9002\u5408\u6062\u590D\u4E4B\u524D\u5BFC\u51FA\u7684\u538B\u7F29\u5305\u3002",
        "status.diagnostics.none": "\u65E0\u8BCA\u65AD",
        "status.diagnostics.count": "{count} \u4E2A\u8BCA\u65AD",
        "status.feature.review": "\u4EE3\u7801\u5BA1\u67E5",
        "status.feature.performance": "\u6027\u80FD\u76D1\u6D4B",
        "status.runtime.ready": "\u8FD0\u884C\u73AF\u5883\u5DF2\u5C31\u7EEA",
        "status.runtime.loading": "\u8FD0\u884C\u73AF\u5883\u52A0\u8F7D\u4E2D",
        "status.autosave.on": "\u81EA\u52A8\u4FDD\u5B58\u5F00\u542F",
        "status.autosave.off": "\u624B\u52A8\u4FDD\u5B58",
        "status.autosaveTitle": "\u5207\u6362\u81EA\u52A8\u4FDD\u5B58",
        "status.gitTitle": "\u6253\u5F00 Git \u9762\u677F",
        "status.ai.connected": "AI \u5DF2\u8FDE\u63A5",
        "status.ai.configure": "\u914D\u7F6E AI",
        "status.aiTitle": "\u914D\u7F6E AI",
        "status.locale.zh": "\u4E2D\u6587",
        "status.locale.en": "English",
        "status.settings": "\u8BBE\u7F6E",
        "status.settingsTitle": "\u6253\u5F00\u8BBE\u7F6E",
        "review.title": "\u4EE3\u7801\u5BA1\u67E5",
        "review.pickMode": "\u9009\u62E9\u5BA1\u67E5\u65B9\u5F0F\u5206\u6790\u4EE3\u7801\u8D28\u91CF",
        "review.quickCheck": "\u5FEB\u901F\u68C0\u67E5\uFF08\u672C\u5730\u89C4\u5219\uFF09",
        "review.aiReview": "AI \u6DF1\u5EA6\u5BA1\u67E5",
        "review.reviewing": "\u5BA1\u67E5\u4E2D...",
        "review.generateTests": "AI \u751F\u6210\u5355\u5143\u6D4B\u8BD5",
        "review.generatingTests": "\u751F\u6210\u4E2D...",
        "review.needApiKey": "\u8BF7\u5148\u914D\u7F6E AI API Key",
        "review.testGenFailed": "\u751F\u6210\u6D4B\u8BD5\u5931\u8D25",
        "review.quickPass": "\u5FEB\u901F\u68C0\u67E5\u901A\u8FC7\uFF0C\u672A\u53D1\u73B0\u660E\u663E\u95EE\u9898",
        "review.quickIssues": "\u53D1\u73B0 {count} \u4E2A\u95EE\u9898",
        "review.filter.all": "\u5168\u90E8",
        "review.filter.errors": "\u9519\u8BEF",
        "review.filter.warnings": "\u8B66\u544A",
        "review.filter.suggestions": "\u5EFA\u8BAE",
        "review.noIssuesInFilter": "\u672A\u53D1\u73B0\u6B64\u7C7B\u95EE\u9898",
        "review.line": "\u7B2C {line} \u884C",
        "review.back": "\u8FD4\u56DE\u9009\u62E9",
        "review.rerun": "\u91CD\u65B0\u5BA1\u67E5",
        "perf.title": "\u6027\u80FD\u5206\u6790",
        "perf.clearHistory": "\u6E05\u9664\u5386\u53F2",
        "perf.running": "\u8FD0\u884C\u4E2D...",
        "perf.overview": "\u7EDF\u8BA1\u6982\u89C8",
        "perf.avgTime": "\u5E73\u5747\u8017\u65F6",
        "perf.fastest": "\u6700\u5FEB",
        "perf.slowest": "\u6700\u6162",
        "perf.runCount": "\u8FD0\u884C\u6B21\u6570",
        "perf.history": "\u8FD0\u884C\u5386\u53F2",
        "perf.noRuns": "\u6682\u65E0\u8FD0\u884C\u8BB0\u5F55",
        "perf.noRunsHint": "\u8FD0\u884C\u4EE3\u7801\u540E\u5C06\u663E\u793A\u6027\u80FD\u6570\u636E",
        "perf.runLabel": "\u8FD0\u884C #{index}",
        "perf.execTime": "\u6267\u884C\u65F6\u95F4",
        "perf.memoryEst": "\u5185\u5B58\u4F30\u7B97",
        "perf.outputSize": "\u8F93\u51FA\u5927\u5C0F",
        "terminal.title": "\u7EC8\u7AEF",
        "terminal.running": "\u8FD0\u884C\u4E2D",
        "terminal.run": "\u8FD0\u884C",
        "terminal.clear": "\u6E05\u7A7A",
        "terminal.hint": "\u70B9\u51FB\u201C\u8FD0\u884C\u201D\u6267\u884C\u5F53\u524D\u6587\u4EF6\uFF0C\u8F93\u51FA\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002",
        "agentApply.title": "Agent \u53D8\u66F4\u9884\u89C8",
        "agentApply.badge.new": "\u65B0\u5EFA",
        "agentApply.badge.modified": "\u4FEE\u6539",
        "agentApply.oldLabel": "\u5F53\u524D",
        "agentApply.newLabel": "\u5EFA\u8BAE",
        "agentApply.empty": "\u9009\u62E9\u5DE6\u4FA7\u6587\u4EF6\u67E5\u770B\u5DEE\u5F02",
        "agentApply.footer": "\u5171 {total} \u4E2A\u6587\u4EF6 \xB7 \u5F85\u5E94\u7528 {remaining}",
        "agentApply.applyCurrent": "\u5E94\u7528\u5F53\u524D\u6587\u4EF6",
        "agentApply.applyCurrentHunks": "\u5E94\u7528\u5DF2\u9009\u5757",
        "agentApply.applyCurrentFull": "\u5E94\u7528\u6574\u6587\u4EF6",
        "agentApply.applyAll": "\u5E94\u7528\u5168\u90E8 ({count})",
        "agentApply.skipCurrent": "\u8DF3\u8FC7\u672C\u6587\u4EF6",
        "agentApply.hunkBadge": "{accepted}/{total} \u5757",
        "agent.tool.writeStaged": "\u2713 {tool} {detail} \xB7 {hunks} \u4E2A\u53D8\u66F4\u5757",
        "dropzone.title": "\u5BFC\u5165\u6587\u4EF6",
        "dropzone.dragOr": "\u62D6\u62FD\u6587\u4EF6\u5230\u6B64\u5904\uFF0C\u6216",
        "dropzone.pickFiles": "\u70B9\u51FB\u9009\u62E9\u6587\u4EF6",
        "dropzone.supported": "\u652F\u6301: {types}",
        "dropzone.unsupportedType": "\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u7C7B\u578B\u3002\u8BF7\u4E0A\u4F20: {types}",
        "dropzone.pending": "\u5373\u5C06\u5BFC\u5165 {count} \u4E2A\u6587\u4EF6\uFF1A",
        "dropzone.repick": "\u91CD\u65B0\u9009\u62E9",
        "dropzone.confirm": "\u786E\u8BA4\u5BFC\u5165",
        "diff.title": "\u4EE3\u7801\u5BF9\u6BD4",
        "diff.added": "+{count} \u65B0\u589E",
        "diff.removed": "-{count} \u5220\u9664",
        "diff.unchanged": "{count} \u672A\u53D8\u66F4",
        "diff.showUnchanged": "\u663E\u793A\u672A\u53D8\u66F4",
        "diff.hunks": "\u53D8\u66F4\u5757 {accepted}/{total}\uFF1A",
        "diff.hunk": "\u5757 {index} (+{added}/-{removed})",
        "diff.selectAll": "\u5168\u9009",
        "diff.selectNone": "\u5168\u4E0D\u9009",
        "diff.content": "\u5185\u5BB9",
        "diff.lineCount": "\u5171 {count} \u884C",
        "diff.close": "\u5173\u95ED",
        "diff.oldLabel": "\u65E7\u7248\u672C",
        "diff.newLabel": "\u65B0\u7248\u672C",
        "diff.apply": "\u5E94\u7528",
        "diff.applyPartial": "\u5E94\u7528\u5DF2\u9009\u5757",
        "preview.kicker": "\u9884\u89C8",
        "preview.refresh": "\u5237\u65B0",
        "preview.newWindow": "\u65B0\u7A97\u53E3",
        "preview.closeTitle": "\u5173\u95ED\u9884\u89C8",
        "outline.title": "\u5927\u7EB2",
        "outline.empty": "\u5F53\u524D\u6587\u4EF6\u672A\u8BC6\u522B\u5230\u7B26\u53F7",
        "errorBoundary.title": "\u5E94\u7528\u9047\u5230\u9519\u8BEF",
        "errorBoundary.desc": "AI IDE \u9047\u5230\u4E86\u610F\u5916\u9519\u8BEF\u3002\u4F60\u53EF\u4EE5\u5237\u65B0\u9875\u9762\uFF0C\u6216\u5728\u5FC5\u8981\u65F6\u6E05\u9664\u672C\u5730\u6570\u636E\u540E\u91CD\u8BD5\u3002",
        "errorBoundary.refresh": "\u5237\u65B0\u9875\u9762",
        "errorBoundary.clearLocal": "\u6E05\u9664\u672C\u5730\u6570\u636E",
        "errorBoundary.hint": "\u524D\u7AEF\u8FD0\u884C\u65F6\u9519\u8BEF \xB7 \u672C\u5730\u9879\u76EE\u6570\u636E\u5B58\u50A8\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u4E2D",
        "errorBoundary.clearFailed": "\u6E05\u9664\u5931\u8D25\uFF1A{message}",
        "errorBoundary.confirm.title": "\u6E05\u9664\u6240\u6709\u672C\u5730\u6570\u636E",
        "errorBoundary.confirm.message": "\u8FD9\u4F1A\u5220\u9664\u4FDD\u5B58\u5728\u6D4F\u89C8\u5668\u91CC\u7684\u9879\u76EE\u3001\u8BBE\u7F6E\u548C\u7F13\u5B58\u3002\u786E\u8BA4\u540E\u9875\u9762\u4F1A\u81EA\u52A8\u5237\u65B0\u3002",
        "errorBoundary.confirm.clear": "\u6E05\u9664",
        "inlineAi.title": "AI \u5185\u8054\u7F16\u8F91",
        "inlineAi.charsSelected": "{count} \u5B57\u7B26\u5DF2\u9009\u4E2D",
        "inlineAi.suggestion": "AI \u5EFA\u8BAE\u7684\u4FEE\u6539",
        "inlineAi.retype": "\u91CD\u65B0\u8F93\u5165",
        "inlineAi.reject": "\u62D2\u7EDD",
        "inlineAi.accept": "\u63A5\u53D7",
        "inlineAi.placeholder": "\u8F93\u5165\u6307\u4EE4\uFF0C\u5982\uFF1A\u7B80\u5316\u8FD9\u6BB5\u4EE3\u7801",
        "inlineAi.generate": "\u751F\u6210",
        "inlineAi.hint": "\u6309 Enter \u751F\u6210\uFF0CEsc \u5173\u95ED",
        "inlineAi.requestFailed": "\u8BF7\u6C42\u5931\u8D25",
        "inlineAi.quick.explain": "\u89E3\u91CA",
        "inlineAi.quick.refactor": "\u91CD\u6784",
        "inlineAi.quick.optimize": "\u4F18\u5316",
        "inlineAi.quick.fix": "\u4FEE\u590D",
        "inlineAi.quick.comment": "\u6DFB\u52A0\u6CE8\u91CA",
        "inlineAi.quick.simplify": "\u7B80\u5316",
        "inlineAi.prompt.explain": "\u89E3\u91CA\u8FD9\u6BB5\u4EE3\u7801",
        "inlineAi.prompt.refactor": "\u91CD\u6784\u8FD9\u6BB5\u4EE3\u7801\uFF0C\u4F7F\u5176\u66F4\u6E05\u6670",
        "inlineAi.prompt.optimize": "\u4F18\u5316\u8FD9\u6BB5\u4EE3\u7801\u7684\u6027\u80FD",
        "inlineAi.prompt.fix": "\u68C0\u67E5\u5E76\u4FEE\u590D\u8FD9\u6BB5\u4EE3\u7801\u7684\u95EE\u9898",
        "inlineAi.prompt.comment": "\u4E3A\u8FD9\u6BB5\u4EE3\u7801\u6DFB\u52A0\u8BE6\u7EC6\u6CE8\u91CA",
        "inlineAi.prompt.simplify": "\u7B80\u5316\u8FD9\u6BB5\u4EE3\u7801",
        "prompt.inline.system": "\u4F60\u662F\u4E00\u4E2A\u4EE3\u7801\u7F16\u8F91\u52A9\u624B\u3002\u7528\u6237\u9009\u4E2D\u4E86\u4E00\u6BB5 {language} \u4EE3\u7801\uFF0C\u5E76\u7ED9\u51FA\u4E86\u4FEE\u6539\u6307\u4EE4\u3002",
        "prompt.inline.rule1": "1. \u53EA\u8F93\u51FA\u4FEE\u6539\u540E\u7684\u4EE3\u7801\uFF0C\u4E0D\u8981\u5305\u542B\u89E3\u91CA",
        "prompt.inline.rule2": "2. \u4FDD\u6301\u4EE3\u7801\u7684\u7F29\u8FDB\u548C\u683C\u5F0F",
        "prompt.inline.rule3": '3. \u5982\u679C\u662F\u6307\u4EE4\u65E0\u6CD5\u7406\u89E3\uFF0C\u8F93\u51FA "ERROR: \u65E0\u6CD5\u5904\u7406\u8BE5\u6307\u4EE4"',
        "prompt.inline.selected": "\u9009\u4E2D\u7684\u4EE3\u7801\uFF1A",
        "prompt.inline.instruction": "\u7528\u6237\u6307\u4EE4\uFF1A{prompt}",
        "prompt.inline.output": "\u8F93\u51FA\u4FEE\u6539\u540E\u7684\u4EE3\u7801\uFF1A",
        "collab.title": "\u5B9E\u65F6\u534F\u4F5C",
        "collab.aria": "\u5B9E\u65F6\u534F\u4F5C Beta",
        "collab.hero.title": "\u548C\u522B\u4EBA\u4E00\u8D77\u76EF\u7740\u540C\u4E00\u4E2A\u5DE5\u4F5C\u533A",
        "collab.hero.desc": "\u521B\u5EFA\u623F\u95F4\u6216\u52A0\u5165\u5DF2\u6709\u623F\u95F4\u3002\u52A0\u5165\u540E\u5F53\u524D\u5DE5\u4F5C\u533A\u6587\u4EF6\u4F1A\u901A\u8FC7 Yjs + WebRTC \u540C\u6B65\u3002",
        "collab.limits": "Beta \u8BF4\u660E\uFF1A\u65E0\u72EC\u7ACB\u4FE1\u4EE4\u670D\u52A1\u5668\u65F6\u4F9D\u8D56\u516C\u5171 WebRTC \u4FE1\u4EE4\uFF1B\u591A\u4EBA\u540C\u65F6\u7F16\u8F91\u53EF\u80FD\u51FA\u73B0\u51B2\u7A81\uFF0C\u7F16\u8F91\u5668\u5149\u6807\u4E0D\u540C\u6B65\u3002\u9002\u5408\u6F14\u793A\u4E0E\u5C0F\u56E2\u961F\u8BD5\u7528\uFF0C\u4E0D\u5EFA\u8BAE\u4F5C\u4E3A\u751F\u4EA7\u7EA7\u534F\u4F5C\u65B9\u6848\u3002",
        "collab.m1.limits": "M1\uFF1A\u767B\u5F55\u540E\u901A\u8FC7\u670D\u52A1\u7AEF\u623F\u95F4\u52A0\u5165\uFF1B\u4ECD\u4F7F\u7528 Yjs/WebRTC \u540C\u6B65\uFF08\u914D\u7F6E Livekit \u540E\u53EF\u5347\u7EA7\u4FE1\u4EE4\uFF09\u3002",
        "collab.m1.loginRequired": "\u534F\u4F5C M1 \u9700\u8981\u5148\u767B\u5F55",
        "collab.m1.createFailed": "\u521B\u5EFA\u534F\u4F5C\u623F\u95F4\u5931\u8D25",
        "collab.m1.joinFailed": "\u52A0\u5165\u534F\u4F5C\u623F\u95F4\u5931\u8D25",
        "collab.m1.generate": "\u521B\u5EFA\u623F\u95F4",
        "collab.status.connected": "\u5DF2\u8FDE\u63A5",
        "collab.status.connecting": "\u8FDE\u63A5\u4E2D\u2026",
        "collab.status.reconnecting": "\u91CD\u8FDE\u4E2D\uFF08\u7B2C {attempt} \u6B21\uFF09\u2026",
        "collab.status.disconnected": "\u5DF2\u65AD\u5F00",
        "collab.role.host": "\u4E3B\u6301\u4EBA",
        "collab.role.editor": "\u7F16\u8F91\u8005",
        "collab.role.viewer": "\u53EA\u8BFB",
        "collab.joinAs": "\u52A0\u5165\u8EAB\u4EFD",
        "collab.joinAsHint": "\u53EA\u8BFB\u6210\u5458\u53EF\u67E5\u770B\u540C\u6B65\u5185\u5BB9\uFF0C\u65E0\u6CD5\u4FEE\u6539\u6587\u4EF6\u6216\u63A8\u9001\u5230\u623F\u95F4\u3002",
        "collab.readOnlyBanner": "\u534F\u4F5C\u53EA\u8BFB\uFF1A\u5F53\u524D\u4E3A Viewer\uFF0C\u7F16\u8F91\u5668\u5DF2\u9501\u5B9A\u3002",
        "collab.roomMembers": "\u623F\u95F4\u6210\u5458\uFF08\u670D\u52A1\u7AEF\uFF09",
        "collab.makeViewer": "\u8BBE\u4E3A\u53EA\u8BFB",
        "collab.makeEditor": "\u8BBE\u4E3A\u7F16\u8F91",
        "collab.kick": "\u79FB\u51FA",
        "collab.m1.roleUpdateFailed": "\u66F4\u65B0\u6210\u5458\u89D2\u8272\u5931\u8D25",
        "collab.m1.kickFailed": "\u79FB\u51FA\u6210\u5458\u5931\u8D25",
        "collab.yourName": "\u4F60\u7684\u540D\u5B57",
        "collab.roomId": "\u623F\u95F4 ID",
        "collab.roomPlaceholder": "\u7559\u7A7A\u5219\u81EA\u52A8\u521B\u5EFA\u4E00\u4E2A\u65B0\u623F\u95F4",
        "collab.generate": "\u751F\u6210",
        "collab.hint": "\u8F93\u5165\u5DF2\u6709\u623F\u95F4 ID \u52A0\u5165\uFF0C\u6216\u8005\u7559\u7A7A\u540E\u76F4\u63A5\u521B\u5EFA\u65B0\u623F\u95F4\u3002",
        "collab.joinRoom": "\u52A0\u5165\u623F\u95F4",
        "collab.createRoom": "\u521B\u5EFA\u623F\u95F4",
        "collab.roomLink": "\u623F\u95F4\u94FE\u63A5",
        "collab.copied": "\u5DF2\u590D\u5236",
        "collab.copyLink": "\u590D\u5236\u94FE\u63A5",
        "collab.roomIdLabel": "\u623F\u95F4 ID\uFF1A",
        "collab.members": "\u5728\u7EBF\u6210\u5458\uFF08{count}\uFF09",
        "collab.unknownUser": "\u672A\u77E5\u7528\u6237",
        "collab.you": "\uFF08\u4F60\uFF09",
        "collab.leave": "\u79BB\u5F00\u623F\u95F4",
        "collab.defaultUser": "\u7528\u6237{n}",
        "share.title": "\u5206\u4EAB\u4E0E\u5BFC\u5165",
        "share.aria": "\u5206\u4EAB\u4E0E\u5BFC\u5165",
        "share.hero.title": "\u5F53\u524D\u5DE5\u4F5C\u533A\u5FEB\u7167",
        "share.hero.desc": "\u4F60\u53EF\u4EE5\u751F\u6210\u5206\u4EAB\u94FE\u63A5\u3001\u5BFC\u51FA JSON \u5907\u4EFD\uFF0C\u6216\u8005\u4ECE\u5386\u53F2\u5FEB\u7167\u4E0E JSON \u6587\u672C\u6062\u590D\u9879\u76EE\u3002",
        "share.meta.files": "{count} \u4E2A\u6587\u4EF6",
        "share.meta.chars": "{count} \u5B57\u7B26",
        "share.tab.share": "\u521B\u5EFA\u5206\u4EAB",
        "share.tab.history": "\u5386\u53F2\u8BB0\u5F55",
        "share.tab.import": "\u5BFC\u5165 JSON",
        "share.createHint": "\u751F\u6210\u4E00\u4E2A\u672C\u5730\u5206\u4EAB\u5FEB\u7167\u94FE\u63A5\uFF0C\u65B9\u4FBF\u4F60\u7A0D\u540E\u6062\u590D\uFF0C\u6216\u5206\u4EAB\u7ED9\u540C\u4E00\u73AF\u5883\u91CC\u7684\u5176\u4ED6\u4EBA\u4F7F\u7528\u3002",
        "share.generateLink": "\u751F\u6210\u5206\u4EAB\u94FE\u63A5",
        "share.exportJson": "\u5BFC\u51FA JSON",
        "share.linkReady": "\u94FE\u63A5\u5DF2\u751F\u6210\uFF0C\u73B0\u5728\u53EF\u4EE5\u590D\u5236\u6216\u91CD\u65B0\u751F\u6210\u3002",
        "share.regenerate": "\u91CD\u65B0\u751F\u6210",
        "share.copy": "\u590D\u5236",
        "share.empty": "\u8FD8\u6CA1\u6709\u4FDD\u5B58\u8FC7\u5206\u4EAB\u5FEB\u7167\u3002",
        "share.historyFiles": "{count} \u4E2A\u6587\u4EF6",
        "share.load": "\u52A0\u8F7D",
        "share.deleteTitle": "\u5220\u9664",
        "share.importHint": "\u7C98\u8D34\u5BFC\u51FA\u7684 JSON \u5185\u5BB9\u5373\u53EF\u6062\u590D\u9879\u76EE\u3002\u4E5F\u652F\u6301\u901A\u8FC7 URL \u53C2\u6570 `?share=xxx` \u8FDB\u5165\u5206\u4EAB\u6062\u590D\u6D41\u7A0B\u3002",
        "share.importProject": "\u5BFC\u5165\u9879\u76EE",
        "share.importFailed": "\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 JSON \u7ED3\u6784\u662F\u5426\u6B63\u786E\u3002",
        "pay.title": "\u652F\u4ED8 \u2014 {plan}",
        "pay.aria": "\u56FD\u5185\u652F\u4ED8",
        "pay.summaryLabel": "\u5347\u7EA7\u5957\u9910",
        "pay.free": "\u514D\u8D39",
        "pay.perMonth": "/ \u6708",
        "pay.alipayRedirectTitle": "\u6B63\u5728\u8DF3\u8F6C\u652F\u4ED8\u5B9D\u2026",
        "pay.alipayRedirectDesc": "\u8BF7\u5728\u65B0\u6253\u5F00\u7684\u6536\u94F6\u53F0\u5B8C\u6210\u4ED8\u6B3E\uFF0C\u5B8C\u6210\u540E\u5C06\u81EA\u52A8\u8FD4\u56DE\u5E76\u5347\u7EA7\u8BA2\u9605",
        "pay.secureNote": "\u4ED8\u6B3E\u7531\u652F\u4ED8\u5B9D / \u5FAE\u4FE1\u5B98\u65B9\u901A\u9053\u5904\u7406\uFF0C\u672C\u7AD9\u4E0D\u4FDD\u5B58\u652F\u4ED8\u5BC6\u7801",
        "pay.secureNoteAlipay": "\u4ED8\u6B3E\u7531\u652F\u4ED8\u5B9D\u5B98\u65B9\u6536\u94F6\u53F0\u5904\u7406\uFF0C\u672C\u7AD9\u4E0D\u4FDD\u5B58\u652F\u4ED8\u5BC6\u7801",
        "pay.secureNoteWechat": "\u4ED8\u6B3E\u7531\u5FAE\u4FE1\u5B98\u65B9\u901A\u9053\u5904\u7406\uFF0C\u672C\u7AD9\u4E0D\u4FDD\u5B58\u652F\u4ED8\u5BC6\u7801",
        "pay.wechatScan": "\u8BF7\u4F7F\u7528\u5FAE\u4FE1\u626B\u4E00\u626B\u5B8C\u6210\u652F\u4ED8",
        "pay.wechatQrAlt": "\u5FAE\u4FE1\u652F\u4ED8\u4E8C\u7EF4\u7801",
        "pay.wechatHint": "\u652F\u4ED8\u6210\u529F\u540E\u5C06\u81EA\u52A8\u5347\u7EA7\uFF0C\u8BF7\u52FF\u5173\u95ED\u6B64\u7A97\u53E3",
        "pay.alipay": "\u652F\u4ED8\u5B9D\u652F\u4ED8",
        "pay.wechat": "\u5FAE\u4FE1\u652F\u4ED8",
        "pay.createFailed": "\u521B\u5EFA\u652F\u4ED8\u5931\u8D25",
        "pay.channelInvalid": "\u652F\u4ED8\u6E20\u9053\u672A\u8FD4\u56DE\u6709\u6548\u6570\u636E",
        "pay.networkError": "\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
        "editor.loadingMonaco": "\u6B63\u5728\u52A0\u8F7D Monaco \u7F16\u8F91\u5668",
        "editor.loadTimeout": "Monaco \u7F16\u8F91\u5668\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u672C\u5730\u6784\u5EFA\u8D44\u6E90\u662F\u5426\u53EF\u8BBF\u95EE\u3002",
        "editor.loadFailed": "\u7F16\u8F91\u5668\u52A0\u8F7D\u5931\u8D25",
        "editor.reload": "\u91CD\u65B0\u52A0\u8F7D",
        "theme.title": "\u9009\u62E9\u4E3B\u9898",
        "theme.filter.all": "\u5168\u90E8",
        "theme.filter.dark": "\u6DF1\u8272",
        "theme.filter.light": "\u6D45\u8272",
        "theme.vs-dark.name": "\u6DF1\u8272\u4E3B\u9898",
        "theme.light.name": "\u6D45\u8272\u4E3B\u9898",
        "template.vanilla.desc": "\u7EAF JavaScript \u9879\u76EE\uFF0C\u4ECE\u96F6\u5F00\u59CB",
        "template.react.desc": "React 18 + Vite \u73B0\u4EE3\u5F00\u53D1\u73AF\u5883",
        "template.vue.desc": "Vue 3 \u7EC4\u5408\u5F0F API \u9879\u76EE",
        "template.node.desc": "Node.js \u540E\u7AEF\u9879\u76EE",
        "template.file.vanilla.indexJs.comment": "// \u4F60\u7684\u4EE3\u7801\u5728\u8FD9\u91CC",
        "template.file.node.indexJs.header": "// Node.js \u540E\u7AEF\u793A\u4F8B",
        "ai.provider.openai.name": "OpenAI",
        "ai.provider.openai.desc": "GPT-5.4 \u7CFB\u5217\u662F 2026 \u5E74 3 \u6708\u53D1\u5E03\u7684\u6700\u65B0\u65D7\u8230\u6A21\u578B\uFF0C\u7EDF\u4E00\u4E86 GPT \u4E0E Codex \u4EA7\u54C1\u7EBF",
        "ai.provider.deepseek.name": "DeepSeek",
        "ai.provider.deepseek.desc": "DeepSeek V4 \u5DF2\u4E8E 2026 \u5E74 4 \u6708 24 \u65E5\u53D1\u5E03\uFF08Preview\uFF09\uFF1B\u5B98\u65B9 API \u53EF\u7528\uFF0C\u6A21\u578B\u540D deepseek-v4-pro / deepseek-v4-flash",
        "ai.provider.claude.name": "Claude (Anthropic)",
        "ai.provider.claude.desc": "Claude Opus 4.6 \u4E0E Sonnet 4.6 \u4E3A 2026 \u5E74 2 \u6708\u53D1\u5E03\u7684\u6700\u65B0\u6A21\u578B\uFF0C\u7F16\u7A0B\u80FD\u529B\u9886\u5148",
        "ai.provider.google.name": "Google Gemini",
        "ai.provider.google.desc": "Gemini 3.1 Pro \u4E3A 2026 \u5E74 2 \u6708\u53D1\u5E03\u7684\u5168\u80FD\u65D7\u8230\uFF0C\u6027\u4EF7\u6BD4\u9AD8",
        "ai.provider.qwen.name": "\u901A\u4E49\u5343\u95EE (Qwen)",
        "ai.provider.qwen.desc": "Qwen 3.5 \u7CFB\u5217 2026 \u5E74 3 \u6708\u53D1\u5E03\uFF0C0.8B\u20139B \u5C0F\u6A21\u578B\u53EF\u5728 iPhone \u672C\u5730\u8FD0\u884C",
        "ai.provider.zhipu.name": "\u667A\u8C31 GLM",
        "ai.provider.zhipu.desc": "GLM-5 \u4E3A 2026 \u5E74\u91CD\u8981\u5F00\u6E90\u6A21\u578B\uFF0C744B \u53C2\u6570\uFF0C\u534E\u4E3A\u6607\u817E\u82AF\u7247\u8BAD\u7EC3",
        "ai.provider.minimax.name": "MiniMax",
        "ai.provider.minimax.desc": "MiniMax M2.5 \u5728 SWE-bench \u5F97\u5206 80.2%\uFF0C\u63A5\u8FD1 Claude Opus \u6C34\u5E73",
        "ai.provider.grok.name": "xAI Grok",
        "ai.provider.grok.desc": "Grok 4.20 \u7CFB\u5217\uFF1AAPI \u53EF\u7528\u6027\u53EF\u80FD\u53D6\u51B3\u4E8E\u8D26\u53F7\u6743\u9650/\u5730\u533A\uFF1B\u4E0D\u53EF\u7528\u65F6\u8BF7\u5207\u6362\u6A21\u578B\u6216 endpoint",
        "ai.provider.ollama.name": "Ollama (\u672C\u5730)",
        "ai.provider.ollama.desc": "Llama 4 Scout \u652F\u6301\u5343\u4E07\u7EA7 token \u4E0A\u4E0B\u6587\uFF0C\u5B8C\u5168\u5F00\u6E90",
        "ai.error.rateLimit": "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7 {seconds} \u79D2\u540E\u518D\u8BD5",
        "ai.error.aborted": "\u8BF7\u6C42\u5DF2\u53D6\u6D88",
        "ai.error.unsupportedProvider": "\u4E0D\u652F\u6301\u7684 AI \u63D0\u4F9B\u5546: {provider}",
        "ai.error.httpStatus": "API \u8BF7\u6C42\u5931\u8D25 ({status})",
        "ai.error.claudeStatus": "Claude API \u9519\u8BEF ({status})",
        "ai.error.geminiStatus": "Gemini API \u9519\u8BEF ({status})",
        "ai.error.geminiMessage": "Gemini API \u9519\u8BEF: {message}",
        "ai.error.ollamaNotRunning": "Ollama \u672A\u8FD0\u884C\uFF0C\u8BF7\u5148\u6267\u884C: ollama serve",
        "embedding.httpError": "Embedding API \u9519\u8BEF ({status}): {detail}",
        "mcp.error.missingResult": "MCP \u54CD\u5E94\u7F3A\u5C11 result",
        "mcp.error.requestFailed": "MCP \u8BF7\u6C42\u5931\u8D25 ({status})",
        "workspace.nameRequired": "\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A",
        "workspace.cloudSaveFailed": "\u4E91\u7AEF\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216\u7A0D\u540E\u91CD\u8BD5",
        "snippet.builtin.reactComponent.desc": "React \u51FD\u6570\u7EC4\u4EF6\u6A21\u677F",
        "snippet.builtin.useEffect.desc": "React useEffect \u6A21\u677F",
        "snippet.builtin.asyncFn.desc": "\u5F02\u6B65\u51FD\u6570\u6A21\u677F",
        "snippet.builtin.pythonClass.desc": "Python \u7C7B\u5B9A\u4E49\u6A21\u677F",
        "snippet.builtin.fetchApi.desc": "Fetch API \u8BF7\u6C42\u6A21\u677F",
        "usage.quota.exceeded": "\u4ECA\u5929\u7684 AI \u8BF7\u6C42\u989D\u5EA6\u5DF2\u7528\u5B8C\uFF08{used}/{limit}\uFF09",
        "usage.quota.syncFailed": "\u65E0\u6CD5\u540C\u6B65 AI \u914D\u989D\u5230\u670D\u52A1\u5668\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5",
        "auth.error.notLoggedIn": "\u672A\u767B\u5F55",
        "workspace.invalidData": "\u65E0\u6548\u7684\u5DE5\u4F5C\u533A\u6570\u636E",
        "workspace.importSuffix": "\uFF08\u5BFC\u5165\uFF09",
        "workspace.autoBackup.name": "\u81EA\u52A8\u5907\u4EFD",
        "workspace.autoBackup.desc": "\u7CFB\u7EDF\u81EA\u52A8\u521B\u5EFA\u7684\u6062\u590D\u5FEB\u7167",
        "workspace.autosave.name": "\u81EA\u52A8\u4FDD\u5B58",
        "workspace.autosave.project": "\u81EA\u52A8\u4FDD\u5B58\u9879\u76EE",
        "mcp.ping.emptyUrl": "URL \u4E3A\u7A7A",
        "mcp.ping.toolsListed": "\u53EF\u5217\u51FA {count} \u4E2A\u5DE5\u5177",
        "mention.section.title": "\u7528\u6237 @ \u63D0\u53CA\u7684\u4EE3\u7801\u4E0A\u4E0B\u6587",
        "mention.section.intro": "\u7528\u6237\u5728\u6D88\u606F\u4E2D\u7528 @ \u5F15\u7528\u4E86\u4EE5\u4E0B\u6587\u4EF6/\u7B26\u53F7\uFF0C\u8BF7\u4F18\u5148\u7ED3\u5408\u8FD9\u4E9B\u5185\u5BB9\u56DE\u7B54\uFF1A",
        "mention.header.file": "### @{token} \u2192 `{path}`",
        "mention.header.symbol": "### @{token} \u2192 `{path}` \u7B26\u53F7 `{symbol}`\uFF08\u7EA6\u7B2C {line} \u884C\uFF09",
        "mention.section.truncated": "\uFF08\u66F4\u591A @ \u63D0\u53CA\u56E0\u957F\u5EA6\u9650\u5236\u672A\u5C55\u5F00\uFF0C\u8BF7\u7F29\u5C0F\u63D0\u53CA\u8303\u56F4\u6216\u5173\u95ED\u90E8\u5206\u5DE5\u4F5C\u533A\u6587\u4EF6\u3002\uFF09",
        "semantic.section.title": "\u8BED\u4E49\u68C0\u7D22\u76F8\u5173\u7247\u6BB5\uFF08BYOK Embedding\uFF09",
        "semantic.hitLine": "{index}. {path} (\u76F8\u5173\u5EA6 {score}%)\n```\n{text}\n```",
        "semantic.error.generic": "\u8BED\u4E49\u68C0\u7D22\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7",
        "plugin.perm.required": "\u81F3\u5C11\u58F0\u660E\u4E00\u9879\u6743\u9650",
        "plugin.perm.terminalDeprecated": "\u4E0D\u518D\u652F\u6301 terminal \u5168\u6743\u6743\u9650\uFF0C\u8BF7\u6539\u7528 terminal:safe",
        "plugin.perm.unknown": "\u672A\u77E5\u6743\u9650: {perm}",
        "format.error.bracketMismatch": "\u4F4D\u7F6E {pos}: \u62EC\u53F7\u4E0D\u5339\u914D\uFF0C\u671F\u671B {expected} \u4F46\u5F97\u5230 {actual}",
        "format.error.stringUnclosed": "\u4F4D\u7F6E {pos}: \u5B57\u7B26\u4E32\u5F15\u53F7\u672A\u95ED\u5408",
        "format.error.unclosedBrackets": "\u6709\u672A\u95ED\u5408\u7684\u62EC\u53F7: {stack}",
        "github.error.repoNotFound": "\u4ED3\u5E93\u4E0D\u5B58\u5728\u6216\u79C1\u6709",
        "review.summary.done": "\u5BA1\u67E5\u5B8C\u6210",
        "review.summary.partial": "\u4EE3\u7801\u5BA1\u67E5\u5B8C\u6210\uFF08\u89E3\u6790\u7ED3\u679C\u4E0D\u5B8C\u6574\uFF09",
        "review.summary.failed": "\u5BA1\u67E5\u5931\u8D25: {message}",
        "review.summary.failedUnknown": "\u672A\u77E5\u9519\u8BEF",
        "review.issue.debugLog": "\u53D1\u73B0\u8C03\u8BD5\u8F93\u51FA\u8BED\u53E5\uFF0C\u5EFA\u8BAE\u751F\u4EA7\u73AF\u5883\u79FB\u9664",
        "review.issue.debugSuggestion": "\u4F7F\u7528\u65E5\u5FD7\u5E93\u66FF\u4EE3\u6216\u79FB\u9664\u8C03\u8BD5\u4EE3\u7801",
        "review.issue.todo": "\u6709\u5F85\u529E\u4E8B\u9879\uFF08TODO\uFF09\u672A\u5904\u7406",
        "review.issue.lineLength": "\u884C\u957F\u5EA6\u8D85\u8FC7100\u5B57\u7B26",
        "review.issue.lineLengthSuggestion": "\u5EFA\u8BAE\u6362\u884C\u4EE5\u63D0\u9AD8\u53EF\u8BFB\u6027",
        "review.issue.looseEqual": "\u4F7F\u7528\u4E86 == \u800C\u975E ===",
        "review.issue.looseEqualSuggestion": "\u5EFA\u8BAE\u4F7F\u7528 === \u8FDB\u884C\u4E25\u683C\u76F8\u7B49\u6BD4\u8F83",
        "testGen.apiKeyRequired": "\u8BF7\u5148\u5728 AI \u8BBE\u7F6E\u4E2D\u914D\u7F6E API Key",
        "embedding.apiKeyRequired": "\u9700\u8981\u914D\u7F6E API Key \u624D\u80FD\u4F7F\u7528\u8BED\u4E49\u68C0\u7D22",
        "embedding.emptyResponse": "Embedding API \u8FD4\u56DE\u4E3A\u7A7A",
        "editor.inlineCompletion.label": "AI \u8865\u5168",
        "projectRules.template": `# \u9879\u76EE\u89C4\u5219 (.aide/rules.md)

- \u4F7F\u7528 TypeScript strict \u6A21\u5F0F
- \u4F18\u5148\u5C0F\u6B65\u63D0\u4EA4\u3001\u4FDD\u6301\u6D4B\u8BD5\u901A\u8FC7
- \u56DE\u590D\u7528\u6237\u65F6\u4F7F\u7528\u7B80\u6D01\u4E2D\u6587
`,
        "projectRules.sectionTitle": "\u9879\u76EE\u89C4\u5219\uFF08.aide/rules\uFF09",
        "projectTasks.template": `# \u4EFB\u52A1\u6E05\u5355 (.aide/tasks.md)

- [ ] \u5B9E\u73B0\u6838\u5FC3\u529F\u80FD
- [ ] \u8865\u5145\u6D4B\u8BD5
- [ ] \u66F4\u65B0\u6587\u6863
`,
        "projectTasks.sectionTitle": "\u5F85\u529E\u4EFB\u52A1\uFF08.aide/tasks\uFF09",
        "workspace.error.unnamed": "\u672A\u547D\u540D\u5DE5\u4F5C\u533A",
        "workspace.error.fileTooLarge": "\u6587\u4EF6 {name} \u8D85\u8FC7 1MB \u9650\u5236",
        "workspace.error.totalTooLarge": "\u5DE5\u4F5C\u533A\u603B\u5927\u5C0F\u8D85\u8FC7 10MB \u9650\u5236",
        "workspace.error.fileCountTooLarge": "\u5DE5\u4F5C\u533A\u6587\u4EF6\u6570\u8D85\u8FC7 {max} \u4E2A\u9650\u5236",
        "workspace.error.readFailed": "\u8BFB\u53D6\u6587\u4EF6 {name} \u5931\u8D25",
        "workspace.error.unknown": "\u672A\u77E5\u9519\u8BEF",
        "workspace.default.importProject": "\u5BFC\u5165\u7684\u9879\u76EE",
        "quota.formatUnlimited": "{used} / \u4E0D\u9650",
        "quota.formatLimited": "{used}/{limit}",
        "plugin.catalog.tag.demo": "\u793A\u4F8B",
        "plugin.catalog.tag.tools": "\u5DE5\u5177",
        "plugin.catalog.tag.ui": "UI",
        "plugin.catalog.tag.formatter": "\u683C\u5F0F\u5316",
        "plugin.catalog.tag.productivity": "\u6548\u7387",
        "plugin.catalog.tag.markdown": "Markdown",
        "plugin.filter.all": "\u5168\u90E8",
        "plugin.filter.empty": "\u6CA1\u6709\u7B26\u5408\u8BE5\u6807\u7B7E\u7684\u63D2\u4EF6",
        "plugin.rating.title": "\u5B98\u65B9\u63A8\u8350\u8BC4\u5206",
        "plugin.catalog.json-formatter.name": "JSON \u683C\u5F0F\u5316",
        "plugin.catalog.json-formatter.desc": "\u7F8E\u5316\u5F53\u524D\u7F16\u8F91\u5668\u4E2D\u7684 JSON",
        "plugin.catalog.todo-scanner.name": "TODO \u626B\u63CF",
        "plugin.catalog.todo-scanner.desc": "\u626B\u63CF\u5DE5\u4F5C\u533A TODO/FIXME/HACK",
        "plugin.catalog.line-counter.name": "\u4EE3\u7801\u884C\u6570\u7EDF\u8BA1",
        "plugin.catalog.line-counter.desc": "\u7EDF\u8BA1\u5DE5\u4F5C\u533A\u6587\u4EF6\u603B\u884C\u6570",
        "plugin.catalog.md-preview-plus.name": "Markdown \u9884\u89C8+",
        "plugin.catalog.md-preview-plus.desc": "\u5F39\u7A97\u9884\u89C8\u5F53\u524D Markdown \u6587\u4EF6",
        "plugin.catalog.hello-sandbox.name": "Hello \u6C99\u7BB1",
        "plugin.catalog.hello-sandbox.desc": "\u6F14\u793A\u63D2\u4EF6\u6C99\u7BB1\uFF1A\u901A\u77E5 + \u5DE5\u5177\u680F\u6309\u94AE",
        "plugin.catalog.workspace-hints.name": "\u5DE5\u4F5C\u533A\u63D0\u793A",
        "plugin.catalog.workspace-hints.desc": "\u5728\u5DE5\u5177\u680F\u663E\u793A\u5F53\u524D\u6253\u5F00\u6587\u4EF6\u6570\u91CF\uFF08\u4EC5 UI \u6743\u9650\uFF09",
        "subscription.upgraded": "\u5DF2\u5347\u7EA7\u4E3A {plan}",
        "subscription.betaNote": "\u5F53\u524D\u4E3A\u516C\u6D4B\u671F\uFF0C\u4E13\u4E1A\u7248\u4E0E\u56E2\u961F\u7248\u529F\u80FD\u514D\u8D39\u5F00\u653E\uFF1B\u6B63\u5F0F\u6536\u6B3E\u63A5\u5165\u540E\u5C06\u5728\u6B64\u5F00\u542F\u5347\u7EA7\u3002",
        "subscription.pricing.live": "\u652F\u6301{methods}\uFF1B\u4E13\u4E1A\u7248 \xA519/\u6708\uFF0C\u56E2\u961F\u7248 \xA549/\u6708",
        "subscription.pricing.dev": "\u5F00\u53D1/\u96C6\u6210\u73AF\u5883\uFF1A\u53EF\u4E00\u952E\u6A21\u62DF\u5347\u7EA7\uFF08\u672A\u914D\u7F6E\u5546\u6237\u65F6\uFF09",
        "subscription.payMethod.alipay": "\u652F\u4ED8\u5B9D",
        "subscription.payMethod.wechat": "\u5FAE\u4FE1",
        "subscription.payMethod.stripe": "Stripe",
        "auth.error.network": "\u65E0\u6CD5\u8FDE\u63A5\u670D\u52A1\u5668\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5",
        "auth.error.accountNotFound": "\u8D26\u53F7\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u6CE8\u518C",
        "auth.error.emailRegistered": "\u90AE\u7BB1\u5DF2\u6CE8\u518C\uFF0C\u8BF7\u76F4\u63A5\u767B\u5F55",
        "auth.api.required": "\u90AE\u7BB1\u548C\u5BC6\u7801\u5FC5\u586B",
        "auth.api.emailRequired": "\u90AE\u7BB1\u5FC5\u586B",
        "auth.api.emailTaken": "\u90AE\u7BB1\u5DF2\u6CE8\u518C",
        "auth.api.oauthSyncFailed": "OAuth \u767B\u5F55\u540C\u6B65\u5931\u8D25",
        "auth.api.oauthSessionInvalid": "OAuth \u4F1A\u8BDD\u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55",
        "auth.api.oauthUserMissing": "\u672A\u627E\u5230 OAuth \u7528\u6237\uFF0C\u8BF7\u91CD\u8BD5",
        "plugin.error.emptyJson": "\u8BF7\u8F93\u5165\u63D2\u4EF6\u5305 JSON",
        "plugin.error.prodDisabled": "\u751F\u4EA7\u73AF\u5883\u9ED8\u8BA4\u7981\u7528\u7B2C\u4E09\u65B9\u63D2\u4EF6\uFF08\u4EC5\u5141\u8BB8\u5185\u7F6E\u63D2\u4EF6\uFF09",
        "plugin.error.remoteDisabled": "\u8FDC\u7A0B\u63D2\u4EF6\u52A0\u8F7D\u5C1A\u672A\u5F00\u653E\uFF0C\u8BF7\u7C98\u8D34\u63D2\u4EF6 JSON \u5305",
        "plugin.error.invalidShape": "JSON \u987B\u5305\u542B manifest \u4E0E source \u5B57\u6BB5",
        "plugin.error.parseFailed": "\u65E0\u6CD5\u89E3\u6790\u63D2\u4EF6 JSON",
        "plugin.error.noToolbar": "\u63D2\u4EF6\u65E0\u6743\u8BBF\u95EE ui.addToolbarButton",
        "plugin.catalog.notFound": "\u63D2\u4EF6\u4E0D\u5728\u5B98\u65B9\u76EE\u5F55\u4E2D",
        "plugin.catalog.storageFailed": "\u63D2\u4EF6\u5DF2\u6CE8\u518C\u4F46\u672A\u80FD\u5199\u5165\u672C\u5730\u5B58\u50A8",
        "plugin.builtin.format.name": "\u4EE3\u7801\u683C\u5F0F\u5316",
        "plugin.builtin.format.desc": "\u683C\u5F0F\u5316\u5F53\u524D\u6587\u4EF6\u4EE3\u7801",
        "plugin.builtin.format.label": "\u683C\u5F0F\u5316",
        "plugin.builtin.format.done": "\u4EE3\u7801\u5DF2\u683C\u5F0F\u5316",
        "plugin.builtin.stats.name": "\u4EE3\u7801\u7EDF\u8BA1",
        "plugin.builtin.stats.desc": "\u7EDF\u8BA1\u4EE3\u7801\u884C\u6570",
        "plugin.builtin.stats.label": "\u7EDF\u8BA1",
        "plugin.builtin.stats.title": "\u4EE3\u7801\u7EDF\u8BA1",
        "plugin.builtin.stats.body": "\u6587\u4EF6\u6570: {files}\n\u603B\u884C\u6570: {lines}\n\u603B\u5B57\u7B26: {chars}",
        "wp.notify.partialImport": "\u90E8\u5206\u6587\u4EF6\u5BFC\u5165\u5931\u8D25",
        "wp.notify.partialImportDetail": "{errors}",
        "runtime.webcontainer.bootFailed": "WebContainer \u542F\u52A8\u5931\u8D25",
        "runtime.webcontainer.notReady": "WebContainer \u8FD8\u672A\u5C31\u7EEA",
        "runtime.webcontainer.busy": "\u5DF2\u6709\u547D\u4EE4\u6B63\u5728\u8FD0\u884C",
        "network.error.generic": "\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
        "network.error.offline": "\u65E0\u6CD5\u8FDE\u63A5\u670D\u52A1\u5668\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5",
        "editor.defaultFileComment": "// \u6B22\u8FCE\u4F7F\u7528 AI IDE",
        "plugin.context.terminalNotReady": "\u7EC8\u7AEF\u5C1A\u672A\u5C31\u7EEA",
        "plugin.context.apiKeyRequired": "\u8BF7\u5148\u5728 AI \u8BBE\u7F6E\u4E2D\u914D\u7F6E API Key",
        "plugin.context.toolbarNoPluginId": "\u63D2\u4EF6\u5DE5\u5177\u680F\u6309\u94AE\u672A\u7ED1\u5B9A pluginId",
        "plugin.sandbox.invalidId": "\u63D2\u4EF6 id \u987B\u4E3A\u5C0F\u5199\u5B57\u6BCD/\u6570\u5B57/\u8FDE\u5B57\u7B26\uFF0C\u4E14\u4EE5\u5B57\u6BCD\u5F00\u5934",
        "plugin.sandbox.nameRequired": "\u63D2\u4EF6\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A",
        "plugin.sandbox.versionRequired": "\u63D2\u4EF6\u7248\u672C\u4E0D\u80FD\u4E3A\u7A7A",
        "plugin.sandbox.codeEmpty": "\u63D2\u4EF6\u4EE3\u7801\u4E0D\u80FD\u4E3A\u7A7A",
        "plugin.sandbox.codeTooLarge": "\u63D2\u4EF6\u4EE3\u7801\u8D85\u8FC7 32KB \u9650\u5236",
        "plugin.sandbox.blockedPattern": "\u63D2\u4EF6\u4EE3\u7801\u5305\u542B\u4E0D\u5141\u8BB8\u7684\u6A21\u5F0F: {pattern}",
        "plugin.sandbox.denied": "\u63D2\u4EF6\u65E0\u6743\u8BBF\u95EE {name}",
        "plugin.sandbox.terminalCommandDenied": "\u63D2\u4EF6\u65E0\u6743\u6267\u884C\u8BE5\u7EC8\u7AEF\u547D\u4EE4\uFF08\u4EC5\u5141\u8BB8\u5B89\u5168\u547D\u4EE4\u767D\u540D\u5355\uFF09",
        "plugin.sandbox.prodMainThread": "\u751F\u4EA7\u73AF\u5883\u7981\u6B62\u5728\u4E3B\u7EBF\u7A0B\u6267\u884C\u63D2\u4EF6\u4EE3\u7801\uFF0C\u8BF7\u4F7F\u7528 Worker \u6C99\u7BB1",
        "plugin.sandbox.activateRequired": "\u63D2\u4EF6\u987B\u5B9A\u4E49 activate(context) \u51FD\u6570",
        "plugin.sandbox.workerUnsupported": "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301 Web Worker \u63D2\u4EF6\u6C99\u7BB1",
        "plugin.sandbox.activateTimeout": "\u63D2\u4EF6\u6FC0\u6D3B\u8D85\u65F6\uFF08{ms}ms\uFF09",
        "plugin.sandbox.activateFailed": "\u63D2\u4EF6\u6FC0\u6D3B\u5931\u8D25",
        "plugin.sandbox.workerError": "\u63D2\u4EF6 Worker \u8FD0\u884C\u9519\u8BEF",
        "plugin.sandbox.apiTimeout": "\u63D2\u4EF6 API \u8C03\u7528\u8D85\u65F6: {path}",
        "plugin.sandbox.apiFailed": "\u63D2\u4EF6 API \u8C03\u7528\u5931\u8D25",
        "plugin.sandbox.unknownApi": "\u672A\u77E5\u63D2\u4EF6 API: {path}",
        "plugin.i18n.invalidShape": "manifest.i18n \u987B\u4E3A\u6309\u8BED\u8A00\u5206\u7EC4\u7684\u5B57\u7B26\u4E32\u8868",
        "plugin.i18n.unsupportedLocale": "manifest.i18n \u4E0D\u652F\u6301\u7684\u8BED\u8A00: {locale}",
        "plugin.i18n.tooManyKeys": "manifest.i18n.{locale} \u8BCD\u6761\u8FC7\u591A\uFF08\u6700\u591A {max} \u4E2A\uFF09",
        "plugin.i18n.invalidKey": "manifest.i18n \u952E\u540D\u65E0\u6548: {key}",
        "plugin.i18n.invalidValue": "manifest.i18n \u8BCD\u6761\u987B\u4E3A\u5B57\u7B26\u4E32: {key}",
        "plugin.i18n.valueTooLong": "manifest.i18n \u8BCD\u6761\u8FC7\u957F: {key}\uFF08\u6700\u591A {max} \u5B57\u7B26\uFF09",
        "plugin.i18n.totalTooLarge": "manifest.i18n \u603B\u5B57\u7B26\u6570\u8D85\u8FC7 {max}",
        "plugin.manual.i18nHint": '\u53EF\u9009 manifest.i18n\uFF08zh-CN / en-US\uFF09\u4E0E activate \u5185 context.t("key")\uFF1B\u8BE6\u89C1 docs/PLUGIN_I18N.md',
        "plugin.example.hello.notify": "\u63D2\u4EF6\u6C99\u7BB1\u8FD0\u884C\u6B63\u5E38",
        "plugin.example.workspace.toolbar": "\u6587\u4EF6 {count}",
        "plugin.example.workspace.modalTitle": "\u5DE5\u4F5C\u533A",
        "plugin.example.workspace.modalBody": "\u5F53\u524D\u7F16\u8F91\u5668\u4E2D\u5171\u6709 {count} \u4E2A\u6587\u4EF6\u3002",
        "queue.panel.title": "\u4EFB\u52A1\u961F\u5217",
        "queue.panel.sessionStatus": "\u4F1A\u8BDD\u72B6\u6001\uFF1A{status}",
        "queue.panel.copyReport": "\u590D\u5236\u62A5\u544A",
        "queue.panel.saveReport": "\u4FDD\u5B58\u5230 .aide/reports",
        "queue.panel.openLatestReport": "\u6253\u5F00\u6700\u65B0\u62A5\u544A",
        "queue.panel.restoreFromLatest": "\u4ECE\u6700\u65B0\u62A5\u544A\u6062\u590D",
        "queue.sessionStats.corrupted": "\u961F\u5217\u7EDF\u8BA1\u6570\u636E\u5DF2\u635F\u574F\uFF0C\u5DF2\u91CD\u7F6E",
        "queue.panel.activeTask": "\u5F53\u524D\u6267\u884C\uFF1A{task}",
        "queue.panel.failureStats": "\u5931\u8D25\u7EDF\u8BA1\uFF1APlan {plan} \xB7 Spec {spec}",
        "queue.panel.resetFailure": "\u91CD\u7F6E\u7EDF\u8BA1",
        "queue.panel.successStats": "\u6210\u529F\u7EDF\u8BA1\uFF1APlan {plan} \xB7 Spec {spec}",
        "queue.panel.resetSuccess": "\u91CD\u7F6E\u6210\u529F\u7EDF\u8BA1",
        "queue.panel.recentDone": "\u6700\u8FD1\u5B8C\u6210\uFF1A",
        "queue.panel.waitingPrompt": "\u7B49\u5F85\u6267\u884C\uFF1A{text}",
        "queue.panel.specQueueCount": "Spec \u961F\u5217\uFF1A{count} \u6B65\u5F85\u6267\u884C",
        "queue.panel.planQueueCount": "\u8BA1\u5212\u961F\u5217\uFF1A{count} \u6B65\u5F85\u6267\u884C",
        "queue.panel.clearSpec": "\u6E05\u7A7A Spec \u961F\u5217",
        "queue.panel.clearPlan": "\u6E05\u7A7A\u8BA1\u5212\u961F\u5217",
        "queue.panel.planFailed": "\u6267\u884C\u5931\u8D25\uFF1A{step}\uFF08{error}\uFF09",
        "queue.panel.specFailed": "Spec \u6267\u884C\u5931\u8D25\uFF1A{task}\uFF08{error}\uFF09",
        "queue.panel.retryPlan": "\u91CD\u8BD5\u5F53\u524D\u6B65",
        "queue.panel.retrySpec": "\u91CD\u8BD5\u5F53\u524D\u4EFB\u52A1",
        "queue.panel.skipContinue": "\u8DF3\u8FC7\u7EE7\u7EED",
        "queue.panel.sendQueue": "\u6392\u961F\u4E2D\uFF1A",
        "queue.panel.sendQueueMore": "+{count} \u66F4\u591A",
        "queue.preview.title": "\u961F\u5217\u9884\u89C8",
        "queue.preview.planTag": "Plan",
        "queue.preview.specTag": "Spec",
        "queue.preview.expand": "\u5C55\u5F00\u5176\u4F59 {count} \u6761",
        "queue.preview.collapse": "\u6536\u8D77\u9884\u89C8",
        "queue.persist.corruptedTitle": "\u961F\u5217\u6570\u636E\u5DF2\u91CD\u7F6E",
        "queue.persist.corruptedDetail": "\u672C\u5730\u961F\u5217\u5B58\u50A8\u635F\u574F\u6216\u7248\u672C\u4E0D\u517C\u5BB9\uFF0C\u5DF2\u6E05\u7A7A\u961F\u5217\uFF0C\u8BF7\u4ECE\u62A5\u544A\u6062\u590D\u6216\u91CD\u65B0\u5165\u961F\u3002",
        "plan.overview.title": "\u8BA1\u5212\u603B\u89C8",
        "plan.overview.desc": "\u8BA1\u5212 {planCount} \u4E2A \xB7 \u672A\u5B8C\u6210\u6B65\u9AA4 {openSteps} \u4E2A \xB7 Plan \u961F\u5217 {planQueueCount} \xB7 Spec \u961F\u5217 {specQueueCount} \xB7 \u6700\u8FD1\u62A5\u544A {latestReportAt}",
        "plan.overview.running": "\u6267\u884C\u4E2D",
        "plan.overview.idle": "\u7A7A\u95F2",
        "plan.overview.noReport": "\u6682\u65E0",
        "plan.catalog.title": "Plan \u7BA1\u7406\uFF08\u591A\u8BA1\u5212\uFF09",
        "plan.catalog.desc": "\u7BA1\u7406 `.aide/plans/` \u4E0B\u7684\u8BA1\u5212\u6587\u4EF6\uFF1A\u7B5B\u9009\u3001\u6392\u5E8F\u3001\u6458\u8981\u67E5\u770B\uFF0C\u5E76\u53EF\u9009\u62E9\u591A\u4E2A\u6B65\u9AA4\u6267\u884C\uFF08\u6267\u884C\u7ED3\u679C\u4F1A\u56DE\u586B\u5230 plan \u6587\u4EF6\uFF09\u3002",
        "plan.catalog.searchPlaceholder": "\u641C\u7D22\u8BA1\u5212\u540D / \u8DEF\u5F84 / \u6807\u7B7E",
        "plan.catalog.sort.recentExec": "\u6309\u6700\u8FD1\u6267\u884C",
        "plan.catalog.sort.mostOpen": "\u6309\u672A\u5B8C\u6210\u6B65\u9AA4\u6570",
        "plan.catalog.sort.title": "\u6309\u6807\u9898",
        "plan.catalog.mapTargetDefault": "\u6620\u5C04\u76EE\u6807\uFF1A\u9ED8\u8BA4\u6700\u8FD1 Spec",
        "plan.catalog.createFromTemplate": "\u4ECE\u6A21\u677F\u521B\u5EFA",
        "plan.catalog.newPlanPlaceholder": "\u65B0\u8BA1\u5212\u6807\u9898\uFF0C\u4F8B\u5982\uFF1A\u767B\u5F55\u4F18\u5316",
        "plan.catalog.templateCustom": " (\u81EA\u5B9A\u4E49)",
        "plan.catalog.showMore": "\u663E\u793A\u66F4\u591A",
        "plan.catalog.empty": "\u8FD8\u6CA1\u6709\u8BA1\u5212\u6587\u4EF6\u3002\u53EF\u5728 Chat \u5F00\u542F Plan \u6A21\u5F0F\u751F\u6210\uFF0C\u6216\u4F7F\u7528\u4E0A\u65B9\u6A21\u677F\u521B\u5EFA\u3002",
        "plan.catalog.mappedCount": "\u5DF2\u6620\u5C04 {count}",
        "plan.catalog.open": "\u6253\u5F00",
        "plan.catalog.run": "\u6267\u884C\u9009\u4E2D",
        "plan.catalog.map": "\u6620\u5C04\u5230 Spec",
        "plan.catalog.mapAndRun": "\u6620\u5C04\u5E76\u6267\u884C",
        "plan.catalog.delete": "\u5220\u9664",
        "plan.catalog.todoBadge": "\u5F85\u529E {count}",
        "plan.catalog.lastExecuted": "\u6700\u8FD1\u6267\u884C {time}",
        "plan.catalog.notExecuted": "\u5C1A\u672A\u6267\u884C",
        "plan.catalog.noOpenSteps": "\u65E0\u672A\u5B8C\u6210\u6B65\u9AA4",
        "plan.catalog.runSteps": "\u6267\u884C\u6B65\u9AA4",
        "plan.catalog.queueAllOpen": "\u5165\u961F\u5168\u90E8\u672A\u5B8C\u6210 ({count})",
        "plan.catalog.markDone": "\u6807\u8BB0\u5B8C\u6210",
        "plan.catalog.openLinkedSpec": "\u6253\u5F00 Spec",
        "plan.catalog.duplicate": "\u590D\u5236\u8BA1\u5212",
        "plan.overview.syncAide": "\u540C\u6B65 .aide \u5230\u5DE5\u4F5C\u533A\u7D22\u5F15",
        "plan.overview.syncAideHint": "\u8BA9 AI \u7D22\u5F15\u4E0E\u7F16\u8F91\u5668\u4E2D\u7684 plans/specs/reports \u4E00\u81F4\uFF08\u4E0D\u8986\u76D6\u975E .aide \u6587\u4EF6\uFF09",
        "plan.overview.openLatestReport": "\u6253\u5F00\u6700\u65B0\u62A5\u544A",
        "plan.overview.goPlans": "\u67E5\u770B\u8BA1\u5212\u76EE\u5F55",
        "plan.overview.goReports": "\u67E5\u770B\u6267\u884C\u62A5\u544A",
        "spec.catalog.openLinkedPlan": "\u6253\u5F00\u8BA1\u5212",
        "spec.catalog.title": "Specs \u76EE\u5F55\uFF08.aide/specs\uFF09",
        "spec.catalog.desc": "\u6309 Spec \u6D4F\u89C8\u4EFB\u52A1\u8FDB\u5EA6\uFF0C\u652F\u6301\u641C\u7D22\u3001\u6392\u5E8F\uFF0C\u5E76\u6253\u5F00 tasks / acceptance\u3002",
        "spec.catalog.searchPlaceholder": "\u641C\u7D22 Spec \u540D / \u8DEF\u5F84",
        "spec.catalog.sort.recentExec": "\u6309\u6700\u8FD1\u6267\u884C",
        "spec.catalog.sort.mostOpen": "\u6309\u672A\u5B8C\u6210\u6570",
        "spec.catalog.sort.title": "\u6309\u540D\u79F0",
        "spec.catalog.namePlaceholder": "\u65B0 Spec \u540D\u79F0",
        "spec.catalog.create": "\u521B\u5EFA Spec",
        "spec.catalog.openRoot": "\u6253\u5F00 specs \u6839\u76EE\u5F55",
        "spec.catalog.showMore": "\u663E\u793A\u66F4\u591A",
        "spec.catalog.empty": "\u8FD8\u6CA1\u6709 Spec\u3002\u8F93\u5165\u540D\u79F0\u540E\u70B9\u51FB\u300C\u521B\u5EFA Spec\u300D\u3002",
        "spec.catalog.sourcePlans": "\u6765\u6E90\u8BA1\u5212",
        "spec.catalog.openTasks": "\u6253\u5F00 tasks",
        "spec.catalog.openAcceptance": "\u6253\u5F00 acceptance",
        "spec.catalog.runFirst": "\u6267\u884C\u9996\u6761\u672A\u5B8C\u6210",
        "report.catalog.title": "\u6267\u884C\u62A5\u544A\uFF08.aide/reports\uFF09",
        "report.catalog.desc": "\u67E5\u770B\u3001\u6062\u590D\u961F\u5217\u3001\u6253\u5F00\u4E0E\u5220\u9664\u62A5\u544A\uFF1B\u652F\u6301\u591A\u9009\u5220\u9664\u3001\u53EA\u4FDD\u7559\u6700\u8FD1 N \u4EFD\u3001\u5BFC\u51FA\u9009\u4E2D ZIP\u3002",
        "report.catalog.autoSave": "\u961F\u5217\u5B8C\u6210\u65F6\u81EA\u52A8\u4FDD\u5B58\u62A5\u544A\u5230 .aide/reports",
        "report.catalog.notify": "\u961F\u5217\u5B8C\u6210\u65F6\u6D4F\u89C8\u5668\u901A\u77E5\uFF08\u9700\u6388\u6743\uFF09",
        "report.catalog.searchPlaceholder": "\u641C\u7D22\u62A5\u544A\u6807\u9898 / \u8DEF\u5F84 / \u72B6\u6001",
        "report.catalog.sort.recent": "\u6309\u751F\u6210\u65F6\u95F4",
        "report.catalog.sort.title": "\u6309\u6807\u9898",
        "report.catalog.selectAll": "\u5168\u9009\u5F53\u524D\u5217\u8868",
        "report.catalog.keepRecent": "\u4FDD\u7559\u6700\u8FD1",
        "report.catalog.keepUnit": "\u4EFD",
        "report.catalog.prune": "\u6E05\u7406\u65E7\u62A5\u544A",
        "report.catalog.deleteSelected": "\u5220\u9664\u9009\u4E2D",
        "report.catalog.exportZip": "\u5BFC\u51FA\u9009\u4E2D ZIP",
        "report.catalog.shownCount": "\u5DF2\u663E\u793A {shown} / {filtered} \u6761\u62A5\u544A",
        "report.catalog.totalCount": "\uFF08\u5171 {total} \u4EFD\uFF09",
        "report.catalog.showMore": "\u663E\u793A\u66F4\u591A",
        "report.catalog.empty": "\u8FD8\u6CA1\u6709\u62A5\u544A\u6587\u4EF6\u3002\u53EF\u5728 Chat \u4EFB\u52A1\u961F\u5217\u4E2D\u70B9\u51FB\u300C\u4FDD\u5B58\u5230 .aide/reports\u300D\u751F\u6210\u3002",
        "report.catalog.open": "\u6253\u5F00",
        "report.catalog.restore": "\u6062\u590D\u961F\u5217",
        "report.catalog.delete": "\u5220\u9664",
        "report.catalog.status": "\u72B6\u6001\uFF1A{status}",
        "report.catalog.summary": "\u7EDF\u8BA1\uFF1A{summary}",
        "report.catalog.timeUnknown": "\u65F6\u95F4\u672A\u77E5",
        "report.catalog.previewRestore": "\u9884\u89C8\u6062\u590D",
        "report.catalog.previewRestoreTitle": "\u5C06\u6062\u590D\u4EE5\u4E0B\u961F\u5217\u9879",
        "report.catalog.confirmRestore": "\u786E\u8BA4\u6062\u590D\u5165\u961F",
        "plan.syncAfterWrite.confirm.title": "\u540C\u6B65 .aide \u5230\u5DE5\u4F5C\u533A\u7D22\u5F15\uFF1F",
        "plan.syncAfterWrite.confirm.message": "\u8BA1\u5212\u6587\u4EF6\u5DF2\u5199\u5165\u7F16\u8F91\u5668\u3002\u662F\u5426\u5C06 .aide/ \u7EB3\u5165 AI \u7D22\u5F15\uFF0C\u4EE5\u4FBF @ \u4E0E\u8BED\u4E49\u68C0\u7D22\u53EF\u89C1\uFF1F",
        "plan.syncAfterWrite.confirm.confirm": "\u540C\u6B65",
        "plan.host.createFailed.title": "\u521B\u5EFA\u5931\u8D25",
        "plan.host.createFailed.detail": "\u672A\u627E\u5230\u6240\u9009\u8BA1\u5212\u6A21\u677F",
        "plan.host.created.title": "\u8BA1\u5212\u5DF2\u521B\u5EFA",
        "plan.host.created.detail": "{path}",
        "plan.host.duplicateFailed.title": "\u590D\u5236\u5931\u8D25",
        "plan.host.duplicateFailed.detail": "\u672A\u627E\u5230\u53EF\u590D\u5236\u7684\u8BA1\u5212\u6587\u4EF6",
        "plan.host.duplicated.title": "\u8BA1\u5212\u5DF2\u590D\u5236",
        "plan.host.duplicated.detail": "{path}",
        "plan.host.markDone.title": "\u5DF2\u6807\u8BB0\u5B8C\u6210",
        "plan.host.markDone.detail": "{path} \xB7 {count} \u4E2A\u6B65\u9AA4",
        "plan.host.runNoSteps.title": "\u65E0\u6CD5\u6267\u884C",
        "plan.host.runNoSteps.detail": "\u8BE5\u8BA1\u5212\u91CC\u6CA1\u6709\u53EF\u6267\u884C\u7684\u672A\u5B8C\u6210\u6B65\u9AA4\uFF08- [ ]\uFF09",
        "plan.host.runAlreadyQueued.title": "\u65E0\u9700\u5165\u961F",
        "plan.host.runAlreadyQueued.detail": "\u8FD9\u4E9B\u6B65\u9AA4\u5DF2\u5728\u8BA1\u5212\u6267\u884C\u961F\u5217\u4E2D",
        "plan.host.runConfirm.title": "\u786E\u8BA4\u6267\u884C\u8BA1\u5212\u6B65\u9AA4\uFF1F",
        "plan.host.runConfirm.message": "\u8BA1\u5212\uFF1A{path}\n\u6B65\u9AA4\u6570\uFF1A{count}\n\n{preview}{more}\n\n\u6267\u884C\u7ED3\u679C\u4F1A\u56DE\u586B\u5230 plan \u6587\u4EF6\uFF0C\u5E76\u81EA\u52A8\u5C06\u5BF9\u5E94\u6B65\u9AA4\u6807\u8BB0\u4E3A\u5B8C\u6210\u3002",
        "plan.host.runConfirm.more": "\n- \u2026",
        "plan.host.runConfirm.confirm": "\u5F00\u59CB\u6267\u884C",
        "plan.host.mapFailed.title": "\u6620\u5C04\u5931\u8D25",
        "plan.host.mapFailed.detail": "\u672A\u627E\u5230 Specs tasks \u6587\u4EF6\uFF0C\u8BF7\u5148\u521B\u5EFA\u4E00\u4E2A Spec",
        "plan.host.mapNothing.title": "\u65E0\u9700\u6620\u5C04",
        "plan.host.mapNothing.detail": "\u8FD9\u4E9B\u6B65\u9AA4\u5DF2\u5B58\u5728\u4E8E Spec tasks",
        "plan.host.mapSuccess.title": "\u6620\u5C04\u5B8C\u6210",
        "plan.host.mapSuccess.detail": "[{path}] \u5DF2\u8FFD\u52A0 {added} \u6761\u5230 {target}",
        "plan.host.mapRunSuccess.title": "\u6620\u5C04\u5E76\u6267\u884C",
        "plan.host.mapRunSuccess.detail": "[{path}] \u5DF2\u6620\u5C04 {added} \u6761\u5230 {target}\uFF0C\u5E76\u5DF2\u5165\u961F\u987A\u5E8F\u6267\u884C",
        "plan.host.deleteConfirm.title": "\u5220\u9664\u8BA1\u5212\uFF1F",
        "plan.host.deleteConfirm.message": "\u5C06\u4ECE\u5DE5\u4F5C\u533A\u79FB\u9664\uFF1A{path}",
        "plan.host.deleteConfirm.confirm": "\u5220\u9664",
        "plan.host.deleted.title": "\u5DF2\u5220\u9664",
        "plan.host.deleted.detail": "{path}",
        "plan.host.syncNothing.title": "\u65E0\u53EF\u540C\u6B65\u6587\u4EF6",
        "plan.host.syncNothing.detail": "\u7F16\u8F91\u5668\u4E2D\u6CA1\u6709 .aide/ \u4E0B\u7684\u6587\u4EF6",
        "plan.host.syncFailed.title": "\u540C\u6B65\u5931\u8D25",
        "plan.host.syncFailed.detail": "\u8BF7\u68C0\u67E5\u5DE5\u4F5C\u533A\u5BB9\u91CF\u9650\u5236",
        "plan.host.syncSuccess.title": "\u5DF2\u540C\u6B65\u5230\u5DE5\u4F5C\u533A\u7D22\u5F15",
        "plan.host.syncSuccess.detail": "\u6210\u529F {synced} \u4E2A{failedSuffix}",
        "plan.host.syncSuccess.failedSuffix": "\uFF0C\u5931\u8D25 {failed} \u4E2A",
        "spec.host.noOpenTask.title": "\u65E0\u5F85\u6267\u884C",
        "spec.host.noOpenTask.detail": "\u8BE5 Spec \u6CA1\u6709\u672A\u5B8C\u6210\u4EFB\u52A1",
        "report.host.noReports.title": "\u6682\u65E0\u62A5\u544A",
        "report.host.noReports.detail": "\u8BF7\u5148\u5728\u4EFB\u52A1\u961F\u5217\u4E2D\u4FDD\u5B58\u62A5\u544A\u5230 .aide/reports",
        "report.host.openFailed.title": "\u65E0\u6CD5\u6253\u5F00",
        "report.host.openFailed.detail": "\u672A\u627E\u5230\u62A5\u544A\u6587\u4EF6\uFF1A{path}",
        "report.host.deleteConfirm.title": "\u5220\u9664\u62A5\u544A\uFF1F",
        "report.host.deleteConfirm.message": "\u5C06\u4ECE\u5DE5\u4F5C\u533A\u79FB\u9664\uFF1A{path}",
        "report.host.deleteConfirm.confirm": "\u5220\u9664",
        "report.host.deleted.title": "\u5DF2\u5220\u9664",
        "report.host.deleted.detail": "{path}",
        "report.host.bulkDeleteConfirm.title": "\u6279\u91CF\u5220\u9664\u62A5\u544A\uFF1F",
        "report.host.bulkDeleteConfirm.message": "\u5C06\u5220\u9664 {count} \u4EFD\u62A5\u544A\uFF1A\n\n{preview}{more}",
        "report.host.bulkDeleted.title": "\u5DF2\u6279\u91CF\u5220\u9664",
        "report.host.bulkDeleted.detail": "\u5171 {count} \u4EFD\u62A5\u544A",
        "report.host.pruneNothing.title": "\u65E0\u9700\u6E05\u7406",
        "report.host.pruneNothing.detail": "\u5F53\u524D\u62A5\u544A\u6570 \u2264 {keepRecent}\uFF0C\u6CA1\u6709\u53EF\u5220\u9664\u9879",
        "report.host.pruneConfirm.title": "\u6E05\u7406\u65E7\u62A5\u544A\uFF1F",
        "report.host.pruneConfirm.message": "\u5C06\u4FDD\u7559\u6700\u8FD1 {keepRecent} \u4EFD\uFF0C\u5220\u9664 {count} \u4EFD\uFF1A\n\n{preview}{more}",
        "report.host.pruneConfirm.confirm": "\u6E05\u7406",
        "report.host.pruneDone.title": "\u6E05\u7406\u5B8C\u6210",
        "report.host.pruneDone.detail": "\u5DF2\u5220\u9664 {deleted} \u4EFD\uFF0C\u4FDD\u7559\u6700\u8FD1 {keepRecent} \u4EFD",
        "report.host.previewMore": "\n\u2026",
        "report.host.zipExported.title": "ZIP \u5DF2\u5BFC\u51FA",
        "report.host.zipExported.detail": "\u5DF2\u6253\u5305 {count} \u4EFD\u62A5\u544A",
        "report.host.zipFailed.title": "\u5BFC\u51FA\u5931\u8D25",
        "report.host.zipFailed.detail": "\u6253\u5305\u5931\u8D25",
        "report.host.restoreNothing.title": "\u65E0\u53EF\u6062\u590D\u9879",
        "report.host.restoreNothing.detail": "\u62A5\u544A\u4E2D\u6CA1\u6709\u53EF\u5339\u914D\u7684\u5F85\u6267\u884C\u9879",
        "report.host.restoreConfirm.title": "\u4ECE\u62A5\u544A\u6062\u590D\u961F\u5217\uFF1F",
        "report.host.restoreConfirm.confirm": "\u6062\u590D\u5165\u961F",
        "report.host.restoreDone.title": "\u5DF2\u6062\u590D\u961F\u5217",
        "report.host.restoreDone.detail": "Plan {plan} \xB7 Spec {spec}{unresolvedSuffix}",
        "report.host.restoreDone.unresolvedSuffix": " \xB7 \u672A\u5339\u914D {count}"
      },
      "en-US": {
        "app.name": "AI IDE",
        "app.tagline": "Build, run, and pair with AI in the browser",
        "toolbar.files": "Files",
        "toolbar.search": "Search",
        "toolbar.ai": "AI",
        "toolbar.workspace": "Workspaces",
        "toolbar.git": "Git",
        "toolbar.run": "Run",
        "toolbar.running": "Running\u2026",
        "toolbar.preview": "Preview",
        "toolbar.commandPalette": "Command palette",
        "toolbar.settings": "Settings",
        "toolbar.welcome": "Back to welcome",
        "toolbar.login": "Sign in",
        "toolbar.logout": "Sign out",
        "toolbar.logoutTitle": "Sign out",
        "toolbar.logoutMessage": "Signed in as {email}. You can keep using local workspaces after sign-out.",
        "toolbar.logoutConfirm": "Sign out",
        "toolbar.loggedOut": "Signed out",
        "toolbar.fileCount": "Files",
        "toolbar.fileCountHint": "Open {current} / limit {max} (same as index cap)",
        "sidebar.expandAll": "Expand",
        "sidebar.collapseAll": "Collapse",
        "limits.files": "Workspace {current} / {max}",
        "limits.warn": "Near file limit \u2014 close unused tabs or use the desktop app for large repos.",
        "limits.fullBrowser": "Browser workspace limit reached; some files may be excluded from index or AI context.",
        "limits.fullDesktop": "Desktop workspace limit reached; split the project or exclude large dirs.",
        "limits.hintBrowser": "Browser cap: 500 files; desktop: 2000.",
        "limits.hintDesktop": "Desktop can index up to 2000 files.",
        "limits.learnMore": "Learn limits",
        "chat.error.payloadTooLarge": "Request too large (413)",
        "chat.error.payloadTooLargeTips": "Try: turn off workspace context; reduce @ mentions; disable semantic search; start a shorter thread.",
        "chat.payload.preflightWarnTitle": "Context may be too large \u2014 slim before sending",
        "chat.payload.preflightWarnDetail": "Estimated payload is about {estimatedKb}KB (budget {budgetKb}KB) and may trigger 413.",
        "chat.payload.slimAndSend": "Slim and send",
        "chat.payload.stillTooLarge": "Still too large after slimming (about {estimatedKb}KB, budget {budgetKb}KB). Reduce @ mentions or disable workspace context.",
        "chat.payload.planHistory": "Compress history to latest {count} turns",
        "chat.payload.planInput": "Keep at most {count} chars from input",
        "chat.payload.planWorkspace": "Temporarily disable workspace context",
        "chat.payload.planMention": "Temporarily disable @ mention injection",
        "chat.action.copy": "Copy",
        "chat.action.copyCode": "Copy code",
        "chat.action.copied": "Copied",
        "chat.action.copyDetail": "Copied to clipboard",
        "chat.action.copyFailed": "Copy failed \u2014 check browser permissions",
        "chat.action.retry": "Retry",
        "chat.action.continue": "Continue",
        "chat.action.continuePrompt": "Please continue your previous answer from where you left off.",
        "chat.error.abortedTitle": "Generation stopped",
        "chat.error.abortedBody": "This reply was stopped manually.",
        "chat.error.abortedHint": "Edit your question and send again.",
        "chat.error.networkTitle": "Network error",
        "chat.error.networkBody": "Could not reach the model service.",
        "chat.error.networkHint": "Check your network, API endpoint, or try again later.",
        "chat.error.authTitle": "Authentication failed",
        "chat.error.authBody": "The API key may be missing or invalid.",
        "chat.error.authHint": "Open Settings and verify provider + API key.",
        "chat.error.quotaTitle": "Daily quota exceeded",
        "chat.error.quotaBody": "You have used all AI calls for your current plan.",
        "chat.error.quotaHint": "Upgrade your plan or try again tomorrow.",
        "chat.error.genericTitle": "Request failed",
        "chat.error.genericBody": "{message}",
        "chat.error.genericHint": "Use Retry below or shorten context before sending again.",
        "toolbar.plugin": "Plugin: {label}",
        "toolbar.plans.guest": "View plans",
        "toolbar.plans.upgrade": "Upgrade from \xA519",
        "toolbar.plans.team": "Upgrade to Team",
        "toolbar.collaboration": "Collab",
        "sidebar.files": "Files",
        "editor.placeholder": "// Start coding...",
        "ai.welcome": "Hello! I am your AI coding assistant.",
        "ai.chat.welcome": "Hi! I am your AI pair programmer. Using {provider}{modelSuffix}.",
        "ai.chat.welcomeModel": " ({model})",
        "ai.chat.helpIntro": "I can help you:",
        "ai.chat.bullet.explain": "Explain the current code",
        "ai.chat.bullet.refactor": "Refactor and optimize",
        "ai.chat.bullet.generate": "Scaffold new features",
        "ai.chat.bullet.fix": "Find and fix issues",
        "ai.chat.prompt": "Type your request or use a quick action below.",
        "ai.chat.quick.explain": "Explain",
        "ai.chat.quick.refactor": "Refactor",
        "ai.chat.quick.fix": "Improve",
        "ai.chat.quick.generate": "Generate",
        "common.save": "Save",
        "common.cancel": "Cancel",
        "common.close": "Close",
        "modal.dialog": "Dialog",
        "welcome.badge": "AI-native browser IDE",
        "welcome.rcBadge": "RC beta",
        "welcome.stableBadge": "v{version} stable",
        "welcome.gaBadge": "GA",
        "welcome.desktopBadge": "Desktop",
        "welcome.cloudOk": "Cloud accounts are available \u2014 sign in and sync workspaces.",
        "welcome.cloudDegraded": "Cloud database is unavailable \u2014 sign-in and cloud workspaces may fail. BYOK and local editing still work.",
        "welcome.networkTips": "Slow load or API timeouts? Access to vercel.app can be unstable in some regions. Retry later, switch networks, or install the Windows desktop app (local disk and terminal do not rely on browser file APIs). Custom domain planned in v1.0.8.",
        "welcome.title": "Get into flow faster, spend less time on setup",
        "welcome.lead": "Open files, pair with AI, run code, and manage workspaces in one lightweight UI. Pick an entry below and start\u2014no extra intro screen.",
        "welcome.settings": "Settings",
        "welcome.quickStart": "Quick start",
        "welcome.recent": "Recent projects",
        "welcome.recentFiles": "{count} files",
        "welcome.recentEmpty": "No recent projects yet. Create a workspace and it will show up here.",
        "welcome.features": "Core capabilities",
        "welcome.shortcuts": "Shortcuts",
        "welcome.quick.new.title": "New from template",
        "welcome.quick.new.desc": "Start with React, Node, and other starters.",
        "welcome.quick.open.title": "Open workspace manager",
        "welcome.quick.open.desc": "Load cloud/local snapshots or import a folder.",
        "welcome.quick.ai.title": "Discuss with AI first",
        "welcome.quick.ai.desc": "Start from requirements, debugging, or refactors.",
        "welcome.cta.template": "Template",
        "welcome.cta.manage": "Manage",
        "welcome.cta.ai": "AI",
        "welcome.feature.ai.title": "AI pair programming",
        "welcome.feature.ai.desc": "Generate, refactor, and explain code in chat",
        "welcome.feature.run.title": "Run in the browser",
        "welcome.feature.run.desc": "Instant execution via WebContainer",
        "welcome.feature.terminal.title": "Integrated terminal",
        "welcome.feature.terminal.desc": "Run commands without leaving the editor",
        "welcome.feature.git.title": "Git workflow",
        "welcome.feature.git.desc": "Track and commit changes inside the IDE",
        "welcome.feature.settings.title": "Theme & settings",
        "welcome.feature.settings.desc": "Switch habits and UI style quickly",
        "welcome.feature.collab.title": "Collaboration",
        "welcome.feature.collab.desc": "Experimental rooms and online users",
        "welcome.shortcut.newFile": "New file",
        "welcome.shortcut.openProject": "Open project",
        "welcome.shortcut.save": "Save",
        "welcome.shortcut.run": "Run code",
        "welcome.shortcut.commandPalette": "Command palette",
        "welcome.shortcut.search": "Global search",
        "welcome.footer.privacy": "Privacy",
        "welcome.footer.terms": "Terms",
        "welcome.footer.browser": "Browser capabilities",
        "welcome.footer.aiNote": "AI chat and API keys are handled by your chosen model provider.",
        "welcome.appUrl": "Current URL: {url}",
        "auth.title.login": "Welcome back",
        "auth.title.register": "Create account",
        "auth.title.forgot": "Reset password",
        "auth.subtitle.login": "Sign in to sync your workspace data",
        "auth.subtitle.register": "Register to enable cloud sync",
        "auth.subtitle.forgot": "Enter your email to reset your password",
        "auth.oauth.github": "Continue with GitHub",
        "auth.oauth.google": "Continue with Google",
        "auth.oauth.divider": "Or continue with email",
        "auth.email": "Email",
        "auth.password": "Password",
        "auth.confirmPassword": "Confirm password",
        "auth.forgotLink": "Forgot password?",
        "auth.placeholder.password": "Your password",
        "auth.placeholder.passwordRegister": "At least 8 characters",
        "auth.placeholder.confirm": "Re-enter password",
        "auth.submit.login": "Sign in",
        "auth.submit.register": "Create account",
        "auth.submit.forgot": "Send reset email",
        "auth.footer.noAccount": "Don't have an account?",
        "auth.footer.register": "Sign up",
        "auth.footer.hasAccount": "Already have an account?",
        "auth.footer.login": "Sign in",
        "auth.footer.backLogin": "\u2190 Back to sign in",
        "auth.error.invalidEmail": "Enter a valid email address",
        "auth.error.passwordLength": "Password must be at least 8 characters",
        "auth.error.passwordMismatch": "Passwords do not match",
        "auth.error.loginFailed": "Invalid email or password",
        "auth.error.registerFailed": "Registration failed. Try again later.",
        "auth.error.resetFailed": "Could not send email. Try again later.",
        "auth.success.resetSent": "Reset email sent. Check your inbox.",
        "auth.success.login": "Signed in successfully",
        "auth.success.register": "Registration successful",
        "auth.success.signout": "Signed out",
        "auth.success.oauthSync": "OAuth sign-in successful",
        "workspace.success.created": "Workspace created",
        "workspace.success.saved": "Workspace saved",
        "workspace.success.deleted": "Workspace deleted",
        "payment.success.simulate": "Payment simulated; subscription updated",
        "auth.forgot.demoMessage": "Email delivery is not configured. Sign in with your registered email or contact an administrator.",
        "settings.kicker": "Settings Center",
        "settings.sidebar.title": "Tune the environment to your workflow",
        "settings.sidebar.desc": "Models, theme, language, autosave, and experimental capabilities in one place.",
        "settings.section.current": "Section",
        "settings.close": "Close settings",
        "settings.tab.ai": "AI",
        "settings.tab.ai.desc": "Models, API keys, and providers",
        "settings.tab.appearance": "Appearance",
        "settings.tab.appearance.desc": "Theme and UI language",
        "settings.tab.editor": "Editor",
        "settings.tab.editor.desc": "Save behavior and writing habits",
        "settings.tab.features": "Features",
        "settings.tab.features.desc": "Capabilities and extensions",
        "settings.tab.advanced": "Advanced",
        "settings.tab.advanced.desc": "Experiments and reset",
        "settings.ai.provider": "AI provider",
        "settings.ai.apiKey": "API Key",
        "settings.ai.model": "Model",
        "settings.ai.endpoint": "Local endpoint",
        "settings.ai.keyPlaceholder": "Enter your API key",
        "settings.ai.privacy": "Privacy",
        "settings.ai.privacyText": "API keys stay in your browser. We do not forward them to third parties beyond your chosen model provider.",
        "settings.ai.privacyGuest": " Sign in to sync cloud quota usage.",
        "settings.theme": "Theme",
        "settings.theme.light": "Light",
        "settings.theme.lightDesc": "Better for daytime and reading",
        "settings.theme.dark": "Dark",
        "settings.theme.darkDesc": "Focused coding and night work",
        "settings.uiLanguage": "UI language",
        "settings.lang.zh": "\u7B80\u4F53\u4E2D\u6587",
        "settings.lang.en": "English",
        "settings.autosave": "Autosave",
        "settings.autosave.desc": "Save locally and to workspace state while you edit.",
        "settings.autosave.aria": "Autosave",
        "settings.tabCompletion.title": "Tab AI completion",
        "settings.tabCompletion.desc": "Inline Tab completions in the editor (BYOK required). DeepSeek uses FIM API when available; others use chat fallback.",
        "settings.tabCompletion.maxLines": "Max completion lines",
        "settings.tabCompletion.maxLinesDesc": "Maximum lines per suggestion (1\u201312).",
        "settings.editorPrefs": "Editor preferences",
        "settings.editorPrefs.desc": "Keeps settings minimal for now. Font, indent, and format options may come later.",
        "settings.features.noticeTitle": "Capability overview",
        "settings.features.noticeDesc": "Items below describe what the product already does\u2014they are not toggles. Configure MCP and rules below.",
        "settings.feature.review.title": "Code review",
        "settings.feature.review.desc": "AI-driven quality hints",
        "settings.feature.completion.title": "Smart completion",
        "settings.feature.completion.desc": "Assist with common code patterns",
        "settings.feature.collab.title": "Live collaboration",
        "settings.feature.collab.desc": "Yjs + WebRTC rooms (Beta, not production OT)",
        "settings.feature.perf.title": "Performance",
        "settings.feature.perf.desc": "Runtime output and trends",
        "settings.feature.mcp.title": "MCP tools",
        "settings.feature.mcp.desc": "Agents can call external Streamable HTTP MCP",
        "settings.feature.semantic.title": "Semantic search (BYOK)",
        "settings.feature.semantic.desc": "In workspace mode, embed code chunks via your model API and inject matches (respects .gitignore and index caps)",
        "settings.semantic.onboarding.needKey": "Semantic search requires an Embedding API key (not Ollama). Fill it in your AI config, then enable the switch.",
        "settings.semantic.onboarding.enableHint": "After enabling semantic search, @ and semantic retrieval can inject relevant code snippets. Import your workspace first and wait for indexing to finish.",
        "settings.index.card.title": "Index & @ search",
        "settings.index.card.desc": "When indexing is ready, type `@` in Chat to pick files/symbols for context injection. Indexing is affected by .gitignore and file size caps.",
        "settings.index.retry": "Retry indexing",
        "settings.index.limitLinkLabel": "Browser limitations",
        "settings.payload.card.title": "Context budget (413 prevention)",
        "settings.payload.card.desc": "Preflight estimates request payload and shows \u201CSlim and send\u201D before oversized calls.",
        "settings.payload.card.providerBudget": "Current provider budget: {provider} about {budgetKb}KB",
        "settings.payload.card.strategy": "Slim strategy: compress history, trim input, temporarily disable workspace/@ context",
        "chat.mentionOnboardingTitle": "First @ onboarding",
        "chat.mentionOnboardingBody": "Type `@` to select a file/symbol and inject context. If the list is empty, indexing may not be ready yet\u2014try again after indexing completes.",
        "chat.mentionOnboardingDismiss": "Got it",
        "chat.mentionBuildingBlocked": "Indexing in progress \u2014 wait before using @ to pick files/symbols.",
        "welcome.footer.release": "Release notes",
        "settings.badge.enabled": "Enabled",
        "settings.badge.beta": "Beta",
        "settings.badge.experimental": "Experimental",
        "settings.advanced.caution": "Caution",
        "settings.advanced.cautionDesc": "Clear local cache or reset editor defaults. Cloud account and workspaces are unaffected.",
        "settings.advanced.clear": "Clear local data",
        "settings.advanced.reset": "Reset defaults",
        "settings.advanced.experimental": "Experimental",
        "settings.advanced.experimentalDesc": "Reserved for future toggles when features mature.",
        "settings.network.title": "Network & access",
        "settings.network.desc": "If the site is slow or sign-in fails, vercel.app may be unstable in your region. Retry on another network, use BYOK locally, or install the Windows desktop build. Custom domain: docs/CUSTOM_DOMAIN.md.",
        "settings.badge.comingSoon": "Coming soon",
        "settings.footer.hint": "Changes apply to the current workspace after save.",
        "settings.saveChanges": "Save changes",
        "subscription.title": "Plans",
        "subscription.legalPayment": "Billing & subscriptions",
        "subscription.hero.title": "Pick a pace that fits your work",
        "subscription.hero.desc": "Your current plan{planSuffix}. Upgrade for higher AI quota, more workspace capacity, and collaboration.",
        "subscription.hero.planIs": " is {name}",
        "subscription.hero.planActive": " is active",
        "subscription.plans.loadError": "Could not load plans online. Showing defaults.",
        "subscription.loginRequired": "Sign in before upgrading",
        "subscription.payFailed": "Payment request failed. Check your network and retry.",
        "subscription.devUpgradeFailed": "Dev-mode upgrade failed",
        "subscription.payNotConfigured": "Payments are not configured on the server.",
        "subscription.paySuccess": "Payment succeeded. Subscription updated.",
        "subscription.paySuccessDetail": "Upgraded to {plan}. Quota synced.",
        "subscription.recommended": "Popular",
        "subscription.paymentMethods": "Payment methods",
        "subscription.unlimited": "Unlimited",
        "subscription.manage.title": "Current subscription",
        "subscription.manage.cancelScheduled": "Will downgrade to Free at period end",
        "subscription.manage.cancelUntil": " ({plan} until {date})",
        "subscription.manage.status": "Status: {status}",
        "subscription.manage.periodEnd": " \xB7 Period ends {date}",
        "subscription.resume": "Resume billing",
        "subscription.resuming": "Resuming\u2026",
        "subscription.cancelEnd": "Cancel at period end",
        "subscription.processing": "Processing\u2026",
        "subscription.downgradeNow": "Downgrade to Free now",
        "subscription.stripePortal": "Stripe billing portal",
        "subscription.loading": "Loading plans\u2026",
        "subscription.currentPlan": "Current",
        "subscription.limit.ai": "AI requests",
        "subscription.limit.workspaces": "Workspaces",
        "subscription.limit.storage": "Storage",
        "subscription.perDay": " / day",
        "subscription.perMonth": "/mo",
        "subscription.unit.workspaces": "",
        "subscription.checkout.redirect": "Redirecting\u2026",
        "subscription.checkout.current": "Current plan",
        "subscription.checkout.free": "Continue free",
        "subscription.checkout.cn": "Pay with Alipay / WeChat",
        "subscription.checkout.alipay": "Upgrade with Alipay",
        "subscription.checkout.wechat": "Upgrade with WeChat",
        "subscription.checkout.alipayHint": "You will be redirected to Alipay to complete payment",
        "subscription.checkout.upgrade": "Upgrade now",
        "subscription.checkout.beta": "Free during beta",
        "subscription.cancelFailed": "Could not cancel subscription",
        "subscription.cancelFailedRetry": "Cancel failed. Try again later.",
        "subscription.resumeFailed": "Could not resume subscription",
        "subscription.resumeFailedRetry": "Resume failed. Try again later.",
        "subscription.portalFailed": "Could not open Stripe portal",
        "subscription.portalPageFailed": "Could not open billing page",
        "subscription.updated": "Subscription updated",
        "subscription.resumed": "Subscription resumed",
        "subscription.plan.free.name": "Free",
        "subscription.plan.free.desc": "Learning and small projects with generous quota.",
        "subscription.plan.free.f1": "Basic AI chat",
        "subscription.plan.free.f2": "10 cloud workspaces",
        "subscription.plan.free.f3": "200 requests / day",
        "subscription.plan.pro.name": "Pro",
        "subscription.plan.pro.desc": "Power users, \xA519/mo.",
        "subscription.plan.pro.f1": "5000 requests / day",
        "subscription.plan.pro.f2": "Unlimited workspaces",
        "subscription.plan.pro.f3": "Secure Alipay checkout",
        "subscription.plan.enterprise.name": "Team",
        "subscription.plan.enterprise.desc": "Teams and heavy usage, \xA549/mo.",
        "subscription.plan.enterprise.f1": "Unlimited quota",
        "subscription.plan.enterprise.f2": "Unlimited workspaces",
        "subscription.plan.enterprise.f3": "Team features (planned)",
        "command.placeholder": "Command, file name, or @ for symbols",
        "command.empty.title": "No matching commands",
        "command.empty.desc": "Try a file name, feature, or @search (e.g. @login).",
        "command.footer.enter": "Enter run",
        "command.footer.navigate": "\u2191\u2193 navigate",
        "command.footer.close": "ESC close",
        "command.cat.files": "Files",
        "command.cat.run": "Run",
        "command.cat.ai": "AI",
        "command.cat.collab": "Collaboration",
        "command.cat.view": "View",
        "command.cat.settings": "Settings",
        "command.cat.npm": "npm scripts",
        "command.cat.index": "Index (@)",
        "command.openFile": "Open file",
        "command.newFile": "New file",
        "command.newFile.sub": "Create a blank file",
        "command.newTemplate": "New from template",
        "command.newTemplate.sub": "React, Node, and other starters",
        "command.importFolder": "Import folder to workspace",
        "command.importFolder.sub": "Open import panel",
        "command.exportFile": "Export current file",
        "command.exportZip": "Export project ZIP",
        "command.import": "Import files or project",
        "command.run": "Run code",
        "command.run.sub": "Execute the active file",
        "command.terminal": "Toggle terminal",
        "command.performance": "Performance",
        "command.performance.sub": "Inspect execution metrics",
        "command.ai": "AI assistant",
        "command.ai.sub": "Open chat panel",
        "command.review": "Code review",
        "command.review.sub": "Quality and risk checks",
        "command.snippets": "Snippet library",
        "command.snippets.sub": "Insert common snippets",
        "command.git": "Git panel",
        "command.git.sub": "Changes and history",
        "command.share": "Share project",
        "command.share.sub": "Snapshot or import share",
        "command.collab": "Live collaboration",
        "command.collab.sub": "Join a shared room",
        "command.preview": "Preview panel",
        "command.preview.sub": "HTML or text output",
        "command.search": "Global search",
        "command.search.sub": "Find in files",
        "command.plugins": "Plugin manager",
        "command.plugins.sub": "Enable or load extensions",
        "command.welcome": "Back to welcome",
        "command.welcome.sub": "Quick start and recent projects",
        "command.settings": "Settings",
        "command.settings.sub": "Editor and AI configuration",
        "command.themePicker": "Theme picker",
        "command.themePicker.sub": "Browse editor themes",
        "command.themeToLight": "Switch to light theme",
        "command.themeToDark": "Switch to dark theme",
        "command.autosaveOn": "Enable autosave",
        "command.autosaveOff": "Disable autosave",
        "command.index.workspace": "Workspace / editor file",
        "mcp.loading": "Loading MCP settings\u2026",
        "mcp.title": "MCP servers",
        "mcp.desc": "Connect Streamable HTTP MCP via /api/mcp/proxy. Local URLs need dev:stack and localhost allowed.",
        "mcp.empty": "No MCP servers yet. After adding one, Agent can call tools via <<<mcp-tool>>> blocks.",
        "mcp.displayName": "Display name",
        "mcp.enabled": "Enabled",
        "mcp.test": "Test",
        "mcp.add": "Add MCP server",
        "mcp.catalog.title": "Official presets",
        "mcp.catalog.add": "Add",
        "mcp.catalog.docs": "Docs",
        "mcp.catalog.local.name": "Local dev:stack",
        "mcp.catalog.local.desc": "Run npm run dev:stack first; default 127.0.0.1:3001/mcp",
        "mcp.catalog.selfHosted.name": "Self-hosted HTTP MCP",
        "mcp.catalog.selfHosted.desc": "Your Streamable HTTP endpoint (HTTPS)",
        "mcp.catalog.community.name": "Community catalog",
        "mcp.catalog.community.desc": "Pick an HTTP-compatible server from Smithery, then paste the URL",
        "mcp.followUp.title": "Agent auto follow-up",
        "mcp.followUp.checkbox": "Auto follow-up rounds after tool calls (feed results back to the model)",
        "mcp.followUp.maxRounds": "Max follow-up rounds",
        "mcp.ping.checking": "Checking\u2026",
        "mcp.ping.ok": "Connected",
        "mcp.ping.fail": "Connection failed",
        "rules.title": "Project rules",
        "rules.desc": "Edit .aide/rules.md or .cursorrules; content is injected into Chat / Agent system prompts.",
        "rules.empty": "No rules file detected. Create a template in the editor below.",
        "rules.open": "Open rules in editor",
        "rules.create": "Create .aide/rules.md",
        "rules.injectedHint": "Saved rules auto-inject into Chat/Agent system prompts (.aide/rules.md)",
        "tasks.title": "Task checklist",
        "tasks.desc": "Edit .aide/tasks.md (Markdown checkboxes). Open items are injected into Agent context; preview below.",
        "tasks.empty": "No task file yet. Click below to create a template in the editor.",
        "tasks.open": "Open tasks in editor",
        "tasks.create": "Create .aide/tasks.md",
        "tasks.summary": "Progress {done}/{total} ({open} open)",
        "chat.needKey": "Configure an API key or switch to local Ollama before chatting.",
        "chat.quotaExceeded": "Today's AI quota is used up ({used}/{limit}).\n\nFree tier is daily. Try later or upgrade for more quota.",
        "chat.needConfig": "Finish AI setup before sending messages.",
        "chat.requestFailed": "Request failed: {message}\n\nCheck:\n- API key is correct\n- Network is available\n- Ollama is running if you use it",
        "chat.unknownError": "Unknown error",
        "chat.sessionTitle": "AI session",
        "chat.noModel": "No model selected",
        "chat.configured": "Ready",
        "chat.pendingConfig": "Setup needed",
        "chat.quotaToday": "Today",
        "chat.agentModeTitle": "Agent mode: parse multi-file edits and apply to the editor",
        "chat.agentOn": "Agent on",
        "chat.agent": "Agent",
        "chat.workspaceEmpty": "Import workspace files first to enable full context.",
        "chat.workspaceSelected": "{count} workspace files selected",
        "chat.workspaceCtx": "Workspace context",
        "chat.indexOk": "Indexed {count} files (@ mentions & semantic search)",
        "chat.indexCapped": "Indexed {indexed}/{eligible} files (limit reached; large files skipped)",
        "chat.indexHintTitle": "Index respects .gitignore and file size caps",
        "chat.indexBuilding": "Updating project index\u2026",
        "chat.indexBuildingProgress": "Indexing {indexed}/{total} files\u2026",
        "chat.indexError": "Index failed: {message}",
        "chat.indexRetry": "Retry",
        "chat.thinking": "Thinking",
        "chat.agentChanges": "Agent suggests changes to {count} files: {paths}",
        "chat.ignore": "Dismiss",
        "chat.preview": "Preview",
        "chat.apply": "Apply",
        "chat.inputPlaceholder": "Message; @ file/symbol for context; Enter to send",
        "chat.inputPlaceholderNoConfig": "Configure API key or local Ollama first",
        "chat.stop": "Stop generation",
        "chat.sendButton": "Send",
        "chat.send.explain": "Explain this code.",
        "chat.send.refactor": "Refactor this code.",
        "chat.send.fix": "Improve implementation and performance.",
        "chat.send.generate": "Generate a related feature based on the current code.",
        "chat.prompt.userRequest": "User request: {action}",
        "chat.prompt.editorFile": "Current editor file:\n```\n{code}\n```",
        "chat.system.default": "You are a professional coding assistant. Current code:\n\n```\n{code}\n```\n\nAnswer clearly and include full code blocks with filenames when needed.",
        "chat.mcp.followUp": "MCP tools ran. Results below. Continue the task; output another <<<mcp-tool>>> block if needed.\n\n{log}",
        "chat.mcp.results": "**MCP tool results**",
        "chat.agentToolsActive": "Tool agent (multi-round)",
        "chat.agentActivityTitle": "Agent activity",
        "chat.subscriptionExpired": "Your Pro subscription has ended and daily limits are back to Free. Renew from Settings or View plans.",
        "agent.settings.loading": "Loading agent settings\u2026",
        "agent.settings.title": "Agent tool loop",
        "agent.settings.desc": "Multi-round list/read/write like Cursor; works with OpenAI-compatible APIs (e.g. DeepSeek).",
        "agent.settings.useTools": "Enable tool loop",
        "agent.settings.useToolsDesc": "When off, Agent mode uses Markdown code blocks (legacy).",
        "agent.settings.autoApply": "Auto-apply writes",
        "agent.settings.autoApplyDesc": "When off, write_file is staged for Diff preview before applying to editor and disk.",
        "agent.settings.maxRounds": "Max tool rounds",
        "agent.settings.maxRoundsDesc": "Each round counts as one AI quota unit; 8\u201312 is typical.",
        "agent.settings.terminalContext": "Inject recent terminal output",
        "agent.settings.terminalContextDesc": "Append the last lines from the integrated terminal to Chat/Agent context (read-only; not full Cascade)",
        "agent.settings.terminalLines": "Max terminal lines",
        "agent.tool.list_files": "List files",
        "agent.tool.read_file": "Read",
        "agent.tool.write_file": "Write",
        "agent.tool.search_repo": "Search",
        "agent.tool.grep_repo": "Grep",
        "agent.tool.run_command": "Run command",
        "agent.tool.move_file": "Move/rename file",
        "agent.tool.delete_file": "Delete file",
        "agent.tool.create_dir": "Create directory",
        "agent.tool.lineOk": "\u2713 {tool} {detail}",
        "agent.tool.lineFail": "\u2717 {tool} {detail}",
        "agent.tool.truncated": "(output truncated)",
        "agent.toolPanel.title": "Agent Tools",
        "agent.toolPanel.failed": "failed",
        "agent.error.toolsUnsupported": "Provider ({provider}) does not support tool loop; using Markdown agent.",
        "quota.today": "AI usage today",
        "quota.exhausted": "Daily quota used. Try tomorrow or upgrade.",
        "quota.unlimitedPlan": "Unlimited quota on this plan.",
        "quota.remaining": "About {count} left",
        "quota.plan": "Plan",
        "sidebar.filenamePlaceholder": "Filename, e.g. index.ts",
        "sidebar.create": "Create",
        "sidebar.deleteFile": "Delete file",
        "plugin.ok": "OK",
        "plugin.close": "Close",
        "plugin.title": "Plugins",
        "plugin.builtin": "Built-in",
        "plugin.running": "Running",
        "plugin.author": "Author: {name}",
        "plugin.permissions": "Permissions: {perms}",
        "plugin.disable": "Disable",
        "plugin.enable": "Enable",
        "plugin.disabled": "Plugin disabled.",
        "plugin.enabled": "Plugin enabled.",
        "plugin.enableFailed": "Enable failed. Check permissions and compatibility.",
        "plugin.loadFailed": "Failed to load plugin",
        "plugin.storageFailed": "Loaded but could not save to local storage",
        "plugin.installed": "Plugin installed and passed sandbox checks.",
        "plugin.installFailed": "Install failed",
        "plugin.flash.marketInstalled": "Installed from marketplace. Enable under Installed.",
        "plugin.removed": "Plugin removed.",
        "plugin.hero.title": "Shape the IDE to your workflow",
        "plugin.hero.desc": "Built-ins, official catalog, and manual JSON. Third-party plugins run in a Worker sandbox with permission tokens.",
        "plugin.count.installed": "{count} installed",
        "plugin.count.running": "{count} running",
        "plugin.count.market": "{count} catalog entries",
        "plugin.footer": "Plugins v1.1 \xB7 sandbox + official catalog",
        "plugin.repo": "Repository",
        "plugin.tab.installed": "Installed",
        "plugin.tab.market": "Marketplace",
        "plugin.tab.manual": "Manual install",
        "plugin.empty": "No plugins yet. Install from Marketplace.",
        "plugin.official": "Official",
        "plugin.badge.installed": "Installed",
        "plugin.install": "Install",
        "plugin.manual.desc": "Paste plugin JSON (manifest + source). Dev installs validated packages; production disables manual third-party JSON by default.",
        "plugin.manual.install": "Install plugin",
        "plugin.manual.sample": "Load sample JSON",
        "empty.files.title": "No files yet",
        "empty.files.desc": "Create a file or import an existing project.",
        "empty.files.new": "New file",
        "empty.files.import": "Import files",
        "empty.files.tip1": "Drag and drop supported",
        "empty.files.tip2": "Start from templates",
        "empty.files.tip3": "Shortcut Ctrl+N",
        "empty.search.title": "Search the project",
        "empty.search.desc": "Find file names or code snippets by keyword.",
        "empty.search.tip1": "Global search",
        "empty.search.tip2": "Replace supported",
        "empty.search.tip3": "Ctrl+Shift+F",
        "empty.terminal.title": "Terminal ready",
        "empty.terminal.desc": "Run Node.js commands and watch output here.",
        "empty.git.title": "Git panel waiting",
        "empty.git.desc": "Open a repo to see changes and history.",
        "empty.workspace.title": "Workspace is empty",
        "empty.workspace.desc": "Upload a folder so AI and the editor share full context.",
        "empty.workspace.upload": "Upload folder",
        "feedback.closeToast": "Dismiss notification",
        "common.confirm": "Confirm",
        "common.ok": "OK",
        "confirm.clearData.title": "Clear local data",
        "confirm.clearData.message": "Clears project cache, settings, and IndexedDB in this browser. Cloud account data is unaffected.",
        "confirm.clearData.confirm": "Clear",
        "confirm.reset.title": "Reset defaults",
        "confirm.reset.message": "Restores theme, autosave, and AI config (keeps file list).",
        "confirm.reset.confirm": "Reset",
        "notify.signedIn": "Signed in: {email}",
        "notify.localCleared": "Local data cleared",
        "notify.localClearedDetail": "Refresh the page and sign in again if needed.",
        "notify.clearFailed": "Clear failed",
        "notify.clearFailedDetail": "Try clearing site data in browser settings.",
        "notify.defaultsRestored": "Defaults restored",
        "notify.workspaceLoaded": "Workspace loaded",
        "notify.workspaceLoadedDetail": "{count} files.",
        "notify.autosaveOn": "Autosave enabled",
        "notify.autosaveOff": "Autosave disabled",
        "notify.projectOpenFailed": "Could not open project",
        "notify.projectOpenFailedDetail": "Workspace not found. Save or load from workspace manager.",
        "notify.projectOpened": "Project opened",
        "notify.testFileAdded": "Test file added",
        "runtime.status.error": "Runtime error",
        "runtime.status.running": "Running",
        "runtime.status.ready": "Runtime ready",
        "runtime.status.loading": "Preparing runtime",
        "runtime.status.notReady": "Runtime not ready",
        "editor.runtimeFailed": "Failed to start runtime",
        "editor.runtimeRetry": "Retry",
        "editor.restarting": "Restarting runtime",
        "editor.meta.lines": "{count} lines",
        "editor.meta.chars": "{count} chars",
        "editor.action.snippet": "Snippets",
        "editor.action.review": "Review",
        "editor.action.terminal": "Terminal",
        "editor.action.hideTerminal": "Hide terminal",
        "editor.action.snippetTitle": "Open snippet library",
        "editor.action.reviewTitle": "AI code review",
        "editor.action.terminalTitle": "Show terminal",
        "notify.aiSettingsSaved": "AI settings saved",
        "notify.aiSettingsSavedDetail": "{provider} / {model}",
        "notify.templateApplied": "Template applied",
        "notify.templateAppliedDetail": "Generated {count} files.",
        "notify.themeSwitched": "Theme updated",
        "notify.themeLight": "Light mode",
        "notify.themeDark": "Dark mode",
        "notify.runtimeInit": "Runtime still starting",
        "notify.runtimeInitFile": "Run the current file once WebContainer is ready.",
        "notify.runtimeInitNpm": "Run npm scripts once WebContainer is ready.",
        "notify.runComplete": "Run finished",
        "notify.runFailed": "Run failed",
        "notify.runExitCode": "Exit code: {code}",
        "notify.commandFailed": "Command failed",
        "notify.scriptFailed": "Script failed",
        "notify.scriptRan": "Script ran",
        "notify.scriptRanDetail": "npm run {script}",
        "notify.filesImported": "Files imported",
        "notify.filesImportedDetail": "Imported {count} files.",
        "notify.fileExists": "File already exists",
        "notify.fileExistsDetail": "Choose a different filename.",
        "notify.fileCreated": "File created",
        "notify.keepOneFile": "Keep at least one file",
        "notify.keepOneFileDetail": "The workspace needs one editable file.",
        "notify.fileDeleted": "File deleted",
        "notify.fileExported": "File exported",
        "notify.zipExported": "Project ZIP exported",
        "notify.zipExportedDetail": "Packed {count} files.",
        "notify.zipExportFailed": "ZIP export failed",
        "notify.zipPackFailed": "Pack failed",
        "notify.sessionExpired": "Session expired",
        "notify.sessionExpiredDetail": "Sign in again to sync workspaces and subscription.",
        "notify.apiUnavailable": "Cloud service unavailable",
        "notify.apiUnavailableDetail": "Database or API is not ready. On Vercel, check DATABASE_URL and AUTH_SECRET.",
        "notify.apiError": "Server error",
        "notify.apiErrorDetail": "Request failed (HTTP {status}). Try again later.",
        "notify.subscriptionSuccess": "Subscription updated",
        "notify.subscriptionSyncing": "Payment received; plan syncing (showing {plan}). Refresh if it does not update.",
        "notify.subscriptionCurrentPlan": "Current plan: {plan}",
        "notify.subscriptionCanceled": "Checkout canceled",
        "notify.subscriptionCanceledDetail": "You can keep using your current plan.",
        "notify.subscriptionUpdated": "Subscription refreshed",
        "notify.quotaExceeded": "Daily AI quota used up",
        "notify.quotaExceededDetail": "{used}/{limit} used. Try later or upgrade.",
        "notify.autosaveProjectName": "Workspace ({count} files)",
        "wm.title": "Workspaces",
        "wm.hero.title": "Save progress and keep a recovery path",
        "wm.hero.loggedIn": "Signed in: saves sync to cloud (with a local copy). Cloud badge = server entry.",
        "wm.hero.guest": "Save the workspace, import backups, export all data, or restore auto-backup.",
        "wm.listLoadFailed": "Could not load workspace list.",
        "wm.saveFailed": "Save failed",
        "wm.saved": "Workspace saved",
        "wm.saved.flash": "Workspace saved.",
        "wm.saved.cloud": "{count} files synced to cloud.",
        "wm.saved.local": "{count} files saved locally.",
        "wm.confirm.load.title": "Load workspace",
        "wm.confirm.load.message": 'Load "{name}"? Unsaved editor changes may be lost.',
        "wm.confirm.load.confirm": "Load",
        "wm.loadFailed": "Load failed",
        "wm.loadFailedDetail": "Could not read workspace",
        "wm.confirm.delete.title": "Delete workspace",
        "wm.confirm.delete.message": 'Delete "{name}"? This backup cannot be restored from the list.',
        "wm.confirm.delete.confirm": "Delete",
        "wm.deleteFailed": "Delete failed",
        "wm.deleted": "Workspace deleted",
        "wm.deleted.flash": "Workspace deleted.",
        "wm.exportFailed": "Export failed",
        "wm.exportFailedDetail": "Could not read cloud workspace",
        "wm.exported": "Workspace exported",
        "wm.importSuccess": "Workspace imported.",
        "wm.importFailed": "Import failed. Check file format.",
        "wm.exportAll": "All data exported",
        "wm.noAutoBackup": "No auto-backup found",
        "wm.confirm.restore.title": "Restore auto-backup",
        "wm.confirm.restore.message": "An auto-backup was found. Restore replaces editor files and some settings.",
        "wm.confirm.restore.confirm": "Restore",
        "wm.autoBackupDetected": "Auto-backup detected",
        "wm.restoreBackup": "Restore backup",
        "wm.saveCurrent": "Save current workspace",
        "wm.local.sectionTitle": "Open a local project (Cursor-style)",
        "wm.local.sectionDesc": "Pick a folder on your computer. Edits save back to disk.",
        "wm.cloud.sectionTitle": "Cloud snapshots & backup",
        "wm.cloud.sectionDesc": "Save to your account, import/export JSON, restore auto-backup.",
        "wm.importBackup": "Import backup",
        "wm.exportAllBtn": "Export all data",
        "wm.namePlaceholder": "Workspace name",
        "wm.descPlaceholder": "Description (optional)",
        "wm.searchPlaceholder": "Search workspaces",
        "wm.loading": "Loading workspaces\u2026",
        "wm.empty.title": "No saved workspaces yet",
        "wm.empty.desc": "Save your progress here to return anytime.",
        "wm.badge.cloud": "Cloud",
        "wm.badge.local": "Local",
        "wm.meta.cloudLazy": "Cloud (fetch on load)",
        "wm.meta.fileCount": "{count} files",
        "wm.action.load": "Load",
        "wm.action.exportTitle": "Export workspace",
        "wm.action.deleteTitle": "Delete workspace",
        "wp.title": "Workspace context",
        "wp.stat.files": "Files",
        "wp.stat.selected": "Selected",
        "wp.stat.size": "Size",
        "wp.importing": "Importing {current} / {total}",
        "wp.drop.title": "Drop files or folders here",
        "wp.drop.hint": "Or pick multiple files to give AI full project context.",
        "wp.selectAll": "Select all",
        "wp.deselectAll": "Deselect all",
        "wp.clear": "Clear",
        "wp.empty.title": "Workspace context is empty",
        "wp.empty.desc": "Import files so the assistant can understand the project.",
        "wp.close": "Close",
        "wp.toggleSelect": "Toggle selection",
        "wp.removeFromContext": "Remove from context",
        "wp.defaultProjectName": "Current project",
        "wp.notify.imported": "Workspace files imported",
        "wp.notify.importedDetail": "{count} files added to context.",
        "wp.notify.importFailed": "Import failed",
        "wp.notify.importDone": "Import finished",
        "wp.notify.importDoneDetail": "{success} succeeded, {failed} failed.",
        "wp.notify.removed": "Removed from context",
        "wp.notify.selectAll": "All workspace files selected",
        "wp.notify.deselectAll": "Selection cleared",
        "wp.confirm.clear.title": "Clear workspace context",
        "wp.confirm.clear.message": "Clear workspace context? All imported files will be removed.",
        "wp.confirm.clear.confirm": "Clear",
        "wp.notify.cleared": "Workspace context cleared",
        "wp.local.openFolder": "Open local project folder",
        "wp.local.restore": "Restore last local project",
        "wp.local.openTitle": "Bound local project: {name}",
        "wp.local.openDetail": "Imported {count} files. Saves write back to disk.",
        "wp.local.openDetailCapped": "Imported {count} files (limit reached; some files skipped).",
        "wp.local.restoreTitle": "Local project restored",
        "wp.local.restoreNone": "No saved local project. Open a folder first.",
        "wp.local.bound": "Local disk: {name}",
        "wp.local.unsupported": "This browser cannot read/write local folders. Use Chrome or Edge.",
        "wp.local.permissionDenied": "Folder write permission was denied.",
        "wp.local.openFailed": "Failed to open local project",
        "wp.ctx.rename": "Rename (F2)",
        "wp.ctx.delete": "Delete",
        "wp.ctx.move": "Move to\u2026",
        "wp.ctx.newFolder": "New subfolder",
        "wp.newFolder.btn": "New folder",
        "wp.newFolder.placeholder": "Folder name",
        "wp.newFolder.create": "Create",
        "wp.newFolder.cancel": "Cancel",
        "wp.newFolder.failed": "Failed to create folder",
        "wp.move.prompt": "Enter new relative path (move/rename)",
        "wp.rename.exists": "Target path already exists",
        "wp.rename.failed": "Rename failed",
        "wp.confirm.deleteFile.title": "Delete file",
        "wp.confirm.deleteFile.message": 'Delete "{path}"?',
        "wp.confirm.deleteFile.confirm": "Delete",
        "wp.confirm.deleteFolder.title": "Delete folder",
        "wp.confirm.deleteFolder.message": 'Delete "{path}" and all files inside?',
        "wp.notify.renamed": "Renamed",
        "wp.notify.renamedDetail": "Updated {count} path(s)",
        "wp.notify.moved": "Moved",
        "wp.notify.deleted": "Deleted",
        "wp.notify.deletedDetail": "Removed {count} file(s)",
        "wp.notify.folderCreated": "Folder created",
        "snippet.title": "Snippet library",
        "snippet.searchPlaceholder": "Search name, tags, or code",
        "snippet.allLanguages": "All languages",
        "snippet.new": "New",
        "snippet.form.name": "Name",
        "snippet.form.namePlaceholder": "e.g. React useState hook",
        "snippet.form.language": "Language",
        "snippet.form.description": "Description",
        "snippet.form.descriptionPlaceholder": "What this snippet is for",
        "snippet.form.tags": "Tags",
        "snippet.form.code": "Code",
        "snippet.form.codePlaceholder": "Paste or type snippet code",
        "snippet.form.update": "Update",
        "snippet.empty.title": "No snippets found",
        "snippet.empty.desc": "Try another keyword or create one.",
        "snippet.badge.builtin": "Built-in",
        "snippet.copyTitle": "Copy",
        "snippet.editTitle": "Edit or save as",
        "snippet.deleteTitle": "Delete",
        "snippet.insert": "Insert into editor",
        "snippet.copySuffix": " copy",
        "snippet.notify.updated": "Snippet updated",
        "snippet.notify.saved": "Snippet saved",
        "snippet.notify.builtinNoDelete": "Built-in snippets cannot be deleted",
        "snippet.notify.builtinNoDeleteDetail": "Copy and save as your own snippet.",
        "snippet.confirm.delete.title": "Delete snippet",
        "snippet.confirm.delete.message": 'Delete "{name}"?',
        "snippet.notify.deleted": "Snippet deleted",
        "snippet.notify.copied": "Snippet copied",
        "snippet.notify.inserted": "Snippet inserted",
        "prompt.ws.emptyAssistant": "You are a professional coding assistant.",
        "prompt.ws.emptyAssistantWith": "You are a professional coding assistant. {context}",
        "prompt.ws.intro": "You are a professional coding assistant. The workspace has {count} files.",
        "prompt.ws.catalogTitle": "## Workspace file catalog",
        "prompt.ws.catalogLegend": "(\u2713 = selected with full content, \u25CB = summary only)",
        "prompt.ws.unselectedTitle": "## Unselected file summaries",
        "prompt.ws.selectedTitle": "## Selected files (full content)",
        "prompt.ws.instructionsTitle": "## Instructions",
        "prompt.ws.instruction1": "1. You may edit any file in the catalog",
        "prompt.ws.instruction2": "2. For new files use: ```filename.ext\ncontent\n```",
        "prompt.ws.instruction3": "3. When editing, output the full new file content",
        "prompt.ws.instruction4": "4. State clearly when deleting a file",
        "prompt.ws.instruction5": "5. For move/rename, give old and new paths",
        "prompt.ws.noFiles": "(no files)",
        "prompt.ws.omittedLines": "\u2026 ({skipped} lines omitted, {total} total)",
        "prompt.code.base": "You are a professional coding assistant. Current code context:\n\n{context}\n\n",
        "prompt.code.explain": "Explain what this code does, how it works, and potential issues.",
        "prompt.code.refactor": "Refactor for clarity, efficiency, and maintainability. Output the full refactored code.",
        "prompt.code.generate": "Generate code for the request. Use ```filename.ext blocks for multiple files.",
        "prompt.code.fix": "Find issues in this code and provide the full fixed version.",
        "search.failed": "Search failed",
        "search.placeholder.tabs": "Search open files\u2026",
        "search.placeholder.workspace": "Search workspace\u2026",
        "search.closeTitle": "Close search (Esc)",
        "search.replacePlaceholder": "Replace with\u2026",
        "search.option.case": "Match case",
        "search.option.wholeWord": "Whole word",
        "search.option.regex": "Regex",
        "search.scope.tabs": "Open files",
        "search.scope.workspace": "Workspace",
        "search.summary": "{matches} matches \xB7 {files} files",
        "search.summary.workspaceFiles": " \xB7 {count} searchable files",
        "search.toggleReplaceHide": "Hide replace",
        "search.toggleReplaceShow": "Show replace",
        "search.replaceAllPreview": "Preview replace all ({count})",
        "search.replacePreview": "Replace preview",
        "search.replacePreviewMatches": "{count} matches",
        "search.replacePreviewLines": " (lines {lines})",
        "search.replaceConfirm": "Replace all",
        "search.replaceOne": "Replace",
        "search.searching": "Searching\u2026",
        "search.noResults": "No matches",
        "search.fileGroup": "({count})",
        "git.statusReadFailed": "Failed to read Git status",
        "git.actionFailed": "Git operation failed",
        "git.stagedFile": "File staged",
        "git.commitDone": "Commit created",
        "git.stagedAll": "All changes staged",
        "git.stagedAllDetail": "{count} files",
        "git.unstaged": "Unstaged",
        "git.diffReadFailed": "Could not read diff",
        "git.diffViewFailed": "Could not show diff",
        "git.discarded": "Changes discarded",
        "git.discardedAll": "All unstaged changes discarded",
        "git.discardedAllDetail": "{count} files",
        "git.branchSwitched": "Branch switched",
        "git.waitRuntime": "Git connects when the runtime is ready.",
        "git.notInit.title": "Git is not initialized in this workspace",
        "git.notInit.desc": "Initialize to view changes, stage files, and commit.",
        "git.initBusy": "Initializing\u2026",
        "git.initRepo": "Initialize repository",
        "git.refreshTitle": "Refresh Git status",
        "git.refresh": "Refresh",
        "git.tab.changes": "Changes {count}",
        "git.tab.history": "History {count}",
        "git.unstagedLabel": "Unstaged",
        "git.unstagedCount": "{count} files",
        "git.discardAll": "Discard all",
        "git.stageAll": "Stage all",
        "git.diff": "Diff",
        "git.discardFileTitle": "Discard unstaged changes for this file",
        "git.stageTitle": "Stage",
        "git.stagedLabel": "Staged",
        "git.unstage": "Unstage",
        "git.commitPlaceholder": "Describe this commit",
        "git.committing": "Committing\u2026",
        "git.commit": "Commit",
        "git.noChanges": "No uncommitted changes.",
        "git.noCommits": "No commits yet.",
        "panel.git.subtitle": "Changes and commit history",
        "panel.chat.title": "AI assistant",
        "panel.chat.subtitle": "Current file and workspace context",
        "panel.backgroundJobs.title": "Background jobs",
        "panel.backgroundJobs.subtitle": "Runs on server after you close the tab (separate from Chat task queue)",
        "toolbar.backgroundJobs": "Background",
        "backgroundJobs.hint": "Auto-refreshes every 5s while jobs are active",
        "backgroundJobs.hintFree": "Free: 2 jobs/day, 1 active at a time. Upgrade to Pro for higher limits.",
        "backgroundJobs.empty": "No background jobs yet. Use \u201CRun in background\u201D in Chat Agent mode.",
        "backgroundJobs.loginRequired": "Sign in to use background Agent",
        "backgroundJobs.login": "Sign in",
        "backgroundJobs.loadFailed": "Failed to load jobs",
        "backgroundJobs.cancelFailed": "Failed to cancel",
        "backgroundJobs.cancelled": "Job cancelled",
        "backgroundJobs.cancel": "Cancel job",
        "backgroundJobs.refresh": "Refresh",
        "backgroundJobs.detailTitle": "Job details",
        "backgroundJobs.repoKey": "Workspace",
        "backgroundJobs.progress": "Progress",
        "backgroundJobs.result": "Result",
        "backgroundJobs.finishedAt": "Finished",
        "backgroundJobs.status.queued": "Queued",
        "backgroundJobs.status.running": "Running",
        "backgroundJobs.status.succeeded": "Succeeded",
        "backgroundJobs.status.failed": "Failed",
        "backgroundJobs.status.cancelled": "Cancelled",
        "backgroundJobs.cloudWritebackOk": "Written to cloud workspace {workspace} ({count} file(s))",
        "backgroundJobs.previewDiff": "Preview diff",
        "backgroundJobs.openCloud": "Open cloud workspace",
        "backgroundJobs.reloadCloudHint": "Cloud workspace updated",
        "backgroundJobs.reloadCloudDetail": "Load workspace \u201C{workspace}\u201D from the workspace manager to view files",
        "backgroundJobs.reloadCloudFailed": "Could not load cloud workspace",
        "backgroundJobs.upgradePro": "Upgrade to Pro",
        "backgroundJobs.notifyOnComplete": "Desktop notification on completion",
        "backgroundJobs.notifySucceeded": "Background job completed",
        "backgroundJobs.notifyFailed": "Background job failed",
        "backgroundJobs.notifyCancelled": "Background job cancelled",
        "backgroundJobs.notifyDesktopSucceeded": "Background job completed",
        "backgroundJobs.notifyDesktopFailed": "Background job failed",
        "backgroundJobs.notifyDesktopCancelled": "Background job cancelled",
        "backgroundJobs.activeBadge": "{count} active background job(s)",
        "backgroundJobs.applyToIde": "Apply to IDE",
        "backgroundJobs.applyToIdeOk": "Merged into editor",
        "backgroundJobs.applyToIdeOkDetail": "Updated {count} file(s)",
        "backgroundJobs.applyToIdeEmpty": "No file changes to apply",
        "plan.catalog.runInBackground": "Run in background",
        "plan.catalog.runAllInBackground": "Run all in background ({count})",
        "plan.host.runBackgroundAlreadyQueued.title": "Steps already queued",
        "plan.host.runBackgroundAlreadyQueued.detail": "Selected steps are already queued or running; nothing new to submit.",
        "plan.host.runBackgroundSkipped.title": "Some steps skipped",
        "plan.host.runBackgroundSkipped.detail": "Skipped {count} duplicate or already-queued step(s).",
        "plan.host.runBackgroundConfirm.title": "Submit background jobs?",
        "plan.host.runBackgroundConfirm.message": "Submit {count} plan step(s) as background jobs ({path}).\n\n{preview}{more}",
        "plan.host.runBackgroundConfirm.confirm": "Submit",
        "plan.host.runBackgroundQueued.title": "Background jobs queued",
        "plan.host.runBackgroundQueued.detail": "Queued {count} step(s) from {path}",
        "backgroundJobs.filterLabel": "Filter jobs",
        "backgroundJobs.filter.all": "All",
        "backgroundJobs.filter.active": "Active",
        "backgroundJobs.filter.finished": "Finished",
        "backgroundJobs.filterEmpty": "No jobs match this filter",
        "backgroundJobs.retry": "Retry",
        "backgroundJobs.retryQueued": "Background job resubmitted",
        "backgroundJobs.retryFailed": "Retry failed",
        "backgroundJobs.autoMarkPlanStep": "Auto-mark plan step on success",
        "backgroundJobs.markPlanStep": "Mark plan step done",
        "backgroundJobs.planStepMarked": "Plan step marked done",
        "backgroundJobs.planStepMarkedDetail": "{path}: {step}",
        "backgroundJobs.planStepAlreadyDone": "Plan step already done or plan file missing",
        "backgroundJobs.planSource": "Plan",
        "backgroundJobs.copyPrompt": "Copy prompt",
        "backgroundJobs.copyPromptOk": "Copied",
        "backgroundJobs.copyPromptFailed": "Copy failed",
        "backgroundJobs.notifyClickHint": "Click to open background jobs",
        "chat.backgroundRun.button": "Run in background (continues after close)",
        "chat.backgroundRun.taskHeading": "User task",
        "chat.backgroundRun.queued": "Background job submitted",
        "chat.backgroundRun.queuedDetail": "Track progress in the Background jobs panel",
        "chat.backgroundRun.failed": "Failed to submit background job",
        "chat.backgroundRun.upgradeHint": "Free plan background job quota exceeded. Upgrade to Pro for more.",
        "aiSettings.title": "AI model settings",
        "aiSettings.provider": "Provider",
        "aiSettings.model": "Model",
        "aiSettings.apiKeyHint": "API key is stored only in this browser",
        "aiSettings.advancedShow": "Advanced",
        "aiSettings.advancedHide": "Hide advanced",
        "aiSettings.endpoint": "Custom API endpoint (optional)",
        "aiSettings.endpointHint": "For proxies or OpenAI-compatible gateways",
        "template.title": "Choose a template",
        "template.fileCount": "{count} files",
        "import.title": "Import project",
        "import.hero.title": "Bring your code in and start fast",
        "import.hero.desc": "GitHub repos, file upload, or ZIP import with language detection.",
        "import.tab.upload": "Upload files",
        "import.tab.zip": "ZIP import",
        "import.githubUrl": "GitHub repository URL",
        "import.branch": "Branch",
        "import.token": "GitHub token (optional)",
        "import.tokenPlaceholder": "For private repos",
        "import.importing": "Importing\u2026",
        "import.importRepo": "Import repository",
        "import.error.invalidUrl": "Enter a valid GitHub repository URL.",
        "import.error.branches": "Failed to load branches.",
        "import.error.noTextFiles": "No importable text files found.",
        "import.error.selectZip": "Select a ZIP file.",
        "import.error.zipEmpty": "No importable files in ZIP.",
        "import.error.zipParse": "ZIP parse failed: {message}",
        "import.error.dropZip": "Drop a ZIP file.",
        "import.drop.upload.title": "Click or drop files here",
        "import.drop.upload.subtitle": "Good for a few source, config, or doc files. Multi-select supported.",
        "import.drop.zip.title": "Import a ZIP project",
        "import.drop.zip.subtitle": "Import a full project or a previously exported archive.",
        "status.diagnostics.none": "No issues",
        "status.diagnostics.count": "{count} diagnostics",
        "status.feature.review": "Code review",
        "status.feature.performance": "Performance",
        "status.runtime.ready": "Runtime ready",
        "status.runtime.loading": "Runtime loading",
        "status.autosave.on": "Autosave on",
        "status.autosave.off": "Manual save",
        "status.autosaveTitle": "Toggle autosave",
        "status.gitTitle": "Open Git panel",
        "status.ai.connected": "AI connected",
        "status.ai.configure": "Configure AI",
        "status.aiTitle": "Configure AI",
        "status.locale.zh": "\u4E2D\u6587",
        "status.locale.en": "English",
        "status.settings": "Settings",
        "status.settingsTitle": "Open settings",
        "review.title": "Code review",
        "review.pickMode": "Choose how to analyze code quality",
        "review.quickCheck": "Quick check (local rules)",
        "review.aiReview": "AI deep review",
        "review.reviewing": "Reviewing\u2026",
        "review.generateTests": "AI unit tests",
        "review.generatingTests": "Generating\u2026",
        "review.needApiKey": "Configure an AI API key first",
        "review.testGenFailed": "Test generation failed",
        "review.quickPass": "Quick check passed \u2014 no obvious issues",
        "review.quickIssues": "Found {count} issues",
        "review.filter.all": "All",
        "review.filter.errors": "Errors",
        "review.filter.warnings": "Warnings",
        "review.filter.suggestions": "Suggestions",
        "review.noIssuesInFilter": "No issues in this category",
        "review.line": "Line {line}",
        "review.back": "Back",
        "review.rerun": "Review again",
        "perf.title": "Performance",
        "perf.clearHistory": "Clear history",
        "perf.running": "Running\u2026",
        "perf.overview": "Overview",
        "perf.avgTime": "Average",
        "perf.fastest": "Fastest",
        "perf.slowest": "Slowest",
        "perf.runCount": "Runs",
        "perf.history": "Run history",
        "perf.noRuns": "No runs yet",
        "perf.noRunsHint": "Run code to see metrics here",
        "perf.runLabel": "Run #{index}",
        "perf.execTime": "Execution time",
        "perf.memoryEst": "Memory (est.)",
        "perf.outputSize": "Output size",
        "terminal.title": "Terminal",
        "terminal.running": "Running",
        "terminal.run": "Run",
        "terminal.clear": "Clear",
        "terminal.hint": "Click Run to execute the current file; output appears here.",
        "agentApply.title": "Agent change preview",
        "agentApply.badge.new": "New",
        "agentApply.badge.modified": "Modified",
        "agentApply.oldLabel": "Current",
        "agentApply.newLabel": "Suggested",
        "agentApply.empty": "Select a file on the left to view diff",
        "agentApply.footer": "{total} files \xB7 {remaining} pending",
        "agentApply.applyCurrent": "Apply current file",
        "agentApply.applyCurrentHunks": "Apply selected hunks",
        "agentApply.applyCurrentFull": "Apply whole file",
        "agentApply.applyAll": "Apply all ({count})",
        "agentApply.skipCurrent": "Skip this file",
        "agentApply.hunkBadge": "{accepted}/{total} hunks",
        "agent.tool.writeStaged": "\u2713 {tool} {detail} \xB7 {hunks} hunks",
        "dropzone.title": "Import files",
        "dropzone.dragOr": "Drag files here, or",
        "dropzone.pickFiles": "choose files",
        "dropzone.supported": "Supported: {types}",
        "dropzone.unsupportedType": "Unsupported type. Upload: {types}",
        "dropzone.pending": "About to import {count} files:",
        "dropzone.repick": "Choose again",
        "dropzone.confirm": "Import",
        "diff.title": "Code diff",
        "diff.added": "+{count} added",
        "diff.removed": "-{count} removed",
        "diff.unchanged": "{count} unchanged",
        "diff.showUnchanged": "Show unchanged",
        "diff.hunks": "Hunks {accepted}/{total}:",
        "diff.hunk": "Hunk {index} (+{added}/-{removed})",
        "diff.selectAll": "Select all",
        "diff.selectNone": "Select none",
        "diff.content": "Content",
        "diff.lineCount": "{count} lines",
        "diff.close": "Close",
        "diff.oldLabel": "Previous",
        "diff.newLabel": "New",
        "diff.apply": "Apply",
        "diff.applyPartial": "Apply selected hunks",
        "preview.kicker": "Preview",
        "preview.refresh": "Refresh",
        "preview.newWindow": "New window",
        "preview.closeTitle": "Close preview",
        "outline.title": "Outline",
        "outline.empty": "No symbols in this file",
        "errorBoundary.title": "Something went wrong",
        "errorBoundary.desc": "AI IDE hit an unexpected error. Refresh the page, or clear local data if needed.",
        "errorBoundary.refresh": "Refresh page",
        "errorBoundary.clearLocal": "Clear local data",
        "errorBoundary.hint": "Frontend runtime error \xB7 project data is stored in this browser",
        "errorBoundary.clearFailed": "Clear failed: {message}",
        "errorBoundary.confirm.title": "Clear all local data",
        "errorBoundary.confirm.message": "Deletes projects, settings, and cache in this browser. The page will refresh.",
        "errorBoundary.confirm.clear": "Clear",
        "inlineAi.title": "AI inline edit",
        "inlineAi.charsSelected": "{count} chars selected",
        "inlineAi.suggestion": "AI suggestion",
        "inlineAi.retype": "Edit instruction",
        "inlineAi.reject": "Reject",
        "inlineAi.accept": "Accept",
        "inlineAi.placeholder": "Instruction, e.g. simplify this code",
        "inlineAi.generate": "Generate",
        "inlineAi.hint": "Enter to generate, Esc to close",
        "inlineAi.requestFailed": "Request failed",
        "inlineAi.quick.explain": "Explain",
        "inlineAi.quick.refactor": "Refactor",
        "inlineAi.quick.optimize": "Optimize",
        "inlineAi.quick.fix": "Fix",
        "inlineAi.quick.comment": "Add comments",
        "inlineAi.quick.simplify": "Simplify",
        "inlineAi.prompt.explain": "Explain this code",
        "inlineAi.prompt.refactor": "Refactor for clarity",
        "inlineAi.prompt.optimize": "Improve performance",
        "inlineAi.prompt.fix": "Find and fix issues",
        "inlineAi.prompt.comment": "Add detailed comments",
        "inlineAi.prompt.simplify": "Simplify this code",
        "prompt.inline.system": "You are a code editing assistant. The user selected {language} code and gave an instruction.",
        "prompt.inline.rule1": "1. Output only the modified code, no explanation",
        "prompt.inline.rule2": "2. Preserve indentation and formatting",
        "prompt.inline.rule3": '3. If the instruction is unclear, output "ERROR: cannot process instruction"',
        "prompt.inline.selected": "Selected code:",
        "prompt.inline.instruction": "Instruction: {prompt}",
        "prompt.inline.output": "Output modified code:",
        "collab.title": "Live collaboration",
        "collab.aria": "Live collaboration Beta",
        "collab.hero.title": "Work on the same workspace together",
        "collab.hero.desc": "Create or join a room. Files sync over Yjs + WebRTC after you join.",
        "collab.limits": "Beta: uses public WebRTC signaling without a dedicated server; concurrent edits may conflict and cursors are not synced. For demos and small teams, not production-grade collaboration.",
        "collab.m1.limits": "M1: join via server-backed rooms when signed in; still uses Yjs/WebRTC sync (Livekit when configured).",
        "collab.m1.loginRequired": "Sign in required for Collaboration M1",
        "collab.m1.createFailed": "Failed to create collaboration room",
        "collab.m1.joinFailed": "Failed to join collaboration room",
        "collab.m1.generate": "Create room",
        "collab.status.connected": "Connected",
        "collab.status.connecting": "Connecting\u2026",
        "collab.status.reconnecting": "Reconnecting (attempt {attempt})\u2026",
        "collab.status.disconnected": "Disconnected",
        "collab.role.host": "Host",
        "collab.role.editor": "Editor",
        "collab.role.viewer": "Viewer",
        "collab.joinAs": "Join as",
        "collab.joinAsHint": "Viewers can see synced files but cannot edit or push changes to the room.",
        "collab.readOnlyBanner": "Collaboration read-only: you joined as a viewer. The editor is locked.",
        "collab.roomMembers": "Room members (server)",
        "collab.makeViewer": "Make viewer",
        "collab.makeEditor": "Make editor",
        "collab.kick": "Remove",
        "collab.m1.roleUpdateFailed": "Failed to update member role",
        "collab.m1.kickFailed": "Failed to remove member",
        "collab.yourName": "Your name",
        "collab.roomId": "Room ID",
        "collab.roomPlaceholder": "Leave empty to create a new room",
        "collab.generate": "Generate",
        "collab.hint": "Enter an existing room ID to join, or leave empty to create one.",
        "collab.joinRoom": "Join room",
        "collab.createRoom": "Create room",
        "collab.roomLink": "Room link",
        "collab.copied": "Copied",
        "collab.copyLink": "Copy link",
        "collab.roomIdLabel": "Room ID:",
        "collab.members": "Online ({count})",
        "collab.unknownUser": "Unknown user",
        "collab.you": " (you)",
        "collab.leave": "Leave room",
        "collab.defaultUser": "User{n}",
        "share.title": "Share & import",
        "share.aria": "Share and import",
        "share.hero.title": "Current workspace snapshot",
        "share.hero.desc": "Generate a share link, export JSON backup, or restore from history or pasted JSON.",
        "share.meta.files": "{count} files",
        "share.meta.chars": "{count} chars",
        "share.tab.share": "Share",
        "share.tab.history": "History",
        "share.tab.import": "Import JSON",
        "share.createHint": "Create a local share snapshot link to restore later or share in the same environment.",
        "share.generateLink": "Generate share link",
        "share.exportJson": "Export JSON",
        "share.linkReady": "Link ready \u2014 copy or regenerate.",
        "share.regenerate": "Regenerate",
        "share.copy": "Copy",
        "share.empty": "No share snapshots saved yet.",
        "share.historyFiles": "{count} files",
        "share.load": "Load",
        "share.deleteTitle": "Delete",
        "share.importHint": "Paste exported JSON to restore. You can also open `?share=xxx` in the URL.",
        "share.importProject": "Import project",
        "share.importFailed": "Import failed. Check the JSON structure.",
        "pay.title": "Pay \u2014 {plan}",
        "pay.aria": "China payment",
        "pay.summaryLabel": "Plan",
        "pay.free": "Free",
        "pay.perMonth": "/ month",
        "pay.wechatScan": "Scan with WeChat to pay",
        "pay.wechatQrAlt": "WeChat Pay QR code",
        "pay.wechatHint": "Plan upgrades automatically after payment. Keep this window open.",
        "pay.alipay": "Alipay",
        "pay.wechat": "WeChat Pay",
        "pay.alipayRedirectTitle": "Redirecting to Alipay\u2026",
        "pay.alipayRedirectDesc": "Complete payment in the checkout page. You will return here when done.",
        "pay.secureNote": "Payments are processed by Alipay / WeChat. We never store your payment password.",
        "pay.secureNoteAlipay": "Payments are processed by Alipay. We never store your payment password.",
        "pay.secureNoteWechat": "Payments are processed by WeChat Pay. We never store your payment password.",
        "pay.createFailed": "Failed to create payment",
        "pay.channelInvalid": "Payment channel returned invalid data",
        "pay.networkError": "Network error. Try again later.",
        "editor.loadingMonaco": "Loading Monaco editor\u2026",
        "editor.loadTimeout": "Monaco editor timed out. Check that local assets are reachable.",
        "editor.loadFailed": "Editor failed to load",
        "editor.reload": "Reload",
        "theme.title": "Choose theme",
        "theme.filter.all": "All",
        "theme.filter.dark": "Dark",
        "theme.filter.light": "Light",
        "theme.vs-dark.name": "Dark",
        "theme.light.name": "Light",
        "template.vanilla.desc": "Vanilla JavaScript starter",
        "template.react.desc": "React 18 + Vite",
        "template.vue.desc": "Vue 3 Composition API",
        "template.node.desc": "Node.js backend starter",
        "template.file.vanilla.indexJs.comment": "// Your code here",
        "template.file.node.indexJs.header": "// Node.js backend example",
        "ai.provider.openai.name": "OpenAI",
        "ai.provider.openai.desc": "GPT-5.4 (Mar 2026) is the latest flagship line, unifying GPT and Codex",
        "ai.provider.deepseek.name": "DeepSeek",
        "ai.provider.deepseek.desc": "DeepSeek V4 preview (Apr 2026); API models include deepseek-v4-pro and deepseek-v4-flash",
        "ai.provider.claude.name": "Claude (Anthropic)",
        "ai.provider.claude.desc": "Claude Opus 4.6 and Sonnet 4.6 (Feb 2026) lead on coding tasks",
        "ai.provider.google.name": "Google Gemini",
        "ai.provider.google.desc": "Gemini 3.1 Pro (Feb 2026) is a strong general-purpose model",
        "ai.provider.qwen.name": "Qwen (Alibaba)",
        "ai.provider.qwen.desc": "Qwen 3.5 (Mar 2026); sub-9B models can run on-device on iPhone",
        "ai.provider.zhipu.name": "Zhipu GLM",
        "ai.provider.zhipu.desc": "GLM-5 (2026) is a major open model trained on Ascend hardware",
        "ai.provider.minimax.name": "MiniMax",
        "ai.provider.minimax.desc": "MiniMax M2.5 scores 80.2% on SWE-bench, near Claude Opus",
        "ai.provider.grok.name": "xAI Grok",
        "ai.provider.grok.desc": "Grok 4.20 API availability may depend on account/region; switch model or endpoint if needed",
        "ai.provider.ollama.name": "Ollama (local)",
        "ai.provider.ollama.desc": "Llama 4 Scout supports very long context; fully open weights",
        "ai.error.rateLimit": "Too many requests. Try again in {seconds}s.",
        "ai.error.aborted": "Request cancelled",
        "ai.error.unsupportedProvider": "Unsupported AI provider: {provider}",
        "ai.error.httpStatus": "API request failed ({status})",
        "ai.error.claudeStatus": "Claude API error ({status})",
        "ai.error.geminiStatus": "Gemini API error ({status})",
        "ai.error.geminiMessage": "Gemini API error: {message}",
        "ai.error.ollamaNotRunning": "Ollama is not running. Start it with: ollama serve",
        "embedding.httpError": "Embedding API error ({status}): {detail}",
        "mcp.error.missingResult": "MCP response missing result",
        "mcp.error.requestFailed": "MCP request failed ({status})",
        "workspace.nameRequired": "Name is required",
        "workspace.cloudSaveFailed": "Cloud save failed. Check your network and try again.",
        "snippet.builtin.reactComponent.desc": "React function component template",
        "snippet.builtin.useEffect.desc": "React useEffect template",
        "snippet.builtin.asyncFn.desc": "Async function template",
        "snippet.builtin.pythonClass.desc": "Python class template",
        "snippet.builtin.fetchApi.desc": "Fetch API request template",
        "usage.quota.exceeded": "Today's AI quota is used up ({used}/{limit})",
        "usage.quota.syncFailed": "Could not sync AI quota with the server. Check your network and try again.",
        "auth.error.notLoggedIn": "Not signed in",
        "workspace.invalidData": "Invalid workspace data",
        "workspace.importSuffix": " (imported)",
        "workspace.autoBackup.name": "Auto backup",
        "workspace.autoBackup.desc": "Automatic recovery snapshot",
        "workspace.autosave.name": "Autosave",
        "workspace.autosave.project": "Autosave project",
        "mcp.ping.emptyUrl": "URL is empty",
        "mcp.ping.toolsListed": "Listed {count} tools",
        "mention.section.title": "Code context from @ mentions",
        "mention.section.intro": "The user @-referenced the following files/symbols. Prioritize them in your answer:",
        "mention.header.file": "### @{token} \u2192 `{path}`",
        "mention.header.symbol": "### @{token} \u2192 `{path}` symbol `{symbol}` (around line {line})",
        "mention.section.truncated": "(More @ mentions omitted due to length limits. Narrow mentions or close some workspace files.)",
        "semantic.section.title": "Semantic search snippets (BYOK embedding)",
        "semantic.hitLine": "{index}. {path} (relevance {score}%)\n```\n{text}\n```",
        "semantic.error.generic": "Semantic search failed; skipped",
        "plugin.perm.required": "Declare at least one permission",
        "plugin.perm.terminalDeprecated": "Full terminal scope is no longer supported; use terminal:safe instead",
        "plugin.perm.unknown": "Unknown permission: {perm}",
        "format.error.bracketMismatch": "At {pos}: bracket mismatch, expected {expected} but got {actual}",
        "format.error.stringUnclosed": "At {pos}: unclosed string quote",
        "format.error.unclosedBrackets": "Unclosed brackets: {stack}",
        "github.error.repoNotFound": "Repository not found or private",
        "review.summary.done": "Review complete",
        "review.summary.partial": "Review complete (parsed result incomplete)",
        "review.summary.failed": "Review failed: {message}",
        "review.summary.failedUnknown": "Unknown error",
        "review.issue.debugLog": "Debug output found; remove before production",
        "review.issue.debugSuggestion": "Use a logging library or remove debug statements",
        "review.issue.todo": "Unresolved TODO comment",
        "review.issue.lineLength": "Line exceeds 100 characters",
        "review.issue.lineLengthSuggestion": "Consider wrapping for readability",
        "review.issue.looseEqual": "Uses == instead of ===",
        "review.issue.looseEqualSuggestion": "Prefer === for strict equality",
        "testGen.apiKeyRequired": "Configure an API key in AI settings first",
        "embedding.apiKeyRequired": "API key required for semantic search",
        "embedding.emptyResponse": "Embedding API returned empty",
        "editor.inlineCompletion.label": "AI completion",
        "projectRules.template": `# Project rules (.aide/rules.md)

- Use TypeScript strict mode
- Prefer small commits and keep tests green
- Reply concisely in the user's language
`,
        "projectRules.sectionTitle": "Project rules (.aide/rules)",
        "projectTasks.template": `# Task checklist (.aide/tasks.md)

- [ ] Implement core feature
- [ ] Add tests
- [ ] Update docs
`,
        "projectTasks.sectionTitle": "Open tasks (.aide/tasks)",
        "workspace.error.unnamed": "Untitled workspace",
        "workspace.error.fileTooLarge": "File {name} exceeds 1MB limit",
        "workspace.error.totalTooLarge": "Workspace total size exceeds 10MB",
        "workspace.error.fileCountTooLarge": "Workspace exceeds {max} files",
        "workspace.error.readFailed": "Failed to read file {name}",
        "workspace.error.unknown": "Unknown error",
        "workspace.default.importProject": "Imported project",
        "quota.formatUnlimited": "{used} / unlimited",
        "quota.formatLimited": "{used}/{limit}",
        "plugin.catalog.tag.demo": "Demo",
        "plugin.catalog.tag.tools": "Tools",
        "plugin.catalog.tag.ui": "UI",
        "plugin.catalog.tag.formatter": "Formatter",
        "plugin.catalog.tag.productivity": "Productivity",
        "plugin.catalog.tag.markdown": "Markdown",
        "plugin.filter.all": "All",
        "plugin.filter.empty": "No plugins match this tag",
        "plugin.rating.title": "Official rating",
        "plugin.catalog.json-formatter.name": "JSON Formatter",
        "plugin.catalog.json-formatter.desc": "Pretty-print JSON in the editor",
        "plugin.catalog.todo-scanner.name": "TODO Scanner",
        "plugin.catalog.todo-scanner.desc": "Find TODO/FIXME/HACK in workspace files",
        "plugin.catalog.line-counter.name": "Line Counter",
        "plugin.catalog.line-counter.desc": "Count total lines in workspace",
        "plugin.catalog.md-preview-plus.name": "Markdown Preview+",
        "plugin.catalog.md-preview-plus.desc": "Modal preview for the active Markdown file",
        "plugin.catalog.hello-sandbox.name": "Hello Sandbox",
        "plugin.catalog.hello-sandbox.desc": "Demo sandbox plugin: notifications + toolbar button",
        "plugin.catalog.workspace-hints.name": "Workspace hints",
        "plugin.catalog.workspace-hints.desc": "Show open file count on the toolbar (UI permission only)",
        "subscription.upgraded": "Upgraded to {plan}",
        "subscription.betaNote": "Public beta: Pro and Team features are free. Paid checkout will open here when billing goes live.",
        "subscription.pricing.live": "Pay with {methods}; Pro \xA519/mo, Team \xA549/mo",
        "subscription.pricing.dev": "Dev/integration: one-click mock upgrade when merchants are not configured",
        "subscription.payMethod.alipay": "Alipay",
        "subscription.payMethod.wechat": "WeChat Pay",
        "subscription.payMethod.stripe": "Stripe",
        "auth.error.network": "Cannot reach the server. Check your network and try again.",
        "auth.error.accountNotFound": "No account found. Register first.",
        "auth.error.emailRegistered": "Email already registered. Sign in instead.",
        "auth.api.required": "Email and password are required",
        "auth.api.emailRequired": "Email is required",
        "auth.api.emailTaken": "Email already registered",
        "auth.api.oauthSyncFailed": "OAuth sign-in sync failed",
        "auth.api.oauthSessionInvalid": "OAuth session invalid. Sign in again.",
        "auth.api.oauthUserMissing": "OAuth user not found. Try again.",
        "plugin.error.emptyJson": "Paste plugin package JSON",
        "plugin.error.prodDisabled": "Third-party plugins are disabled in production (built-ins only)",
        "plugin.error.remoteDisabled": "Remote plugin install is not available. Paste plugin JSON.",
        "plugin.error.invalidShape": "JSON must include manifest and source",
        "plugin.error.parseFailed": "Could not parse plugin JSON",
        "plugin.error.noToolbar": "Plugin cannot access ui.addToolbarButton",
        "plugin.catalog.notFound": "Plugin is not in the official catalog",
        "plugin.catalog.storageFailed": "Plugin registered but could not save locally",
        "plugin.builtin.format.name": "Format code",
        "plugin.builtin.format.desc": "Format the active file",
        "plugin.builtin.format.label": "Format",
        "plugin.builtin.format.done": "Code formatted",
        "plugin.builtin.stats.name": "Code stats",
        "plugin.builtin.stats.desc": "Count lines and characters",
        "plugin.builtin.stats.label": "Stats",
        "plugin.builtin.stats.title": "Code statistics",
        "plugin.builtin.stats.body": "Files: {files}\nLines: {lines}\nChars: {chars}",
        "wp.notify.partialImport": "Some files failed to import",
        "wp.notify.partialImportDetail": "{errors}",
        "runtime.webcontainer.bootFailed": "WebContainer failed to start",
        "runtime.webcontainer.notReady": "WebContainer is not ready yet",
        "runtime.webcontainer.busy": "A command is already running",
        "network.error.generic": "Network error. Try again later.",
        "network.error.offline": "Cannot reach the server. Check your network and try again.",
        "editor.defaultFileComment": "// Welcome to AI IDE",
        "plugin.context.terminalNotReady": "Terminal is not ready yet",
        "plugin.context.apiKeyRequired": "Configure an API key in AI settings first",
        "plugin.context.toolbarNoPluginId": "Toolbar button is missing pluginId",
        "plugin.sandbox.invalidId": "Plugin id must be lowercase letters, digits, or hyphens, starting with a letter",
        "plugin.sandbox.nameRequired": "Plugin name is required",
        "plugin.sandbox.versionRequired": "Plugin version is required",
        "plugin.sandbox.codeEmpty": "Plugin code cannot be empty",
        "plugin.sandbox.codeTooLarge": "Plugin code exceeds the 32KB limit",
        "plugin.sandbox.blockedPattern": "Plugin code contains a blocked pattern: {pattern}",
        "plugin.sandbox.denied": "Plugin cannot access {name}",
        "plugin.sandbox.terminalCommandDenied": "Plugin cannot run this terminal command (safe whitelist only)",
        "plugin.sandbox.prodMainThread": "Plugin code cannot run on the main thread in production; use the Worker sandbox",
        "plugin.sandbox.activateRequired": "Plugin must define activate(context)",
        "plugin.sandbox.workerUnsupported": "Web Worker plugin sandbox is not supported in this environment",
        "plugin.sandbox.activateTimeout": "Plugin activation timed out ({ms}ms)",
        "plugin.sandbox.activateFailed": "Plugin activation failed",
        "plugin.sandbox.workerError": "Plugin Worker error",
        "plugin.sandbox.apiTimeout": "Plugin API call timed out: {path}",
        "plugin.sandbox.apiFailed": "Plugin API call failed",
        "plugin.sandbox.unknownApi": "Unknown plugin API: {path}",
        "plugin.i18n.invalidShape": "manifest.i18n must be a locale \u2192 string map",
        "plugin.i18n.unsupportedLocale": "manifest.i18n unsupported locale: {locale}",
        "plugin.i18n.tooManyKeys": "manifest.i18n.{locale} has too many keys (max {max})",
        "plugin.i18n.invalidKey": "manifest.i18n invalid key: {key}",
        "plugin.i18n.invalidValue": "manifest.i18n values must be strings: {key}",
        "plugin.i18n.valueTooLong": "manifest.i18n value too long: {key} (max {max} chars)",
        "plugin.i18n.totalTooLarge": "manifest.i18n exceeds {max} characters total",
        "plugin.manual.i18nHint": 'Optional manifest.i18n (zh-CN / en-US) and context.t("key") in activate \u2014 see docs/PLUGIN_I18N.md',
        "plugin.example.hello.notify": "Plugin sandbox is working",
        "plugin.example.workspace.toolbar": "Files {count}",
        "plugin.example.workspace.modalTitle": "Workspace",
        "plugin.example.workspace.modalBody": "{count} files in the editor.",
        "queue.panel.title": "Task queue",
        "queue.panel.sessionStatus": "Session: {status}",
        "queue.panel.copyReport": "Copy report",
        "queue.panel.saveReport": "Save to .aide/reports",
        "queue.panel.openLatestReport": "Open latest report",
        "queue.panel.restoreFromLatest": "Restore from latest report",
        "queue.sessionStats.corrupted": "Queue stats were corrupted and have been reset",
        "queue.panel.activeTask": "Running: {task}",
        "queue.panel.failureStats": "Failures: Plan {plan} \xB7 Spec {spec}",
        "queue.panel.resetFailure": "Reset failures",
        "queue.panel.successStats": "Successes: Plan {plan} \xB7 Spec {spec}",
        "queue.panel.resetSuccess": "Reset successes",
        "queue.panel.recentDone": "Recently done:",
        "queue.panel.waitingPrompt": "Waiting: {text}",
        "queue.panel.specQueueCount": "Spec queue: {count} pending",
        "queue.panel.planQueueCount": "Plan queue: {count} pending",
        "queue.panel.clearSpec": "Clear Spec queue",
        "queue.panel.clearPlan": "Clear Plan queue",
        "queue.panel.planFailed": "Plan step failed: {step} ({error})",
        "queue.panel.specFailed": "Spec task failed: {task} ({error})",
        "queue.panel.retryPlan": "Retry step",
        "queue.panel.retrySpec": "Retry task",
        "queue.panel.skipContinue": "Skip and continue",
        "queue.panel.sendQueue": "Send queue:",
        "queue.panel.sendQueueMore": "+{count} more",
        "queue.preview.title": "Queue preview",
        "queue.preview.planTag": "Plan",
        "queue.preview.specTag": "Spec",
        "queue.preview.expand": "Show {count} more",
        "queue.preview.collapse": "Collapse preview",
        "queue.persist.corruptedTitle": "Queue storage reset",
        "queue.persist.corruptedDetail": "Local queue data was invalid or incompatible. The queue was cleared; restore from a report or re-enqueue.",
        "plan.overview.title": "Plan overview",
        "plan.overview.desc": "Plans {planCount} \xB7 Open steps {openSteps} \xB7 Plan queue {planQueueCount} \xB7 Spec queue {specQueueCount} \xB7 Latest report {latestReportAt}",
        "plan.overview.running": "Running",
        "plan.overview.idle": "Idle",
        "plan.overview.noReport": "None",
        "plan.catalog.title": "Plans (.aide/plans)",
        "plan.catalog.desc": "Browse plan files: filter, sort, run selected steps (results backfill into the plan file).",
        "plan.catalog.searchPlaceholder": "Search plans / paths / tags",
        "plan.catalog.sort.recentExec": "Recent execution",
        "plan.catalog.sort.mostOpen": "Most open steps",
        "plan.catalog.sort.title": "Title",
        "plan.catalog.mapTargetDefault": "Map target: latest Spec",
        "plan.catalog.createFromTemplate": "Create from template",
        "plan.catalog.newPlanPlaceholder": "Plan title, e.g. Login polish",
        "plan.catalog.templateCustom": " (custom)",
        "plan.catalog.showMore": "Show more",
        "plan.catalog.empty": "No plans yet. Use Plan mode in Chat or create from a template above.",
        "plan.catalog.mappedCount": "Mapped {count}",
        "plan.catalog.open": "Open",
        "plan.catalog.run": "Run selected",
        "plan.catalog.map": "Map to Spec",
        "plan.catalog.mapAndRun": "Map & run",
        "plan.catalog.delete": "Delete",
        "plan.catalog.todoBadge": "Open {count}",
        "plan.catalog.lastExecuted": "Last run {time}",
        "plan.catalog.notExecuted": "Not run yet",
        "plan.catalog.noOpenSteps": "No open steps",
        "plan.catalog.runSteps": "Run steps",
        "plan.catalog.queueAllOpen": "Queue all open ({count})",
        "plan.catalog.markDone": "Mark done",
        "plan.catalog.openLinkedSpec": "Open Spec",
        "plan.catalog.duplicate": "Duplicate plan",
        "plan.overview.syncAide": "Sync .aide to workspace index",
        "plan.overview.syncAideHint": "Align AI index with editor .aide files (plans/specs/reports)",
        "plan.overview.openLatestReport": "Open latest report",
        "plan.overview.goPlans": "Go to plans",
        "plan.overview.goReports": "Go to reports",
        "spec.catalog.openLinkedPlan": "Open plan",
        "spec.catalog.title": "Specs (.aide/specs)",
        "spec.catalog.desc": "Browse specs, search/sort, open tasks and acceptance.",
        "spec.catalog.searchPlaceholder": "Search spec name / path",
        "spec.catalog.sort.recentExec": "Recent execution",
        "spec.catalog.sort.mostOpen": "Most open tasks",
        "spec.catalog.sort.title": "Name",
        "spec.catalog.namePlaceholder": "New spec name",
        "spec.catalog.create": "Create Spec",
        "spec.catalog.openRoot": "Open specs root",
        "spec.catalog.showMore": "Show more",
        "spec.catalog.empty": "No specs yet. Enter a name and click Create Spec.",
        "spec.catalog.sourcePlans": "Source plans",
        "spec.catalog.openTasks": "Open tasks",
        "spec.catalog.openAcceptance": "Open acceptance",
        "spec.catalog.runFirst": "Run first open task",
        "report.catalog.title": "Reports (.aide/reports)",
        "report.catalog.desc": "View, restore queue, open/delete; bulk delete, keep recent N, export ZIP.",
        "report.catalog.autoSave": "Auto-save report when queue completes",
        "report.catalog.notify": "Browser notification when queue completes",
        "report.catalog.searchPlaceholder": "Search title / path / status",
        "report.catalog.sort.recent": "Generated time",
        "report.catalog.sort.title": "Title",
        "report.catalog.selectAll": "Select all in list",
        "report.catalog.keepRecent": "Keep recent",
        "report.catalog.keepUnit": "reports",
        "report.catalog.prune": "Prune old reports",
        "report.catalog.deleteSelected": "Delete selected",
        "report.catalog.exportZip": "Export selected ZIP",
        "report.catalog.shownCount": "Showing {shown} / {filtered}",
        "report.catalog.totalCount": "({total} total)",
        "report.catalog.showMore": "Show more",
        "report.catalog.empty": "No reports yet. Save from the Chat task queue.",
        "report.catalog.open": "Open",
        "report.catalog.restore": "Restore queue",
        "report.catalog.delete": "Delete",
        "report.catalog.status": "Status: {status}",
        "report.catalog.summary": "Stats: {summary}",
        "report.catalog.timeUnknown": "Unknown time",
        "report.catalog.previewRestore": "Preview restore",
        "report.catalog.previewRestoreTitle": "Queue items to restore",
        "report.catalog.confirmRestore": "Confirm restore",
        "plan.syncAfterWrite.confirm.title": "Sync .aide to workspace index?",
        "plan.syncAfterWrite.confirm.message": "The plan file is in the editor. Add .aide/ to the AI index for @ mentions and semantic search?",
        "plan.syncAfterWrite.confirm.confirm": "Sync",
        "plan.host.createFailed.title": "Create failed",
        "plan.host.createFailed.detail": "Selected plan template was not found",
        "plan.host.created.title": "Plan created",
        "plan.host.created.detail": "{path}",
        "plan.host.duplicateFailed.title": "Duplicate failed",
        "plan.host.duplicateFailed.detail": "No plan file to duplicate",
        "plan.host.duplicated.title": "Plan duplicated",
        "plan.host.duplicated.detail": "{path}",
        "plan.host.markDone.title": "Marked done",
        "plan.host.markDone.detail": "{path} \xB7 {count} step(s)",
        "plan.host.runNoSteps.title": "Cannot run",
        "plan.host.runNoSteps.detail": "No open steps (- [ ]) in this plan",
        "plan.host.runAlreadyQueued.title": "Already queued",
        "plan.host.runAlreadyQueued.detail": "These steps are already in the plan queue",
        "plan.host.runConfirm.title": "Run plan steps?",
        "plan.host.runConfirm.message": "Plan: {path}\nSteps: {count}\n\n{preview}{more}\n\nResults backfill to the plan file and mark steps done.",
        "plan.host.runConfirm.more": "\n- \u2026",
        "plan.host.runConfirm.confirm": "Start",
        "plan.host.mapFailed.title": "Map failed",
        "plan.host.mapFailed.detail": "No Spec tasks file \u2014 create a Spec first",
        "plan.host.mapNothing.title": "Nothing to map",
        "plan.host.mapNothing.detail": "These steps already exist in Spec tasks",
        "plan.host.mapSuccess.title": "Mapped",
        "plan.host.mapSuccess.detail": "[{path}] added {added} item(s) to {target}",
        "plan.host.mapRunSuccess.title": "Mapped & queued",
        "plan.host.mapRunSuccess.detail": "[{path}] mapped {added} to {target} and queued for execution",
        "plan.host.deleteConfirm.title": "Delete plan?",
        "plan.host.deleteConfirm.message": "Remove from workspace: {path}",
        "plan.host.deleteConfirm.confirm": "Delete",
        "plan.host.deleted.title": "Deleted",
        "plan.host.deleted.detail": "{path}",
        "plan.host.syncNothing.title": "Nothing to sync",
        "plan.host.syncNothing.detail": "No .aide/ files in the editor",
        "plan.host.syncFailed.title": "Sync failed",
        "plan.host.syncFailed.detail": "Check workspace capacity limits",
        "plan.host.syncSuccess.title": "Synced to workspace index",
        "plan.host.syncSuccess.detail": "Synced {synced} file(s){failedSuffix}",
        "plan.host.syncSuccess.failedSuffix": ", {failed} failed",
        "spec.host.noOpenTask.title": "Nothing to run",
        "spec.host.noOpenTask.detail": "No open tasks in this Spec",
        "report.host.noReports.title": "No reports",
        "report.host.noReports.detail": "Save a report from the task queue to .aide/reports first",
        "report.host.openFailed.title": "Cannot open",
        "report.host.openFailed.detail": "Report file not found: {path}",
        "report.host.deleteConfirm.title": "Delete report?",
        "report.host.deleteConfirm.message": "Remove from workspace: {path}",
        "report.host.deleteConfirm.confirm": "Delete",
        "report.host.deleted.title": "Deleted",
        "report.host.deleted.detail": "{path}",
        "report.host.bulkDeleteConfirm.title": "Delete reports?",
        "report.host.bulkDeleteConfirm.message": "Delete {count} report(s):\n\n{preview}{more}",
        "report.host.bulkDeleted.title": "Bulk deleted",
        "report.host.bulkDeleted.detail": "{count} report(s) removed",
        "report.host.pruneNothing.title": "Nothing to prune",
        "report.host.pruneNothing.detail": "Report count \u2264 {keepRecent}, nothing to delete",
        "report.host.pruneConfirm.title": "Prune old reports?",
        "report.host.pruneConfirm.message": "Keep latest {keepRecent}, delete {count}:\n\n{preview}{more}",
        "report.host.pruneConfirm.confirm": "Prune",
        "report.host.pruneDone.title": "Prune complete",
        "report.host.pruneDone.detail": "Deleted {deleted}, kept latest {keepRecent}",
        "report.host.previewMore": "\n\u2026",
        "report.host.zipExported.title": "ZIP exported",
        "report.host.zipExported.detail": "Packed {count} report(s)",
        "report.host.zipFailed.title": "Export failed",
        "report.host.zipFailed.detail": "Pack failed",
        "report.host.restoreNothing.title": "Nothing to restore",
        "report.host.restoreNothing.detail": "No matching pending items in the report",
        "report.host.restoreConfirm.title": "Restore queue from report?",
        "report.host.restoreConfirm.confirm": "Restore",
        "report.host.restoreDone.title": "Queue restored",
        "report.host.restoreDone.detail": "Plan {plan} \xB7 Spec {spec}{unresolvedSuffix}",
        "report.host.restoreDone.unresolvedSuffix": " \xB7 {count} unmatched"
      }
    };
  }
});

// src/i18n/index.tsx
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function createTranslator(language) {
  return (key, params) => {
    const table = translations[language];
    const raw = table[key] ?? translations["zh-CN"][key] ?? key;
    return interpolate2(raw, params);
  };
}
var I18nContext;
var init_i18n = __esm({
  "src/i18n/index.tsx"() {
    "use strict";
    init_language();
    init_apiLanguage();
    init_unifiedStorage();
    init_translations();
    I18nContext = createContext(null);
  }
});

// src/lib/serviceI18n.ts
function serviceText(key, params, locale) {
  return createTranslator(locale ?? getApiLanguage())(key, params);
}
var init_serviceI18n = __esm({
  "src/lib/serviceI18n.ts"() {
    "use strict";
    init_i18n();
    init_apiLanguage();
  }
});

// src/services/terminalBridge.ts
var init_terminalBridge = __esm({
  "src/services/terminalBridge.ts"() {
    "use strict";
    init_serviceI18n();
  }
});

// src/services/desktopBridge.ts
function isDesktopApp() {
  return typeof window !== "undefined" && Boolean(window.aiIdeDesktop?.isDesktop);
}
var init_desktopBridge = __esm({
  "src/services/desktopBridge.ts"() {
    "use strict";
    init_terminalBridge();
  }
});

// src/services/indexLimits.ts
function getMaxIndexFiles() {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(LIMIT_OVERRIDE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return isDesktopApp() ? MAX_INDEX_FILES_DESKTOP : MAX_INDEX_FILES;
}
function capIndexSources(sources, maxFiles) {
  const limit = maxFiles ?? getMaxIndexFiles();
  const capped = [];
  let totalBytes = 0;
  for (const source of sources) {
    if (capped.length >= limit) break;
    const bytes = source.content.length;
    if (bytes > MAX_INDEX_FILE_BYTES) continue;
    if (totalBytes + bytes > MAX_INDEX_TOTAL_BYTES) break;
    totalBytes += bytes;
    capped.push(source);
  }
  return capped;
}
var MAX_INDEX_FILES, MAX_INDEX_FILES_DESKTOP, LIMIT_OVERRIDE_KEY, MAX_INDEX_FILE_BYTES, MAX_INDEX_TOTAL_BYTES;
var init_indexLimits = __esm({
  "src/services/indexLimits.ts"() {
    "use strict";
    init_desktopBridge();
    MAX_INDEX_FILES = 500;
    MAX_INDEX_FILES_DESKTOP = 2e3;
    LIMIT_OVERRIDE_KEY = "ai-ide:index-max-files-override";
    MAX_INDEX_FILE_BYTES = 12e4;
    MAX_INDEX_TOTAL_BYTES = 4e6;
  }
});

// src/services/astSymbolExtractor.ts
var init_astSymbolExtractor = __esm({
  "src/services/astSymbolExtractor.ts"() {
    "use strict";
  }
});

// src/services/projectIndexService.ts
function buildIndexSourcesWithStats(merged, gitignoreRules = gitignoreRulesFromSources(merged), maxFiles) {
  const eligible = merged.filter((file) => shouldIndexPath(file.path, gitignoreRules));
  const sources = capIndexSources(eligible, maxFiles);
  return {
    sources,
    stats: {
      totalFiles: merged.length,
      eligibleFiles: eligible.length,
      indexedFiles: sources.length,
      capped: sources.length < eligible.length
    }
  };
}
function shouldIndexPath(path, gitignoreRules = []) {
  const normalized = path.replace(/\\/g, "/").replace(/^\.\//, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.some((part) => DEFAULT_IGNORE_SEGMENTS.has(part))) return false;
  if (gitignoreRules.length > 0 && isPathIgnoredByGitignore(normalized, gitignoreRules)) {
    return false;
  }
  return true;
}
function collectIndexSources(editorFiles, workspaceFiles = []) {
  const byPath = /* @__PURE__ */ new Map();
  for (const file of workspaceFiles) {
    byPath.set(file.path, file);
  }
  for (const file of editorFiles) {
    byPath.set(file.name, {
      path: file.name,
      content: file.content,
      language: file.language
    });
  }
  const merged = [...byPath.values()];
  return buildIndexSourcesWithStats(merged).sources;
}
var DEFAULT_IGNORE_SEGMENTS;
var init_projectIndexService = __esm({
  "src/services/projectIndexService.ts"() {
    "use strict";
    init_gitignoreService();
    init_indexLimits();
    init_astSymbolExtractor();
    DEFAULT_IGNORE_SEGMENTS = /* @__PURE__ */ new Set([
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      "coverage",
      ".turbo",
      ".vercel",
      "__pycache__",
      ".cache",
      "vendor",
      "target"
    ]);
  }
});

// src/services/searchService.ts
import Fuse from "fuse.js";
function collectSearchableFiles(editorFiles, workspaceFiles = []) {
  return collectIndexSources(
    editorFiles.map((file) => ({ name: file.name, content: file.content })),
    workspaceFiles
  ).map((file) => ({ name: file.path, content: file.content }));
}
function searchInFiles(files, query, options = {}) {
  if (!query.trim()) return [];
  const results = [];
  for (const file of files) {
    const lines = file.content.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const lineNumber = index + 1;
      const matches = findMatches(line, query, options);
      for (const match of matches) {
        results.push({
          file: file.name,
          line: lineNumber,
          column: match.start + 1,
          content: line.trim(),
          match: line.slice(match.start, match.end)
        });
      }
    }
  }
  return results;
}
function findMatches(line, query, options) {
  if (options.regex) {
    const flags = options.caseSensitive ? "g" : "gi";
    const regex = new RegExp(query, flags);
    const matches2 = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      matches2.push({ start: match.index, end: match.index + match[0].length });
      if (match[0].length === 0) regex.lastIndex += 1;
    }
    return matches2;
  }
  const searchLine = options.caseSensitive ? line : line.toLowerCase();
  const searchQuery = options.caseSensitive ? query : query.toLowerCase();
  const matches = [];
  let index = 0;
  while ((index = searchLine.indexOf(searchQuery, index)) !== -1) {
    const end = index + searchQuery.length;
    if (options.wholeWord) {
      const before = index > 0 ? searchLine[index - 1] : " ";
      const after = end < searchLine.length ? searchLine[end] : " ";
      if (/\w/.test(before) || /\w/.test(after)) {
        index = end;
        continue;
      }
    }
    matches.push({ start: index, end });
    index = end;
  }
  return matches;
}
var init_searchService = __esm({
  "src/services/searchService.ts"() {
    "use strict";
    init_projectIndexService();
  }
});

// src/services/workspaceErrors.ts
function getWorkspaceLocale() {
  if (typeof localStorage === "undefined") return "zh-CN";
  return normalizeLanguage(localStorage.getItem("language") ?? "zh-CN");
}
function workspaceError(key, params, locale) {
  return createTranslator(locale ?? getWorkspaceLocale())(key, params);
}
var init_workspaceErrors = __esm({
  "src/services/workspaceErrors.ts"() {
    "use strict";
    init_i18n();
    init_language();
  }
});

// src/services/workspacePromptUtils.ts
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function summarizeFileContent(content, maxLines = 8, locale = "zh-CN") {
  const t = createTranslator(locale);
  const lines = content.split(/\r?\n/);
  if (lines.length <= maxLines) return content.trimEnd();
  const head = lines.slice(0, maxLines).join("\n");
  return `${head}
${t("prompt.ws.omittedLines", { skipped: lines.length - maxLines, total: lines.length })}`;
}
function buildWorkspaceFileCatalog(files, locale = "zh-CN") {
  const t = createTranslator(locale);
  if (files.length === 0) return t("prompt.ws.noFiles");
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  return sorted.map((file) => {
    const flag = file.selected !== false ? "\u2713" : "\u25CB";
    return `${flag} ${file.path} (${file.language}, ${formatFileSize(file.size)})`;
  }).join("\n");
}
var init_workspacePromptUtils = __esm({
  "src/services/workspacePromptUtils.ts"() {
    "use strict";
    init_i18n();
  }
});

// src/services/localProjectPaths.ts
function normalizeProjectPath(raw) {
  const trimmed = raw.replace(/\\/g, "/").replace(/^\.\//, "").trim();
  if (!trimmed || FORBIDDEN.test(trimmed)) return null;
  const parts = trimmed.split("/").filter((p) => p && p !== ".");
  if (parts.some((p) => p === "..")) return null;
  return parts.join("/");
}
var FORBIDDEN;
var init_localProjectPaths = __esm({
  "src/services/localProjectPaths.ts"() {
    "use strict";
    FORBIDDEN = /\.\.|^\/|\\/;
  }
});

// src/services/workspaceLimits.ts
var init_workspaceLimits = __esm({
  "src/services/workspaceLimits.ts"() {
    "use strict";
    init_desktopBridge();
    init_indexLimits();
  }
});

// src/services/workspaceContextService.ts
function getMaxWorkspaceFiles() {
  return getMaxIndexFiles();
}
var WORKSPACE_KEY, MAX_FILE_SIZE, MAX_TOTAL_SIZE, WorkspaceContextService, workspaceContextService;
var init_workspaceContextService = __esm({
  "src/services/workspaceContextService.ts"() {
    "use strict";
    init_i18n();
    init_unifiedStorage();
    init_workspaceErrors();
    init_workspacePromptUtils();
    init_localProjectPaths();
    init_workspaceLimits();
    WORKSPACE_KEY = "workspace";
    MAX_FILE_SIZE = 1024 * 1024;
    MAX_TOTAL_SIZE = 10 * 1024 * 1024;
    WorkspaceContextService = class {
      context = null;
      listeners = /* @__PURE__ */ new Set();
      constructor() {
        this.initFromStorage();
      }
      async initFromStorage() {
        await this.loadFromStorage();
      }
      onChange(listener) {
        this.listeners.add(listener);
        return () => {
          this.listeners.delete(listener);
        };
      }
      emitChange() {
        this.listeners.forEach((l) => {
          try {
            l();
          } catch (e) {
            console.error("[workspaceContextService] listener error:", e);
          }
        });
      }
      // 加载保存的工作区
      async loadFromStorage() {
        const saved = await unifiedStorage.get(WORKSPACE_KEY, null);
        if (saved) {
          this.context = saved;
        }
      }
      // 保存到 unifiedStorage
      async saveToStorage() {
        if (this.context) {
          await unifiedStorage.set(WORKSPACE_KEY, this.context, { layer: "indexed" /* INDEXED */ });
        } else {
          await unifiedStorage.set(WORKSPACE_KEY, null, { layer: "indexed" /* INDEXED */ });
        }
        this.emitChange();
      }
      // 获取当前工作区
      getContext() {
        return this.context;
      }
      // 创建工作区
      async createContext(name, description) {
        this.context = {
          name,
          files: [],
          rootPath: "/",
          description
        };
        await this.saveToStorage();
        return this.context;
      }
      // 清空工作区
      async clearContext() {
        this.context = null;
        await unifiedStorage.set(WORKSPACE_KEY, null, { layer: "indexed" /* INDEXED */ });
        this.emitChange();
      }
      // 添加文件到工作区
      async addFile(file) {
        if (!this.context) {
          await this.createContext(workspaceError("workspace.error.unnamed"));
        }
        const content = file.content;
        const size = new Blob([content]).size;
        if (size > MAX_FILE_SIZE) {
          throw new Error(workspaceError("workspace.error.fileTooLarge", { name: file.name }));
        }
        const currentSize = this.getTotalSize();
        if (currentSize + size > MAX_TOTAL_SIZE) {
          throw new Error(workspaceError("workspace.error.totalTooLarge"));
        }
        const maxFiles = getMaxWorkspaceFiles();
        if (this.context.files.length >= maxFiles) {
          throw new Error(workspaceError("workspace.error.fileCountTooLarge", { max: maxFiles }));
        }
        const existingIndex = this.context.files.findIndex((f) => f.path === file.path);
        const workspaceFile = {
          ...file,
          size,
          lastModified: Date.now(),
          selected: true
        };
        if (existingIndex >= 0) {
          this.context.files[existingIndex] = workspaceFile;
        } else {
          this.context.files.push(workspaceFile);
        }
        await this.saveToStorage();
        return true;
      }
      // 从本地文件读取并添加到工作区
      async addFileFromLocal(file, path) {
        const content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result);
          reader.onerror = () => reject(new Error(workspaceError("workspace.error.readFailed", { name: file.name })));
          reader.readAsText(file);
        });
        const filePath = path || file.name;
        await this.addFile({
          name: file.name,
          path: filePath,
          content,
          language: this.detectLanguage(file.name),
          selected: true
        });
      }
      // 批量添加文件
      async addFilesFromLocal(files, basePath = "") {
        const result = { success: 0, failed: 0, errors: [] };
        for (const file of files) {
          try {
            const path = basePath ? `${basePath}/${file.name}` : file.name;
            await this.addFileFromLocal(file, path);
            result.success++;
          } catch (e) {
            result.failed++;
            result.errors.push(`${file.name}: ${e instanceof Error ? e.message : workspaceError("workspace.error.unknown")}`);
          }
        }
        return result;
      }
      // 从文件夹递归读取
      async addFilesFromDirectory(entry, basePath = "") {
        const result = { success: 0, failed: 0, errors: [] };
        const reader = entry.createReader();
        const entries = [];
        let readMore = true;
        while (readMore) {
          await new Promise((resolve) => {
            reader.readEntries((items) => {
              if (items.length === 0) {
                readMore = false;
              } else {
                entries.push(...items);
              }
              resolve();
            });
          });
        }
        for (const item of entries) {
          const itemPath = basePath ? `${basePath}/${item.name}` : item.name;
          if (item.isFile) {
            try {
              const file = await new Promise((resolve, reject) => {
                item.file(resolve, reject);
              });
              await this.addFileFromLocal(file, itemPath);
              result.success++;
            } catch (e) {
              result.failed++;
              result.errors.push(`${itemPath}: ${e instanceof Error ? e.message : workspaceError("workspace.error.unknown")}`);
            }
          } else if (item.isDirectory) {
            const subResult = await this.addFilesFromDirectory(item, itemPath);
            result.success += subResult.success;
            result.failed += subResult.failed;
            result.errors.push(...subResult.errors);
          }
        }
        return result;
      }
      // 从现有文件数组创建工作区（用于从App.tsx导入）
      async createFromFiles(files, name = workspaceError("workspace.default.importProject")) {
        this.context = {
          name,
          files: files.map((f) => ({
            ...f,
            path: f.name,
            size: new Blob([f.content]).size,
            lastModified: Date.now(),
            selected: true
          })),
          rootPath: "/"
        };
        await this.saveToStorage();
      }
      // 删除文件
      async removeFile(path) {
        if (!this.context) return;
        const index = this.context.files.findIndex((f) => f.path === path);
        if (index >= 0) {
          this.context.files.splice(index, 1);
          await this.saveToStorage();
          this.emitChange();
        }
      }
      /** Rename a file or all files under a folder prefix. Returns number of paths updated. */
      async renamePath(oldPath, newPath) {
        if (!this.context) return 0;
        const from = normalizeProjectPath(oldPath.trim());
        const to = normalizeProjectPath(newPath.trim());
        if (!from || !to || from === to) return 0;
        const direct = this.getFile(from);
        const hasChildren = this.context.files.some((f) => f.path.startsWith(`${from}/`));
        if (direct && !hasChildren) {
          if (this.getFile(to)) throw new Error("TARGET_EXISTS");
          direct.path = to;
          direct.name = to.split("/").pop() || to;
          direct.language = this.detectLanguage(direct.name);
          await this.saveToStorage();
          this.emitChange();
          return 1;
        }
        const prefix = `${from}/`;
        const affected = this.context.files.filter((f) => f.path === from || f.path.startsWith(prefix));
        if (affected.length === 0) return 0;
        if (this.context.files.some((f) => f.path === to || f.path.startsWith(`${to}/`))) {
          throw new Error("TARGET_EXISTS");
        }
        for (const file of affected) {
          const rel = file.path === from ? "" : file.path.slice(prefix.length);
          const next = rel ? `${to}/${rel}` : to;
          file.path = next;
          file.name = next.split("/").pop() || next;
          file.language = this.detectLanguage(file.name);
        }
        await this.saveToStorage();
        this.emitChange();
        return affected.length;
      }
      /** Create directory placeholder (.gitkeep) so the folder appears in the tree. */
      async createDirectory(dirPath) {
        const dir = normalizeProjectPath(dirPath.trim());
        if (!dir) throw new Error("INVALID_PATH");
        const keepPath = `${dir}/.gitkeep`;
        if (!this.getFile(keepPath)) {
          await this.addFile({
            name: ".gitkeep",
            path: keepPath,
            content: "",
            language: "plaintext",
            selected: false
          });
          this.emitChange();
        }
        return keepPath;
      }
      /** Delete a file or all files under a folder path. */
      async deletePath(path) {
        if (!this.context) return 0;
        const target = normalizeProjectPath(path.trim());
        if (!target) return 0;
        const before = this.context.files.length;
        this.context.files = this.context.files.filter(
          (f) => f.path !== target && !f.path.startsWith(`${target}/`)
        );
        const removed = before - this.context.files.length;
        if (removed > 0) {
          await this.saveToStorage();
          this.emitChange();
        }
        return removed;
      }
      // 更新文件内容
      async updateFile(path, content) {
        if (!this.context) return;
        const file = this.context.files.find((f) => f.path === path);
        if (file) {
          file.content = content;
          file.size = new Blob([content]).size;
          file.lastModified = Date.now();
          await this.saveToStorage();
        }
      }
      // 切换文件选择状态
      async toggleFileSelection(path) {
        if (!this.context) return;
        const file = this.context.files.find((f) => f.path === path);
        if (file) {
          file.selected = !file.selected;
          await this.saveToStorage();
        }
      }
      // 选择/取消选择所有文件
      async selectAllFiles(selected) {
        if (!this.context) return;
        this.context.files.forEach((f) => f.selected = selected);
        await this.saveToStorage();
      }
      // 获取选中的文件
      getSelectedFiles() {
        if (!this.context) return [];
        return this.context.files.filter((f) => f.selected !== false);
      }
      // 获取所有文件
      getAllFiles() {
        if (!this.context) return [];
        return this.context.files;
      }
      // 获取文件
      getFile(path) {
        if (!this.context) return void 0;
        return this.context.files.find((f) => f.path === path);
      }
      // 获取总大小
      getTotalSize() {
        if (!this.context) return 0;
        return this.context.files.reduce((sum, f) => sum + f.size, 0);
      }
      // 获取选中文件的总Token估算（粗略估计）
      getEstimatedTokens() {
        const selectedFiles = this.getSelectedFiles();
        const totalChars = selectedFiles.reduce((sum, f) => sum + f.content.length, 0);
        return Math.ceil(totalChars / 4);
      }
      /** Build AI system prompt with workspace context (locale follows UI language). */
      generateSystemPrompt(additionalContext, locale = "zh-CN") {
        const t = createTranslator(locale);
        const allFiles = this.getAllFiles();
        const selectedFiles = this.getSelectedFiles();
        const selectedPaths = new Set(selectedFiles.map((file) => file.path));
        if (allFiles.length === 0) {
          return additionalContext ? t("prompt.ws.emptyAssistantWith", { context: additionalContext }) : t("prompt.ws.emptyAssistant");
        }
        let prompt = `${t("prompt.ws.intro", { count: allFiles.length })}

`;
        prompt += `${t("prompt.ws.catalogTitle")}
`;
        prompt += `${t("prompt.ws.catalogLegend")}

`;
        prompt += `${buildWorkspaceFileCatalog(
          allFiles.map((file) => ({
            path: file.path,
            language: file.language,
            size: file.size,
            selected: selectedPaths.has(file.path)
          })),
          locale
        )}

`;
        const unselected = allFiles.filter((file) => !selectedPaths.has(file.path));
        if (unselected.length > 0) {
          prompt += `${t("prompt.ws.unselectedTitle")}

`;
          for (const file of unselected) {
            prompt += `### ${file.path}

\`\`\`${file.language}
${summarizeFileContent(file.content, 8, locale)}
\`\`\`

`;
          }
        }
        if (selectedFiles.length > 0) {
          prompt += `${t("prompt.ws.selectedTitle")}

`;
          for (const file of selectedFiles) {
            prompt += `### ${file.path}

\`\`\`${file.language}
${file.content}
\`\`\`

`;
          }
        }
        prompt += `${t("prompt.ws.instructionsTitle")}

`;
        prompt += `${t("prompt.ws.instruction1")}
`;
        prompt += `${t("prompt.ws.instruction2")}
`;
        prompt += `${t("prompt.ws.instruction3")}
`;
        prompt += `${t("prompt.ws.instruction4")}
`;
        prompt += `${t("prompt.ws.instruction5")}
`;
        if (additionalContext) {
          prompt += `
${additionalContext}
`;
        }
        return prompt;
      }
      // 检测编程语言
      detectLanguage(filename) {
        const ext = filename.split(".").pop()?.toLowerCase() || "";
        const map = {
          "js": "javascript",
          "ts": "typescript",
          "jsx": "javascript",
          "tsx": "typescript",
          "py": "python",
          "html": "html",
          "htm": "html",
          "css": "css",
          "scss": "scss",
          "sass": "sass",
          "less": "less",
          "json": "json",
          "md": "markdown",
          "vue": "vue",
          "svelte": "svelte",
          "java": "java",
          "c": "c",
          "cpp": "cpp",
          "h": "c",
          "go": "go",
          "rs": "rust",
          "php": "php",
          "rb": "ruby",
          "swift": "swift",
          "kt": "kotlin",
          "sql": "sql",
          "sh": "bash",
          "bash": "bash",
          "yml": "yaml",
          "yaml": "yaml",
          "xml": "xml",
          "dockerfile": "dockerfile"
        };
        return map[ext] || "plaintext";
      }
      // 导出工作区
      exportContext() {
        if (!this.context) return "";
        return JSON.stringify(this.context, null, 2);
      }
      // 导入工作区
      async importContext(json) {
        try {
          const context = JSON.parse(json);
          if (context.files && Array.isArray(context.files)) {
            this.context = context;
            await this.saveToStorage();
            return true;
          }
          return false;
        } catch (e) {
          console.error("Failed to import workspace context:", e);
          return false;
        }
      }
      // 获取工作区统计信息
      getStats() {
        if (!this.context) {
          return {
            totalFiles: 0,
            selectedFiles: 0,
            totalSize: 0,
            estimatedTokens: 0,
            languages: {}
          };
        }
        const languages = {};
        this.context.files.forEach((f) => {
          languages[f.language] = (languages[f.language] || 0) + 1;
        });
        return {
          totalFiles: this.context.files.length,
          selectedFiles: this.context.files.filter((f) => f.selected !== false).length,
          totalSize: this.getTotalSize(),
          estimatedTokens: this.getEstimatedTokens(),
          languages
        };
      }
    };
    workspaceContextService = new WorkspaceContextService();
  }
});

// src/services/agentTools/grepRepoCore.ts
function filterPathsByGlob(paths, glob) {
  if (!glob?.trim()) return paths;
  const norm = glob.replace(/\\/g, "/");
  const reSource = norm.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\/?/g, "(?:.*/)?").replace(/\*/g, "[^/]*");
  const re = new RegExp(`^${reSource}$`, "i");
  return paths.filter((p) => re.test(p.replace(/\\/g, "/")));
}
function grepInSources(editorFiles, workspaceFiles, options) {
  const pattern = options.pattern.trim();
  if (!pattern) return [];
  let files = collectSearchableFiles(editorFiles, workspaceFiles);
  if (options.glob) {
    const allowed = new Set(filterPathsByGlob(files.map((f) => f.name), options.glob));
    files = files.filter((f) => allowed.has(f.name));
  }
  const hits = searchInFiles(files, pattern, {
    caseSensitive: options.caseSensitive,
    regex: options.regex
  });
  const limit = Math.min(Math.max(options.limit ?? 40, 1), 200);
  return hits.slice(0, limit);
}
var init_grepRepoCore = __esm({
  "src/services/agentTools/grepRepoCore.ts"() {
    "use strict";
    init_searchService();
    init_workspaceContextService();
  }
});

// lib/api/backgroundAgentTools.ts
function truncate(text, max = MAX_TOOL_OUTPUT) {
  if (text.length <= max) return { text, truncated: false };
  return { text: `${text.slice(0, max)}
\u2026(truncated)`, truncated: true };
}
function workspaceFilesForGrep(workspace) {
  return workspace.listPaths(void 0, 500).map((path) => ({
    path,
    content: workspace.readFile(path)
  }));
}
function searchPaths(workspace, query, limit) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = [];
  for (const path of workspace.listPaths(void 0, 500)) {
    if (path.toLowerCase().includes(q)) {
      hits.push(path);
      if (hits.length >= limit) return hits;
    }
    const base = path.split("/").pop() ?? path;
    if (base.toLowerCase().includes(q) && !hits.includes(path)) {
      hits.push(path);
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}
function executeBackgroundAgentTool(workspace, name, args) {
  try {
    let output = "";
    switch (name) {
      case "list_files": {
        const max = typeof args.max === "number" ? args.max : 100;
        const glob = typeof args.glob === "string" ? args.glob : void 0;
        const paths = workspace.listPaths(glob, Math.min(max, 200));
        output = paths.length === 0 ? "(no files)" : paths.join("\n");
        break;
      }
      case "read_file": {
        const path = String(args.path ?? "");
        const start = typeof args.start_line === "number" ? args.start_line : void 0;
        const end = typeof args.end_line === "number" ? args.end_line : void 0;
        let text = workspace.readFile(path, start, end);
        if (text.length > MAX_READ_CHARS) {
          text = `${text.slice(0, MAX_READ_CHARS)}
\u2026(file truncated for context)`;
        }
        output = text;
        break;
      }
      case "write_file": {
        const path = String(args.path ?? "");
        const content = String(args.content ?? "");
        workspace.writeFile(path, content);
        output = `OK: wrote ${path} (${content.length} chars)`;
        break;
      }
      case "search_repo": {
        const query = String(args.query ?? "").trim();
        const limit = typeof args.limit === "number" ? args.limit : 20;
        const hits = searchPaths(workspace, query, Math.min(Math.max(limit, 1), 50));
        output = hits.length === 0 ? "(no matches)" : hits.join("\n");
        break;
      }
      case "grep_repo": {
        const pattern = String(args.pattern ?? "").trim();
        const glob = typeof args.glob === "string" ? args.glob : void 0;
        const limit = typeof args.limit === "number" ? args.limit : 40;
        const caseSensitive = args.case_sensitive === true;
        const regex = args.regex === true;
        const files = workspaceFilesForGrep(workspace);
        const editorFiles = files.map((f) => ({ name: f.path, content: f.content }));
        const workspaceFiles = files.map((f) => ({ path: f.path, content: f.content }));
        const hits = grepInSources(editorFiles, workspaceFiles, {
          pattern,
          glob,
          limit,
          caseSensitive,
          regex
        });
        if (glob) {
          const allowed = new Set(filterPathsByGlob(files.map((f) => f.path), glob));
          const filtered = hits.filter((h) => allowed.has(h.file));
          output = filtered.length === 0 ? "(no matches)" : filtered.map((h) => `${h.file}:${h.line}: ${h.content}`).join("\n");
        } else {
          output = hits.length === 0 ? "(no matches)" : hits.map((h) => `${h.file}:${h.line}: ${h.content}`).join("\n");
        }
        break;
      }
      default:
        throw new Error(`UNKNOWN_TOOL: ${name}`);
    }
    const clipped = truncate(output);
    return { ok: true, output: clipped.text, truncated: clipped.truncated };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, output: message, error: message };
  }
}
var BACKGROUND_AGENT_TOOL_DEFINITIONS, MAX_READ_CHARS, MAX_TOOL_OUTPUT;
var init_backgroundAgentTools = __esm({
  "lib/api/backgroundAgentTools.ts"() {
    "use strict";
    init_grepRepoCore();
    BACKGROUND_AGENT_TOOL_DEFINITIONS = [
      {
        type: "function",
        function: {
          name: "list_files",
          description: "List relative file paths in the cloud workspace.",
          parameters: {
            type: "object",
            properties: {
              glob: { type: "string", description: "Optional glob filter, e.g. src/**/*.ts" },
              max: { type: "number", description: "Max paths (default 100)" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "read_file",
          description: "Read file content by relative path. Optional 1-based line range.",
          parameters: {
            type: "object",
            properties: {
              path: { type: "string" },
              start_line: { type: "number" },
              end_line: { type: "number" }
            },
            required: ["path"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "write_file",
          description: "Write or overwrite a file with FULL content (not a diff).",
          parameters: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string" }
            },
            required: ["path", "content"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_repo",
          description: "Search file paths (and simple symbol-like tokens in paths).",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" },
              limit: { type: "number" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "grep_repo",
          description: "Search file contents for text or regex.",
          parameters: {
            type: "object",
            properties: {
              pattern: { type: "string" },
              glob: { type: "string" },
              limit: { type: "number" },
              case_sensitive: { type: "boolean" },
              regex: { type: "boolean" }
            },
            required: ["pattern"]
          }
        }
      }
    ];
    MAX_READ_CHARS = 48e3;
    MAX_TOOL_OUTPUT = 32e3;
  }
});

// lib/api/backgroundAgentChat.ts
function serializeMessages(messages) {
  return messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "tool",
        tool_call_id: message.tool_call_id,
        content: message.content
      };
    }
    if (message.role === "assistant") {
      const payload = { role: "assistant" };
      if (message.tool_calls?.length) {
        payload.tool_calls = message.tool_calls;
        payload.content = message.content ?? null;
      } else {
        payload.content = message.content ?? "";
      }
      if (message.reasoning_content != null && message.reasoning_content !== "") {
        payload.reasoning_content = message.reasoning_content;
      }
      return payload;
    }
    return { role: message.role, content: message.content };
  });
}
async function parseApiError(response) {
  try {
    const data = await response.json();
    const msg = data?.error?.message ?? data?.message ?? (typeof data?.error === "string" ? data.error : null);
    if (msg) return String(msg);
    return JSON.stringify(data).slice(0, 400);
  } catch {
    return await response.text().catch(() => "");
  }
}
async function sendBackgroundAgentCompletion(userId, config, messages, options) {
  if (!supportsBackgroundAgentTools(config.provider)) {
    throw new Error(`AGENT_PROVIDER_UNSUPPORTED:${config.provider}`);
  }
  const quota = await consumeAiUsage(userId, 1);
  if (!quota.ok) {
    throw new Error("AI_QUOTA_EXCEEDED");
  }
  const model = config.provider === "deepseek" ? resolveDeepSeekModelId(config.model) : config.model;
  const body = {
    model,
    messages: serializeMessages(messages),
    temperature: 0.4
  };
  if (config.provider === "deepseek") {
    body.thinking = DEEPSEEK_AGENT_THINKING;
  }
  const tools = options?.tools ?? BACKGROUND_AGENT_TOOL_DEFINITIONS;
  if (tools.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const detail = await parseApiError(response);
    throw new Error(`AI_HTTP_${response.status}${detail ? `: ${detail}` : ""}`);
  }
  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message ?? {};
  return {
    content: message.content ?? null,
    tool_calls: message.tool_calls,
    reasoning_content: message.reasoning_content ?? null,
    finish_reason: choice?.finish_reason
  };
}
var DEEPSEEK_AGENT_THINKING;
var init_backgroundAgentChat = __esm({
  "lib/api/backgroundAgentChat.ts"() {
    "use strict";
    init_usageDb();
    init_backgroundAgentConfig();
    init_backgroundAgentTools();
    DEEPSEEK_AGENT_THINKING = { type: "disabled" };
  }
});

// lib/api/backgroundAgentLoop.ts
function parseToolArguments(raw) {
  try {
    const parsed = JSON.parse(raw || "{}");
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
function buildBackgroundAgentMessages(workspace, userGoal) {
  return [
    {
      role: "system",
      content: `${AGENT_SYSTEM}

Workspace:
${workspace.summarize()}`
    },
    { role: "user", content: userGoal }
  ];
}
async function runBackgroundAgentLoop(userId, config, workspace, userGoal, callbacks) {
  const messages = buildBackgroundAgentMessages(workspace, userGoal);
  const maxRounds = resolveBackgroundAgentMaxRounds();
  let finalContent = "";
  let rounds = 0;
  let toolCalls = 0;
  for (let round = 0; round < maxRounds; round++) {
    if (await callbacks?.shouldStop?.()) break;
    rounds = round + 1;
    await callbacks?.onRound?.(rounds);
    const completion = await sendBackgroundAgentCompletion(userId, config, messages);
    if (completion.content?.trim()) {
      finalContent = completion.content;
    }
    const calls = completion.tool_calls;
    if (!calls?.length) break;
    messages.push({
      role: "assistant",
      content: completion.content,
      tool_calls: calls,
      reasoning_content: completion.reasoning_content ?? null
    });
    for (const call of calls) {
      if (await callbacks?.shouldStop?.()) break;
      const name = call.function.name;
      const args = parseToolArguments(call.function.arguments);
      const result = executeBackgroundAgentTool(workspace, name, args);
      toolCalls++;
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result.ok ? result.output : `ERROR: ${result.error ?? result.output}`
      });
    }
    if (completion.finish_reason === "stop" && !completion.tool_calls?.length) {
      break;
    }
  }
  return { finalContent, rounds, toolCalls };
}
var AGENT_SYSTEM;
var init_backgroundAgentLoop = __esm({
  "lib/api/backgroundAgentLoop.ts"() {
    "use strict";
    init_backgroundAgentConfig();
    init_backgroundAgentChat();
    init_backgroundAgentTools();
    AGENT_SYSTEM = `You are an autonomous coding agent running as a cloud background job in AI IDE.
- Use list_files and read_file to explore before editing.
- Use search_repo for file paths; grep_repo for content search.
- Use write_file with the FULL file content for each change (not a diff).
- run_command, move_file, delete_file are NOT available in this environment.
- When done, reply briefly summarizing what you changed.`;
  }
});

// lib/api/backgroundAgentWorkspace.ts
function normalizePath(path) {
  const trimmed = path.replace(/\\/g, "/").replace(/^\.\//, "").trim();
  if (!trimmed || /\.\.|^\/|\\/.test(trimmed)) return null;
  const parts = trimmed.split("/").filter((p) => p && p !== ".");
  if (parts.some((p) => p === "..")) return null;
  return parts.join("/");
}
function detectLanguageFromPath(path) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    json: "json",
    md: "markdown",
    css: "css",
    html: "html",
    vue: "vue",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    sql: "sql",
    yml: "yaml",
    yaml: "yaml"
  };
  return map[ext] ?? "plaintext";
}
var BackgroundAgentWorkspace;
var init_backgroundAgentWorkspace = __esm({
  "lib/api/backgroundAgentWorkspace.ts"() {
    "use strict";
    BackgroundAgentWorkspace = class {
      files = /* @__PURE__ */ new Map();
      initialContent = /* @__PURE__ */ new Map();
      constructor(records) {
        for (const record of records) {
          const path = normalizePath(record.name);
          if (!path) continue;
          const language = record.language ?? detectLanguageFromPath(path);
          this.files.set(path, { content: record.content, language });
          this.initialContent.set(path, record.content);
        }
      }
      listPaths(glob, max = 100) {
        let paths = [...this.files.keys()].sort();
        if (glob?.trim()) {
          const norm = glob.replace(/\\/g, "/");
          const reSource = norm.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\/?/g, "(?:.*/)?").replace(/\*/g, "[^/]*");
          const re = new RegExp(`^${reSource}$`, "i");
          paths = paths.filter((p) => re.test(p));
        }
        return paths.slice(0, Math.min(max, 200));
      }
      readFile(path, startLine, endLine) {
        const normalized = normalizePath(path);
        if (!normalized) throw new Error("INVALID_PATH");
        const file = this.files.get(normalized);
        if (!file) throw new Error(`FILE_NOT_FOUND: ${normalized}`);
        if (startLine === void 0 && endLine === void 0) return file.content;
        const lines = file.content.split(/\r?\n/);
        const s = Math.max(1, startLine ?? 1);
        const e = Math.min(lines.length, endLine ?? lines.length);
        return lines.slice(s - 1, e).join("\n");
      }
      writeFile(path, content) {
        const normalized = normalizePath(path);
        if (!normalized) throw new Error("INVALID_PATH");
        if (content.length > 512e3) throw new Error("CONTENT_TOO_LARGE");
        const language = detectLanguageFromPath(normalized);
        this.files.set(normalized, { content, language });
        if (!this.initialContent.has(normalized)) {
          this.initialContent.set(normalized, "");
        }
      }
      getPendingChanges() {
        const changes = [];
        for (const [path, file] of this.files) {
          const before = this.initialContent.get(path);
          if (before === void 0) {
            changes.push({ path, content: file.content, language: file.language });
            continue;
          }
          if (before !== file.content) {
            changes.push({ path, content: file.content, language: file.language });
          }
        }
        return changes;
      }
      summarize(maxChars = 12e3) {
        const paths = this.listPaths(void 0, 200);
        const lines = [`Files (${paths.length}):`, ...paths.slice(0, 80)];
        if (paths.length > 80) lines.push(`\u2026 and ${paths.length - 80} more`);
        const text = lines.join("\n");
        if (text.length <= maxChars) return text;
        return `${text.slice(0, maxChars)}\u2026`;
      }
    };
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
async function runAgentBackgroundJob(job, ctx) {
  const stamp = () => (/* @__PURE__ */ new Date()).toISOString();
  await ctx.setProgress({ phase: "agent:load", updatedAt: stamp() });
  if (await ctx.isCancelled()) return { kind: "cancelled" };
  if (isJobRuntimeExpired(ctx.startedAt)) return { kind: "timeout" };
  const workspaceName = (job.repoKey?.trim() || "default").slice(0, 256);
  let workspaceRow = await getWorkspaceByName(job.userId, workspaceName);
  if (!workspaceRow && workspaceName === "default") {
    workspaceRow = await ensureDefaultWorkspace(job.userId);
  }
  if (!workspaceRow) {
    return { kind: "failed", error: "WORKSPACE_NOT_FOUND" };
  }
  const ai = resolveBackgroundAgentAiConfig(workspaceRow.settings);
  if (!ai.ok) {
    return { kind: "failed", error: ai.error };
  }
  const files = parseWorkspaceFilesJson(workspaceRow.files);
  const workspace = new BackgroundAgentWorkspace(files);
  await ctx.setProgress({ phase: "agent:start", updatedAt: stamp() });
  try {
    const loop = await runBackgroundAgentLoop(
      job.userId,
      ai.config,
      workspace,
      job.prompt,
      {
        shouldStop: async () => await ctx.isCancelled() || isJobRuntimeExpired(ctx.startedAt),
        onRound: async (round) => {
          if (isJobRuntimeExpired(ctx.startedAt)) return;
          await ctx.setProgress({
            phase: "agent:round",
            round,
            updatedAt: stamp()
          });
        }
      }
    );
    if (await ctx.isCancelled()) return { kind: "cancelled" };
    if (isJobRuntimeExpired(ctx.startedAt)) return { kind: "timeout" };
    const pendingChanges = workspace.getPendingChanges();
    const summary = loop.finalContent.trim() || (pendingChanges.length > 0 ? `Background agent updated ${pendingChanges.length} file(s) in ${workspaceName}.` : `Background agent completed with no file changes (${loop.toolCalls} tool call(s)).`);
    await ctx.setProgress({ phase: "agent:done", round: loop.rounds, updatedAt: stamp() });
    return {
      kind: "succeeded",
      result: {
        mode: "agent",
        summary: summary.slice(0, 4e3),
        rounds: loop.rounds,
        pendingChanges
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Jobs] Agent worker failed:", job.id, message);
    return { kind: "failed", error: message.slice(0, 500) };
  }
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
    init_backgroundAgentLoop();
    init_backgroundAgentConfig();
    init_backgroundAgentWorkspace();
    init_backgroundJobTypes();
    init_backgroundJobCloudWriteback();
    init_backgroundJobsService();
    init_workspacesService();
  }
});

// lib/api/backgroundJobProcessor.ts
async function processBackgroundJobs(options = {}) {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const workerMode = resolveBackgroundJobWorkerMode();
  const limit = options.limit ?? DEFAULT_JOBS_PER_CRON_TICK;
  const staleFailed = await failStaleRunningBackgroundJobs();
  const result = {
    staleFailed,
    processed: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
    jobIds: [],
    workerMode,
    startedAt,
    finishedAt: startedAt,
    durationMs: 0
  };
  for (let i = 0; i < limit; i++) {
    const job = await claimNextQueuedBackgroundJob();
    if (!job) break;
    result.processed++;
    result.jobIds.push(job.id);
    const jobStarted = Date.now();
    const run = await executeBackgroundJob(job);
    const jobMs = Date.now() - jobStarted;
    console.info("[Jobs process] job finished", {
      jobId: job.id,
      outcome: run.outcome,
      workerMode,
      durationMs: jobMs
    });
    if (run.outcome === "succeeded") result.succeeded++;
    else if (run.outcome === "cancelled") result.cancelled++;
    else result.failed++;
  }
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  result.durationMs = Date.now() - startedMs;
  console.info("[Jobs process] tick complete", result);
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
  POST: () => POST22
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
async function POST22(request) {
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
  POST: () => POST23
});
async function POST23(req, ctx) {
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

// lib/api/collabLivekit.ts
import { AccessToken } from "livekit-server-sdk";
async function createLivekitAccessToken(roomName, identity, displayName) {
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!apiKey || !apiSecret) return null;
  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name: displayName ?? identity,
    ttl: 2 * 60 * 60
  });
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true
  });
  return token.toJwt();
}
async function appendLivekitToken(payload, userId, displayName) {
  if (payload.mode !== "livekit") return payload;
  const jwt2 = await createLivekitAccessToken(payload.roomChannel, userId, displayName);
  if (!jwt2) return payload;
  return { ...payload, livekitToken: jwt2 };
}
var init_collabLivekit = __esm({
  "lib/api/collabLivekit.ts"() {
    "use strict";
  }
});

// lib/api/collabPermissions.ts
function canManageCollabMember(actorUserId, roomHostId, targetRole) {
  return actorUserId === roomHostId && targetRole !== "host";
}
var init_collabPermissions = __esm({
  "lib/api/collabPermissions.ts"() {
    "use strict";
  }
});

// lib/api/collabTypes.ts
function isCollabMemberRole(value) {
  return COLLAB_MEMBER_ROLES.includes(value);
}
function normalizeJoinRole(raw, isHost) {
  if (isHost) return "host";
  const role = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (role === "viewer") return "viewer";
  return "editor";
}
var COLLAB_MEMBER_ROLES, COLLAB_ROOM_CODE_LENGTH, MAX_COLLAB_ROOM_NAME_CHARS;
var init_collabTypes = __esm({
  "lib/api/collabTypes.ts"() {
    "use strict";
    COLLAB_MEMBER_ROLES = ["host", "editor", "viewer"];
    COLLAB_ROOM_CODE_LENGTH = 8;
    MAX_COLLAB_ROOM_NAME_CHARS = 120;
  }
});

// lib/api/collaborationRoomsService.ts
function resolveYjsSignalingUrls() {
  const custom = process.env.COLLAB_SIGNALING_URL?.trim();
  if (custom) return [custom];
  const list = process.env.COLLAB_SIGNALING_URLS?.split(",").map((s) => s.trim()).filter(Boolean);
  if (list?.length) return list;
  return DEFAULT_YJS_SIGNALING;
}
function randomRoomCode() {
  return Math.random().toString(36).slice(2, 2 + COLLAB_ROOM_CODE_LENGTH).toLowerCase();
}
async function uniqueRoomCode() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomRoomCode();
    const existing = await prisma.collaborationRoom.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("COLLAB_CODE_GENERATION_FAILED");
}
function buildCollabSignaling(room) {
  const livekitUrl = process.env.LIVEKIT_URL?.trim();
  const hasLivekit = livekitUrl && process.env.LIVEKIT_API_KEY?.trim() && process.env.LIVEKIT_API_SECRET?.trim();
  if (hasLivekit) {
    return {
      mode: "livekit",
      roomChannel: room.code,
      livekitUrl,
      signalingUrls: resolveYjsSignalingUrls()
    };
  }
  return {
    mode: "yjs-webrtc",
    roomChannel: `ai-ide-${room.code}`,
    signalingUrls: resolveYjsSignalingUrls()
  };
}
async function buildCollabSignalingForUser(room, userId, displayName) {
  return appendLivekitToken(buildCollabSignaling(room), userId, displayName);
}
function serializeCollabMember(member) {
  return {
    id: member.id,
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    leftAt: member.leftAt?.toISOString() ?? null
  };
}
function serializeCollabRoom(room, members, signaling) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    status: room.status,
    hostId: room.hostId,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
    members: members.map(serializeCollabMember),
    signaling: signaling ?? buildCollabSignaling(room)
  };
}
async function createCollaborationRoom(userId, name) {
  const code = await uniqueRoomCode();
  const trimmedName = name?.trim() || null;
  const room = await prisma.collaborationRoom.create({
    data: {
      code,
      hostId: userId,
      name: trimmedName,
      status: "open",
      members: {
        create: {
          userId,
          role: "host"
        }
      }
    },
    include: { members: true }
  });
  return room;
}
async function getCollaborationRoomByCode(code) {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;
  return prisma.collaborationRoom.findUnique({
    where: { code: normalized },
    include: { members: { where: { leftAt: null } } }
  });
}
async function listCollaborationRoomsForUser(userId) {
  return prisma.collaborationRoom.findMany({
    where: {
      OR: [{ hostId: userId }, { members: { some: { userId, leftAt: null } } }]
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { members: { where: { leftAt: null } } }
  });
}
async function joinCollaborationRoom(userId, code, requestedRole) {
  const room = await getCollaborationRoomByCode(code);
  if (!room) return { ok: false, reason: "not_found" };
  if (room.status === "closed") return { ok: false, reason: "closed" };
  const isHost = room.hostId === userId;
  const role = isHost ? "host" : requestedRole === "viewer" ? "viewer" : "editor";
  if (!isHost && requestedRole === "host") {
    return { ok: false, reason: "forbidden" };
  }
  await prisma.collaborationMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId } },
    create: { roomId: room.id, userId, role },
    update: { role, leftAt: null, joinedAt: /* @__PURE__ */ new Date() }
  });
  const refreshed = await getCollaborationRoomByCode(code);
  if (!refreshed) return { ok: false, reason: "not_found" };
  return { ok: true, room: refreshed, members: refreshed.members };
}
async function leaveCollaborationRoom(userId, code) {
  const room = await getCollaborationRoomByCode(code);
  if (!room) return { ok: false, reason: "not_found" };
  const member = await prisma.collaborationMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId } }
  });
  if (!member) return { ok: false, reason: "not_member" };
  await prisma.collaborationMember.update({
    where: { id: member.id },
    data: { leftAt: /* @__PURE__ */ new Date() }
  });
  return { ok: true };
}
async function updateCollaborationMemberRole(actorUserId, code, targetUserId, nextRole) {
  const room = await getCollaborationRoomByCode(code);
  if (!room) return { ok: false, reason: "not_found" };
  const target = room.members.find((m) => m.userId === targetUserId);
  if (!target) return { ok: false, reason: "target_not_found" };
  const targetRole = isCollabMemberRole(target.role) ? target.role : "editor";
  if (!canManageCollabMember(actorUserId, room.hostId, targetRole)) {
    return { ok: false, reason: "forbidden" };
  }
  await prisma.collaborationMember.update({
    where: { id: target.id },
    data: { role: nextRole }
  });
  const refreshed = await getCollaborationRoomByCode(code);
  if (!refreshed) return { ok: false, reason: "not_found" };
  return { ok: true, room: refreshed, members: refreshed.members };
}
async function kickCollaborationMember(actorUserId, code, targetUserId) {
  const room = await getCollaborationRoomByCode(code);
  if (!room) return { ok: false, reason: "not_found" };
  const target = await prisma.collaborationMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: targetUserId } }
  });
  if (!target || target.leftAt) return { ok: false, reason: "target_not_found" };
  const targetRole = isCollabMemberRole(target.role) ? target.role : "editor";
  if (!canManageCollabMember(actorUserId, room.hostId, targetRole)) {
    return { ok: false, reason: "forbidden" };
  }
  await prisma.collaborationMember.update({
    where: { id: target.id },
    data: { leftAt: /* @__PURE__ */ new Date() }
  });
  const refreshed = await getCollaborationRoomByCode(code);
  if (!refreshed) return { ok: false, reason: "not_found" };
  return { ok: true, room: refreshed, members: refreshed.members };
}
var DEFAULT_YJS_SIGNALING;
var init_collaborationRoomsService = __esm({
  "lib/api/collaborationRoomsService.ts"() {
    "use strict";
    init_prisma();
    init_collabLivekit();
    init_collabPermissions();
    init_collabTypes();
    DEFAULT_YJS_SIGNALING = ["wss://signaling.yjs.dev"];
  }
});

// lib/api/handlers/collab/rooms/index.ts
var rooms_exports = {};
__export(rooms_exports, {
  GET: () => GET17,
  POST: () => POST24
});
async function GET17(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    const rooms = await listCollaborationRoomsForUser(auth.user.id);
    return jsonResponse({
      rooms: rooms.map((room) => serializeCollabRoom(room, room.members))
    });
  } catch (error) {
    console.error("[Collab] List rooms error:", error);
    return localizedErrorResponse(req, "api.collab.listFailed", 500);
  }
}
async function POST24(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    const parsed = await readJsonWithLimit(req, MAX_BODY_BYTES);
    if (!parsed.ok) return parsed.response;
    const name = typeof parsed.value.name === "string" ? parsed.value.name.trim() : "";
    if (name.length > MAX_COLLAB_ROOM_NAME_CHARS) {
      return localizedErrorResponse(req, "api.collab.nameTooLong", 400);
    }
    const room = await createCollaborationRoom(auth.user.id, name || null);
    const signaling = await buildCollabSignalingForUser(
      room,
      auth.user.id,
      auth.user.name ?? void 0
    );
    return jsonResponse(
      appendApiMessage(req, "api.collab.roomCreated", {
        room: serializeCollabRoom(room, room.members, signaling)
      }),
      201
    );
  } catch (error) {
    console.error("[Collab] Create room error:", error);
    return localizedErrorResponse(req, "api.collab.createFailed", 500);
  }
}
var MAX_BODY_BYTES;
var init_rooms = __esm({
  "lib/api/handlers/collab/rooms/index.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_body();
    init_localizedError();
    init_collaborationRoomsService();
    init_collabTypes();
    MAX_BODY_BYTES = 8e3;
  }
});

// lib/api/handlers/collab/rooms/byCode.ts
var byCode_exports = {};
__export(byCode_exports, {
  GET: () => GET18,
  POST: () => POST25
});
async function GET18(req, ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const code = ctx?.params?.code?.trim().toLowerCase();
  if (!code) {
    return localizedErrorResponse(req, "api.collab.codeRequired", 400);
  }
  try {
    const room = await getCollaborationRoomByCode(code);
    if (!room) {
      return localizedErrorResponse(req, "api.collab.roomNotFound", 404);
    }
    const isMember = room.members.some((m) => m.userId === auth.user.id);
    if (!isMember && room.hostId !== auth.user.id) {
      return localizedErrorResponse(req, "api.collab.notMember", 403);
    }
    const signaling = await buildCollabSignalingForUser(
      room,
      auth.user.id,
      auth.user.name ?? void 0
    );
    return jsonResponse({
      room: serializeCollabRoom(room, room.members, signaling)
    });
  } catch (error) {
    console.error("[Collab] Get room error:", error);
    return localizedErrorResponse(req, "api.collab.loadFailed", 500);
  }
}
async function POST25(req, ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const code = ctx?.params?.code?.trim().toLowerCase();
  if (!code) {
    return localizedErrorResponse(req, "api.collab.codeRequired", 400);
  }
  try {
    const parsed = await readJsonWithLimit(req, MAX_BODY_BYTES2);
    if (!parsed.ok) return parsed.response;
    const roomPreview = await getCollaborationRoomByCode(code);
    const isHost = roomPreview?.hostId === auth.user.id;
    const requestedRole = normalizeJoinRole(parsed.value.role, isHost);
    const result = await joinCollaborationRoom(auth.user.id, code, requestedRole);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return localizedErrorResponse(req, "api.collab.roomNotFound", 404);
      }
      if (result.reason === "closed") {
        return localizedErrorResponse(req, "api.collab.roomClosed", 409);
      }
      return localizedErrorResponse(req, "api.collab.joinForbidden", 403);
    }
    const signaling = await buildCollabSignalingForUser(
      result.room,
      auth.user.id,
      auth.user.name ?? void 0
    );
    return jsonResponse(
      appendApiMessage(req, "api.collab.joined", {
        room: serializeCollabRoom(result.room, result.members, signaling)
      })
    );
  } catch (error) {
    console.error("[Collab] Join room error:", error);
    return localizedErrorResponse(req, "api.collab.joinFailed", 500);
  }
}
var MAX_BODY_BYTES2;
var init_byCode = __esm({
  "lib/api/handlers/collab/rooms/byCode.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_body();
    init_localizedError();
    init_collaborationRoomsService();
    init_collabTypes();
    MAX_BODY_BYTES2 = 4e3;
  }
});

// lib/api/handlers/collab/rooms/leave.ts
var leave_exports = {};
__export(leave_exports, {
  POST: () => POST26
});
async function POST26(req, ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const code = ctx?.params?.code?.trim().toLowerCase();
  if (!code) {
    return localizedErrorResponse(req, "api.collab.codeRequired", 400);
  }
  try {
    const result = await leaveCollaborationRoom(auth.user.id, code);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return localizedErrorResponse(req, "api.collab.roomNotFound", 404);
      }
      return localizedErrorResponse(req, "api.collab.notMember", 403);
    }
    return jsonResponse(appendApiMessage(req, "api.collab.left", { success: true }));
  } catch (error) {
    console.error("[Collab] Leave room error:", error);
    return localizedErrorResponse(req, "api.collab.leaveFailed", 500);
  }
}
var init_leave = __esm({
  "lib/api/handlers/collab/rooms/leave.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_localizedError();
    init_collaborationRoomsService();
  }
});

// lib/api/handlers/collab/rooms/member.ts
var member_exports = {};
__export(member_exports, {
  PATCH: () => PATCH
});
async function PATCH(req, ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const code = ctx?.params?.code?.trim().toLowerCase();
  const targetUserId = ctx?.params?.userId?.trim();
  if (!code) {
    return localizedErrorResponse(req, "api.collab.codeRequired", 400);
  }
  if (!targetUserId) {
    return localizedErrorResponse(req, "api.collab.memberRequired", 400);
  }
  try {
    const parsed = await readJsonWithLimit(req, MAX_BODY_BYTES3);
    if (!parsed.ok) return parsed.response;
    const role = typeof parsed.value.role === "string" ? parsed.value.role.trim().toLowerCase() : "";
    if (role !== "editor" && role !== "viewer") {
      return localizedErrorResponse(req, "api.collab.invalidRole", 400);
    }
    const result = await updateCollaborationMemberRole(
      auth.user.id,
      code,
      targetUserId,
      role
    );
    if (!result.ok) {
      if (result.reason === "not_found") {
        return localizedErrorResponse(req, "api.collab.roomNotFound", 404);
      }
      if (result.reason === "target_not_found") {
        return localizedErrorResponse(req, "api.collab.memberNotFound", 404);
      }
      return localizedErrorResponse(req, "api.collab.forbidden", 403);
    }
    const signaling = await buildCollabSignalingForUser(
      result.room,
      auth.user.id,
      auth.user.name ?? void 0
    );
    return jsonResponse(
      appendApiMessage(req, "api.collab.roleUpdated", {
        room: serializeCollabRoom(result.room, result.members, signaling)
      })
    );
  } catch (error) {
    console.error("[Collab] Update member role error:", error);
    return localizedErrorResponse(req, "api.collab.roleUpdateFailed", 500);
  }
}
var MAX_BODY_BYTES3;
var init_member = __esm({
  "lib/api/handlers/collab/rooms/member.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_body();
    init_localizedError();
    init_collaborationRoomsService();
    MAX_BODY_BYTES3 = 2e3;
  }
});

// lib/api/handlers/collab/rooms/kick.ts
var kick_exports = {};
__export(kick_exports, {
  POST: () => POST27
});
async function POST27(req, ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const code = ctx?.params?.code?.trim().toLowerCase();
  const targetUserId = ctx?.params?.userId?.trim();
  if (!code) {
    return localizedErrorResponse(req, "api.collab.codeRequired", 400);
  }
  if (!targetUserId) {
    return localizedErrorResponse(req, "api.collab.memberRequired", 400);
  }
  try {
    const result = await kickCollaborationMember(auth.user.id, code, targetUserId);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return localizedErrorResponse(req, "api.collab.roomNotFound", 404);
      }
      if (result.reason === "target_not_found") {
        return localizedErrorResponse(req, "api.collab.memberNotFound", 404);
      }
      return localizedErrorResponse(req, "api.collab.forbidden", 403);
    }
    const signaling = await buildCollabSignalingForUser(
      result.room,
      auth.user.id,
      auth.user.name ?? void 0
    );
    return jsonResponse(
      appendApiMessage(req, "api.collab.memberKicked", {
        room: serializeCollabRoom(result.room, result.members, signaling)
      })
    );
  } catch (error) {
    console.error("[Collab] Kick member error:", error);
    return localizedErrorResponse(req, "api.collab.kickFailed", 500);
  }
}
var init_kick = __esm({
  "lib/api/handlers/collab/rooms/kick.ts"() {
    "use strict";
    init_http();
    init_requireAuth();
    init_localizedError();
    init_collaborationRoomsService();
  }
});

// lib/api/handlers/auth/authCatchAll.ts
var authCatchAll_exports = {};
__export(authCatchAll_exports, {
  GET: () => GET19
});
import { randomBytes as randomBytes2 } from "crypto";
async function GET19(req) {
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
    method: "POST",
    match: (p) => p === "/api/jobs/batch" ? {} : null,
    load: () => Promise.resolve().then(() => (init_batch(), batch_exports)),
    export: "POST"
  },
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
  { method: "GET", match: (p) => p === "/api/collab/rooms" ? {} : null, load: () => Promise.resolve().then(() => (init_rooms(), rooms_exports)), export: "GET" },
  { method: "POST", match: (p) => p === "/api/collab/rooms" ? {} : null, load: () => Promise.resolve().then(() => (init_rooms(), rooms_exports)), export: "POST" },
  {
    method: "GET",
    match: (p) => {
      const m = p.match(/^\/api\/collab\/rooms\/([^/]+)$/);
      return m ? { code: decodeURIComponent(m[1]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_byCode(), byCode_exports)),
    export: "GET"
  },
  {
    method: "POST",
    match: (p) => {
      const m = p.match(/^\/api\/collab\/rooms\/([^/]+)$/);
      return m ? { code: decodeURIComponent(m[1]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_byCode(), byCode_exports)),
    export: "POST"
  },
  {
    method: "POST",
    match: (p) => {
      const m = p.match(/^\/api\/collab\/rooms\/([^/]+)\/leave$/);
      return m ? { code: decodeURIComponent(m[1]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_leave(), leave_exports)),
    export: "POST"
  },
  {
    method: "PATCH",
    match: (p) => {
      const m = p.match(/^\/api\/collab\/rooms\/([^/]+)\/members\/([^/]+)$/);
      return m ? { code: decodeURIComponent(m[1]), userId: decodeURIComponent(m[2]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_member(), member_exports)),
    export: "PATCH"
  },
  {
    method: "POST",
    match: (p) => {
      const m = p.match(/^\/api\/collab\/rooms\/([^/]+)\/members\/([^/]+)\/kick$/);
      return m ? { code: decodeURIComponent(m[1]), userId: decodeURIComponent(m[2]) } : null;
    },
    load: () => Promise.resolve().then(() => (init_kick(), kick_exports)),
    export: "POST"
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
var GET20 = handle;
var POST28 = handle;
var PUT2 = handle;
var DELETE2 = handle;
var PATCH2 = handle;
var OPTIONS = handle;
export {
  DELETE2 as DELETE,
  GET20 as GET,
  OPTIONS,
  PATCH2 as PATCH,
  POST28 as POST,
  PUT2 as PUT
};
//# sourceMappingURL=index.js.map
