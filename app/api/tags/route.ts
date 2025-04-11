import { NextResponse } from "next/server"
import { createTag, deleteTag, getAllTags } from "@/lib/db"

// 获取所有标签
export async function GET() {
  try {
    const tags = await getAllTags()
    return NextResponse.json({ tags })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// 创建新标签
export async function POST(request: Request) {
  try {
    const { tag } = await request.json()
    
    if (!tag || typeof tag !== "string") {
      return NextResponse.json({ error: "标签名称无效" }, { status: 400 })
    }
    
    const success = await createTag(tag)
    
    if (success) {
      return NextResponse.json({ success: true, message: `标签 "${tag}" 创建成功` })
    } else {
      return NextResponse.json({ error: "标签已存在" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// 删除标签
export async function DELETE(request: Request) {
  try {
    const { tag } = await request.json()
    
    if (!tag || typeof tag !== "string") {
      return NextResponse.json({ error: "标签名称无效" }, { status: 400 })
    }
    
    const success = await deleteTag(tag)
    
    if (success) {
      return NextResponse.json({ success: true, message: `标签 "${tag}" 删除成功` })
    } else {
      return NextResponse.json({ error: "标签不存在" }, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}