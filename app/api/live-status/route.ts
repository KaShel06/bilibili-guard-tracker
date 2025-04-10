import { NextResponse } from "next/server"
import { checkRoomsLiveStatus, cacheLiveStatus } from "@/lib/bilibili"
import { getStreamers } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// 更新所有主播的直播状态
export async function POST() {
  try {
    // 检查身份验证
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // 获取所有要跟踪的主播
    const streamers = await getStreamers()

    if (!streamers || streamers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No streamers to check",
        results: {},
      })
    }

    // 提取所有房间ID
    const roomIds = streamers.map(streamer => streamer.roomId)
    
    // 检查直播状态
    const liveStatus = await checkRoomsLiveStatus(roomIds)
    
    // 缓存结果
    await cacheLiveStatus(liveStatus)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: liveStatus,
    })
  } catch (error) {
    console.error("Error checking live status:", error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Unknown error checking live status",
      },
      { status: 500 },
    )
  }
}

// 获取缓存的直播状态
export async function GET() {
  try {
    // 检查身份验证
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // 获取所有要跟踪的主播
    const streamers = await getStreamers()

    if (!streamers || streamers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No streamers to check",
        results: {},
      })
    }

    // 提取所有房间ID
    const roomIds = streamers.map(streamer => streamer.roomId)
    
    // 检查直播状态
    const liveStatus = await checkRoomsLiveStatus(roomIds)
    
    // 缓存结果
    await cacheLiveStatus(liveStatus)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: liveStatus,
    })
  } catch (error) {
    console.error("Error getting live status:", error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Unknown error getting live status",
      },
      { status: 500 },
    )
  }
}