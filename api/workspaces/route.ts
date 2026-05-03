// 获取所有工作区列表
export async function GET(req: Request) {
  try {
    // 验证用户（通过 JWT Cookie）
    // 实际生产需要：从请求头获取 session，验证用户身份
    
    return new Response(JSON.stringify({ 
      workspaces: [
        { id: '1', name: 'default', isDefault: true, updatedAt: new Date().toISOString() }
      ] 
    }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "获取失败" }), {
      status: 500
    })
  }
}

// 创建新工作区
export async function POST(req: Request) {
  try {
    const { name, files, settings } = await req.json()
    
    if (!name) {
      return new Response(JSON.stringify({ error: "工作区名称必填" }), {
        status: 400
      })
    }

    // 实际生产：保存到数据库，关联到用户
    console.log("Create workspace:", name, files?.length, settings)

    return new Response(JSON.stringify({ 
      success: true,
      workspace: {
        id: Date.now().toString(),
        name,
        isDefault: false,
        updatedAt: new Date().toISOString()
      }
    }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "创建失败" }), {
      status: 500
    })
  }
}
