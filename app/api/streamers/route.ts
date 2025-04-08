import { NextResponse } from "next/server"
import { getStreamers, addStreamer, removeStreamer } from "@/lib/db"
import { getRuid, getUname } from "@/lib/bilibili"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Get all streamers
export async function GET() {
  try {
    const streamers = await getStreamers()
    return NextResponse.json({ streamers })
  } catch (error) {
    console.error("Error getting streamers:", error)
    return NextResponse.json({ error: (error as Error).message || "Failed to get streamers" }, { status: 500 })
  }
}

// Add a new streamer
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { roomId, name } = body

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Verify the room exists by getting its ruid
    const ruid = await getRuid(roomId)
    if (!ruid) {
      return NextResponse.json({ error: "Invalid room ID or unable to fetch room information" }, { status: 400 })
    }

    const uname = await getUname(roomId)
    if (!uname) {
      return NextResponse.json({ error: "Invalid uname or unable to fetch streamer information" }, { status: 400 })
    }

    // Add the streamer
    await addStreamer({
      id: ruid.toString(),
      name: name || uname || `Streamer ${roomId}`,
      roomId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding streamer:", error)
    return NextResponse.json({ error: (error as Error).message || "Failed to add streamer" }, { status: 500 })
  }
}

// Delete a streamer
export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { roomId } = body

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Remove the streamer
    await removeStreamer(roomId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting streamer:", error)
    return NextResponse.json({ error: (error as Error).message || "Failed to delete streamer" }, { status: 500 })
  }
}

