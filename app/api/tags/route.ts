import { NextResponse } from "next/server"
import { getAllTags } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    // 检查身份验证
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tags = await getAllTags()
    
    return NextResponse.json({
      success: true,
      tags,
    })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Unknown error fetching tags",
      },
      { status: 500 },
    )
  }
}