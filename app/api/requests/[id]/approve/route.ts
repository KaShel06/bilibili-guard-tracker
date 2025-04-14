import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { addStreamer, addTagToStreamer } from "@/lib/db"
import { fetchStreamerInfo } from "@/lib/bilibili"

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

    const request = requests[requestIndex]
    
    // 根据请求类型执行不同操作
    if (request.type === "streamer") {
      // 添加主播
      const streamerInfo = await fetchStreamerInfo(request.roomId)
      await addStreamer({
        id: streamerInfo.uid.toString(),
        name: streamerInfo.name,
        roomId: request.roomId,
        avatar: streamerInfo.face,
        lastUpdated: new Date().toISOString(),
        tags: []
      })
    } else if (request.type === "tag") {
      // 添加标签
      await addTagToStreamer(request.roomId, request.tag)
    }

    // 更新请求状态
    requests[requestIndex].status = "approved"
    await kv.set("streamer_requests", requests)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error approving request:", error)
    return NextResponse.json({ error: "Failed to approve request" }, { status: 500 })
  }
}