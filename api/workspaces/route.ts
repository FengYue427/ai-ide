// 内存存储工作区（演示用，生产需数据库）
const workspaces: any[] = [
  { id: 'default', name: 'default', files: '[]', settings: '{}', isDefault: true, updatedAt: new Date().toISOString() }
]

// 获取所有工作区列表
export async function GET(req: Request) {
  return new Response(JSON.stringify({ 
    workspaces: workspaces.map(w => ({
      id: w.id,
      name: w.name,
      isDefault: w.isDefault,
      updatedAt: w.updatedAt
    }))
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
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

    const workspace = {
      id: Date.now().toString(),
      name,
      files: files || '[]',
      settings: settings || '{}',
      isDefault: false,
      updatedAt: new Date().toISOString()
    }
    workspaces.push(workspace)

    return new Response(JSON.stringify({ 
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        isDefault: workspace.isDefault,
        updatedAt: workspace.updatedAt
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
