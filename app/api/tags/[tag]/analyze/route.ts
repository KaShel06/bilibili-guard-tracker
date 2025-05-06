import { NextResponse } from "next/server"
import { analyzeTagGuardOverlap } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: { tag: string } }
) {
  try {
    // 检查身份验证
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    const tag = params.tag
    if (!tag) {
      return NextResponse.json({ error: "标签不能为空" }, { status: 400 })
    }

    // 分析标签下的守护数据重合度
    const analysisData = await analyzeTagGuardOverlap(decodeURIComponent(tag))
    
    return NextResponse.json({
      success: true,
      data: analysisData
    })
  } catch (error) {
    console.error("Error analyzing tag guard overlap:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "分析标签守护重合度时发生未知错误",
      },
      { status: 500 },
    )
  }
} 