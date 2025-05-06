import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { fetchStreamerInfo } from "@/lib/bilibili"

// 请求类型定义
interface StreamerRequest {
  id: string
  type: "streamer" | "tag"
  roomId: string
  streamerName?: string
  tag?: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

// 获取所有待处理请求
export async function GET() {
  try {
    // 检查是否为管理员
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 获取所有待处理请求
    const requests = await kv.get<StreamerRequest[]>("streamer_requests") || []
    const pendingRequests = requests.filter(req => req.status === "pending")

    return NextResponse.json({ requests: pendingRequests })
  } catch (error) {
    console.error("Error fetching requests:", error)
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}

// 创建新请求
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, roomId, tag } = body

    if (!type || !roomId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (type === "tag" && !tag) {
      return NextResponse.json({ error: "Missing tag field" }, { status: 400 })
    }

    // 检查是否为管理员
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL

    // 如果是管理员，直接处理请求而不是创建请求
    if (isAdmin) {
      return NextResponse.json({ error: "Admin should use direct API endpoints" }, { status: 400 })
    }

    // 获取主播信息（用于显示名称）
    let streamerName = ""
    if (type === "streamer") {
      try {
        const streamerInfo = await fetchStreamerInfo(roomId)
        streamerName = streamerInfo.name
      } catch (error) {
        console.error("Error fetching streamer info:", error)
      }
    }

    // 创建新请求
    const newRequest: StreamerRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      roomId,
      streamerName: streamerName || undefined,
      tag: tag || undefined,
      status: "pending",
      createdAt: new Date().toISOString()
    }

    // 获取现有请求并添加新请求
    const existingRequests = await kv.get<StreamerRequest[]>("streamer_requests") || []
    const updatedRequests = [...existingRequests, newRequest]
    await kv.set("streamer_requests", updatedRequests)

    return NextResponse.json({ success: true, request: newRequest })
  } catch (error) {
    console.error("Error creating request:", error)
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 })
  }
}