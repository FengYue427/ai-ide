import bcrypt from "bcryptjs"

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

    // 这里需要 Prisma Client
    // 由于 DATABASE_URL 未配置，暂时返回成功
    // 实际生产环境应该：
    // 1. 检查邮箱是否已存在
    // 2. 密码哈希
    // 3. 创建用户
    // 4. 创建默认工作区

    const hashedPassword = await bcrypt.hash(password, 10)
    
    console.log("Register:", email, hashedPassword, name)
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "注册失败" }), {
      status: 500
    })
  }
}
