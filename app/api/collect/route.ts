import { NextResponse } from "next/server"
import { fetchAllGuardData } from "@/lib/bilibili"
import { saveGuardSnapshot } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Manually collect data for a streamer
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = await request.json()

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Fetch guard data
    const guardData = await fetchAllGuardData(roomId)

    // Save the snapshot
    await saveGuardSnapshot(roomId, guardData)

    return NextResponse.json({
      success: true,
      guardCount: guardData.length,
    })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

