export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: "邮箱必填" }), {
        status: 400
      })
    }

    // 实际生产环境：
    // 1. 查找用户
    // 2. 生成重置令牌
    // 3. 发送重置邮件
    // 4. 保存令牌到数据库

    console.log("Forgot password for:", email)

    // 无论用户是否存在，都返回成功（防止邮箱枚举）
    return new Response(JSON.stringify({ success: true }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "发送失败" }), {
      status: 500
    })
  }
}
