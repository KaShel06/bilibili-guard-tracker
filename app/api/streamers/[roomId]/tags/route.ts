import { NextResponse } from "next/server"
import { addTagToStreamer, removeTagFromStreamer } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    // 检查身份验证
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = params
    const { tag } = await request.json()

    if (!tag || typeof tag !== "string") {
      return NextResponse.json({ error: "Invalid tag" }, { status: 400 })
    }

    const success = await addTagToStreamer(roomId, tag)
    
    if (!success) {
      return NextResponse.json({ error: "Streamer not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Tag added successfully",
    })
  } catch (error) {
    console.error("Error adding tag:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Unknown error adding tag",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    // 检查身份验证
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = params
    const { tag } = await request.json()

    if (!tag || typeof tag !== "string") {
      return NextResponse.json({ error: "Invalid tag" }, { status: 400 })
    }

    const success = await removeTagFromStreamer(roomId, tag)
    
    if (!success) {
      return NextResponse.json({ error: "Streamer or tag not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Tag removed successfully",
    })
  } catch (error) {
    console.error("Error removing tag:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Unknown error removing tag",
      },
      { status: 500 },
    )
  }
}