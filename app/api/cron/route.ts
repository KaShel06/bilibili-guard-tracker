import { NextResponse } from "next/server"
import { fetchAllGuardData } from "@/lib/bilibili"
import { getStreamers, saveGuardSnapshot } from "@/lib/db"

// This route is protected by Vercel Cron and will run on a schedule
export async function GET() {
  try {
    // Get all streamers to track
    const streamers = await getStreamers()

    if (!streamers || streamers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No streamers to track",
      })
    }

    const results = []

    // Process each streamer
    for (const streamer of streamers) {
      try {
        if (!streamer || !streamer.roomId) {
          results.push({
            error: "Invalid streamer data",
            success: false,
          })
          continue
        }

        console.log(`Fetching data for ${streamer.name || "Unknown"} (${streamer.roomId})...`)

        // Fetch all guard data
        const guardData = await fetchAllGuardData(streamer.roomId)

        if (!guardData || !Array.isArray(guardData)) {
          results.push({
            roomId: streamer.roomId,
            name: streamer.name,
            error: "Failed to fetch guard data",
            success: false,
          })
          continue
        }

        // Save the snapshot
        await saveGuardSnapshot(streamer.roomId, guardData)

        results.push({
          roomId: streamer.roomId,
          name: streamer.name,
          guardCount: guardData.length,
          success: true,
        })
      } catch (error) {
        console.error(`Error processing streamer ${streamer.name || "Unknown"}:`, error)

        results.push({
          roomId: streamer.roomId,
          name: streamer.name,
          error: (error as Error).message || "Unknown error",
          success: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error("Error in cron job:", error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Unknown error in cron job",
      },
      { status: 500 },
    )
  }
}

