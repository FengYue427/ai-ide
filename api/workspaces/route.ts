/**
 * Workspaces API - 演示/占位实现
 * 
 * 当前为纯前端模式：
 * - 使用内存存储（重启后数据丢失）
 * - 前端直接从 IndexedDB 读写，不调用此 API
 * 
 * 如需云同步功能，需接入真实数据库 + 用户鉴权
 */
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
