import { NextResponse } from "next/server"
import { fetchAllGuardData } from "@/lib/bilibili"
import { getStreamers, saveGuardSnapshot } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import pLimit from "p-limit"

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get all streamers to track
    const streamers = await getStreamers()

    if (!streamers || streamers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No streamers to track",
        results: [],
      })
    }

    // Create a concurrency limiter - only process 3 requests at a time
    const limit = pLimit(3)
    
    // Process each streamer with controlled concurrency
    const tasks = streamers.map(streamer => {
      return limit(async () => {
        try {
          if (!streamer || !streamer.roomId) {
            return {
              error: "Invalid streamer data",
              success: false,
            }
          }

          console.log(`Fetching data for ${streamer.name || "Unknown"} (${streamer.roomId})...`)

          // Fetch guard data
          const guardData = await fetchAllGuardData(streamer.roomId)
          
          if (!guardData || !Array.isArray(guardData)) {
            return {
              roomId: streamer.roomId,
              name: streamer.name,
              error: "Failed to fetch guard data",
              success: false,
            }
          }

          // Save the snapshot
          await saveGuardSnapshot(streamer.roomId, guardData)

          return {
            roomId: streamer.roomId,
            name: streamer.name,
            guardCount: guardData.length,
            success: true,
          }
        } catch (error) {
          console.error(`Error processing streamer ${streamer.name || "Unknown"}:`, error)

          return {
            roomId: streamer.roomId,
            name: streamer.name,
            error: (error as Error).message || "Unknown error",
            success: false,
          }
        }
      })
    })

    // Wait for all tasks to complete with controlled concurrency
    const results = await Promise.all(tasks)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error("Error in collect all:", error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Unknown error in collect all",
      },
      { status: 500 },
    )
  }
}