/**
 * 注册 API - 演示/占位实现
 * 
 * 当前为纯前端模式，此 API 仅作为演示用途：
 * - 使用内存存储（重启后数据丢失）
 * - 明文存储密码（不安全）
 * - 前端已禁用登录功能
 * 
 * 如需完整后端，需接入真实数据库 + 密码哈希 + JWT 鉴权
 */
const users: any[] = []

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "邮箱和密码必填" }), {
        status: 400
      })
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "密码至少需要8位" }), {
        status: 400
      })
    }

    // 检查邮箱是否已存在
    const existing = users.find(u => u.email === email)
    if (existing) {
      return new Response(JSON.stringify({ error: "邮箱已注册" }), {
        status: 400
      })
    }

    // 内存存储（重启后丢失）
    users.push({
      id: Date.now().toString(),
      email,
      password, // 生产环境需要哈希
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString()
    })
    
    console.log("Registered:", email)
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "注册成功（内存存储，重启后数据丢失）"
    }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "注册失败" }), {
      status: 500
    })
  }
}
