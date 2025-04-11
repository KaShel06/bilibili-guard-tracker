import { NextResponse } from "next/server"
import { updateStreamerTags } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    // Ensure we're authenticated
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Need to await params before accessing its properties
    const roomId = params.roomId
    const body = await request.json()
    const { tags } = body

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: "标签必须是数组" }, { status: 400 })
    }

    // 更新主播标签
    await updateStreamerTags(roomId, tags)
    
    return NextResponse.json({
      success: true,
      message: "标签更新成功",
    })
  } catch (error) {
    console.error("Error updating tags:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "更新标签时发生未知错误",
      },
      { status: 500 },
    )
  }
}