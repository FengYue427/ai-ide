import { Auth } from "@auth/core"

// 简化的 auth 处理，避免路径问题
// 生产环境建议迁移到 Next.js 或使用 Edge Runtime
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
