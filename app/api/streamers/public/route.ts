import { NextResponse } from "next/server"
import { getStreamers } from "@/lib/db"

export async function GET() {
  try {
    const streamers = await getStreamers()
    
    return NextResponse.json({ streamers })
  } catch (error) {
    console.error("Error fetching streamers:", error)
    return NextResponse.json({ error: "Failed to fetch streamers" }, { status: 500 })
  }
}