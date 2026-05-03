import { Auth } from "@auth/core"
import { authConfig } from "../../../../lib/auth/config"

// 处理所有 /api/auth/* 请求
export const GET = (req: Request) => Auth(req, authConfig)
export const POST = (req: Request) => Auth(req, authConfig)
