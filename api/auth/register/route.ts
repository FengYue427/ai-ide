// 注册 API - 简化版，使用内存存储
// 生产环境需要连接数据库
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
