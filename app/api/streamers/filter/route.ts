import { NextResponse } from "next/server"
import { getStreamersByTags } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // 检查身份验证
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tags } = await request.json()

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ error: "Invalid tags" }, { status: 400 })
    }

    const streamers = await getStreamersByTags(tags)
    
    return NextResponse.json({
      success: true,
      streamers,
    })
  } catch (error) {
    console.error("Error filtering streamers:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Unknown error filtering streamers",
      },
      { status: 500 },
    )
  }
}