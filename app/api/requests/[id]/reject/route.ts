import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查是否为管理员
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestId = params.id
    if (!requestId) {
      return NextResponse.json({ error: "Missing request ID" }, { status: 400 })
    }

    // 获取所有请求
    const requests = await kv.get<any[]>("streamer_requests") || []
    const requestIndex = requests.findIndex(req => req.id === requestId)

    if (requestIndex === -1) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // 更新请求状态
    requests[requestIndex].status = "rejected"
    await kv.set("streamer_requests", requests)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error rejecting request:", error)
    return NextResponse.json({ error: "Failed to reject request" }, { status: 500 })
  }
}