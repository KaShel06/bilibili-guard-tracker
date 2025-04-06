import { NextResponse } from "next/server"
import { getLatestSnapshot, getHistoricalSnapshots, getRecentChanges } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { maskUid } from "@/lib/bilibili"

// Get guard data for a streamer
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")
    const type = searchParams.get("type") || "latest"
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Check if this is an authenticated request
    const session = await getServerSession(authOptions)
    const isAuthenticated = !!session

    let data

    switch (type) {
      case "latest":
        data = await getLatestSnapshot(roomId)
        break
      case "historical":
        data = await getHistoricalSnapshots(roomId, limit)
        break
      case "changes":
        data = await getRecentChanges(roomId, limit)
        break
      default:
        return NextResponse.json({ error: "Invalid data type" }, { status: 400 })
    }

    // If not authenticated, mask the UIDs
    if (!isAuthenticated && data) {
      if (Array.isArray(data)) {
        // For historical snapshots or changes
        data = data.map((item) => {
          if ("users" in item) {
            // For snapshots
            return {
              ...item,
              users: item.users.map((user) => ({
                ...user,
                uid: maskUid(user.uid),
              })),
            }
          } else if ("added" in item && "removed" in item) {
            // For changes
            return {
              ...item,
              added: item.added.map((user) => ({
                ...user,
                uid: maskUid(user.uid),
              })),
              removed: item.removed.map((user) => ({
                ...user,
                uid: maskUid(user.uid),
              })),
            }
          }
          return item
        })
      } else if (data && "users" in data) {
        // For latest snapshot
        data = {
          ...data,
          users: data.users.map((user) => ({
            ...user,
            uid: maskUid(user.uid),
          })),
        }
      }
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

