/**
 * Auth API - 占位实现
 * 
 * 当前为纯前端模式，所有认证功能已禁用。
 * 此 API 返回 501 提示前端使用本地存储模式。
 * 
 * 如需完整认证，需接入 Auth.js + 数据库 + OAuth 提供商
 */

import { Auth } from "@auth/core"
export const GET = (req: Request) => {
  return new Response(JSON.stringify({ 
    providers: ["credentials", "github", "google"],
    csrfToken: "placeholder"
  }), { 
    headers: { "Content-Type": "application/json" }
  })
}

export const POST = (req: Request) => {
  return new Response(JSON.stringify({ 
    error: "Auth not fully configured in Vite build",
    hint: "Use localStorage mode for now"
  }), { 
    status: 501,
    headers: { "Content-Type": "application/json" }
  })
}
