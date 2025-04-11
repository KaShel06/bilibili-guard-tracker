import { NextResponse } from "next/server"
import { deleteTag } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function DELETE(
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

    // 删除标签
    await deleteTag(decodeURIComponent(tag))
    
    return NextResponse.json({
      success: true,
      message: "标签删除成功",
    })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "删除标签时发生未知错误",
      },
      { status: 500 },
    )
  }
}