/**
 * 单个 Workspace API - 演示/占位实现
 * 
 * 当前为纯前端模式：
 * - 返回固定示例数据（非真实存储）
 * - PUT/DELETE 仅打印日志，不实际保存
 * - 前端直接使用 IndexedDB，不调用此 API
 * 
 * 如需云同步，需接入真实数据库 + 鉴权
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    // 实际生产：从数据库查询
    console.log("Load workspace:", id)

    return new Response(JSON.stringify({ 
      workspace: {
        id,
        name: 'default',
        files: JSON.stringify([
          { name: 'index.js', content: '// 示例文件', language: 'javascript' }
        ]),
        settings: JSON.stringify({ theme: 'vs-dark' }),
        updatedAt: new Date().toISOString()
      }
    }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "加载失败" }), {
      status: 500
    })
  }
}

// 保存工作区数据
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { files, settings, name } = await req.json()
    
    // 实际生产：更新数据库
    console.log("Save workspace:", id, name, files?.length, settings)

    return new Response(JSON.stringify({ 
      success: true,
      updatedAt: new Date().toISOString()
    }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "保存失败" }), {
      status: 500
    })
  }
}

// 删除工作区
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    // 实际生产：从数据库删除
    console.log("Delete workspace:", id)

    return new Response(JSON.stringify({ success: true }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "删除失败" }), {
      status: 500
    })
  }
}
