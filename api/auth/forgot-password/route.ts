export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: "邮箱必填" }), {
        status: 400
      })
    }

    console.log("Forgot password for:", email)

    // 无论用户是否存在，都返回成功（防止邮箱枚举）
    return new Response(JSON.stringify({ 
      success: true,
      message: "重置邮件已发送（功能演示）"
    }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "发送失败" }), {
      status: 500
    })
  }
}
