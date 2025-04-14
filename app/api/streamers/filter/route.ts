import { NextResponse } from "next/server"
import { getStreamersByTags } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tags } = body

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ error: "Invalid tags parameter" }, { status: 400 })
    }

    const streamers = await getStreamersByTags(tags)
    
    return NextResponse.json({ streamers })
  } catch (error) {
    console.error("Error filtering streamers:", error)
    return NextResponse.json({ error: "Failed to filter streamers" }, { status: 500 })
  }
}