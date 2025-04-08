import { kv } from "@vercel/kv"
import type { ParsedGuardUser } from "./bilibili"

// Types for our database
export interface StreamerInfo {
  id: string
  name: string
  roomId: string
  avatar?: string
  lastUpdated?: string
}

export interface GuardSnapshot {
  timestamp: string
  totalCount: number
  guardLevelCounts: {
    1: number // 总督
    2: number // 提督
    3: number // 舰长
  }
  users: ParsedGuardUser[]
}

export interface GuardChange {
  timestamp: string
  added: ParsedGuardUser[]
  removed: ParsedGuardUser[]
}

// Save a list of streamers to track
export async function saveStreamers(streamers: StreamerInfo[]): Promise<void> {
  await kv.set("streamers", streamers)
}

// Get all tracked streamers
export async function getStreamers(): Promise<StreamerInfo[]> {
  try {
    const streamers = await kv.get<StreamerInfo[]>("streamers")
    return streamers || []
  } catch (error) {
    console.error("Error fetching streamers:", error)
    return []
  }
}

// Add a new streamer to track
export async function addStreamer(streamer: StreamerInfo): Promise<void> {
  const streamers = await getStreamers()
  const exists = streamers.some((s) => s.roomId === streamer.roomId)

  if (!exists) {
    streamers.push(streamer)
    await saveStreamers(streamers)
  } else {
    // Update the name if the streamer already exists
    const updatedStreamers = streamers.map((s) => {
      if (s.roomId === streamer.roomId && streamer.name) {
        return { ...s, name: streamer.name }
      }
      return s
    })
    await saveStreamers(updatedStreamers)
  }
}

// Remove a streamer from tracking
export async function removeStreamer(roomId: string): Promise<void> {
  const streamers = await getStreamers()
  const filtered = streamers.filter((s) => s.roomId !== roomId)
  await saveStreamers(filtered)
}

// Save a snapshot of guard data for a streamer
export async function saveGuardSnapshot(roomId: string, data: ParsedGuardUser[]): Promise<void> {
  const timestamp = new Date().toISOString()

  // Calculate counts
  const totalCount = data.length
  const guardLevelCounts = {
    1: 0, // 总督
    2: 0, // 提督
    3: 0, // 舰长
  }

  for (const user of data) {
    guardLevelCounts[user.guard_level as 1 | 2 | 3]++
  }

  const snapshot: GuardSnapshot = {
    timestamp,
    totalCount,
    guardLevelCounts,
    users: data,
  }

  // Save the snapshot
  await kv.set(`snapshot:${roomId}:${timestamp}`, snapshot)

  // Update the latest snapshot reference
  await kv.set(`latest:${roomId}`, timestamp)

  // Compare with previous snapshot to track changes
  const previousTimestamp = await kv.get<string>(`latest:${roomId}`)
  if (previousTimestamp && previousTimestamp !== timestamp) {
    const previousSnapshot = await kv.get<GuardSnapshot>(`snapshot:${roomId}:${previousTimestamp}`)

    if (previousSnapshot) {
      const previousUids = new Set(previousSnapshot.users.map((u) => u.uid))
      const currentUids = new Set(data.map((u) => u.uid))

      const added = data.filter((u) => !previousUids.has(u.uid))
      const removed = previousSnapshot.users.filter((u) => !currentUids.has(u.uid))

      if (added.length > 0 || removed.length > 0) {
        const change: GuardChange = {
          timestamp,
          added,
          removed,
        }

        await kv.set(`change:${roomId}:${timestamp}`, change)
        await kv.lpush(`changes:${roomId}`, timestamp)
      }
    }
  }

  // Update streamer info with last updated timestamp
  const streamers = await getStreamers()
  const updatedStreamers = streamers.map((s) => {
    if (s.roomId === roomId) {
      return { ...s, lastUpdated: timestamp }
    }
    return s
  })

  await saveStreamers(updatedStreamers)

  // Add to timeline
  await kv.lpush(`timeline:${roomId}`, timestamp)
  // Keep only last 100 snapshots in timeline
  await kv.ltrim(`timeline:${roomId}`, 0, 99)
}

// Get the latest guard snapshot for a streamer
export async function getLatestSnapshot(roomId: string): Promise<GuardSnapshot | null> {
  try {
    const timestamp = await kv.get<string>(`latest:${roomId}`)
    if (!timestamp) return null

    return await kv.get<GuardSnapshot>(`snapshot:${roomId}:${timestamp}`)
  } catch (error) {
    console.error(`Error fetching latest snapshot for room ${roomId}:`, error)
    return null
  }
}

// Get historical snapshots for a streamer
export async function getHistoricalSnapshots(roomId: string, limit = 10): Promise<GuardSnapshot[]> {
  try {
    const timeline = await kv.lrange<string>(`timeline:${roomId}`, 0, limit - 1)
    if (!timeline || timeline.length === 0) return []

    const snapshots: GuardSnapshot[] = []
    for (const timestamp of timeline) {
      try {
        const snapshot = await kv.get<GuardSnapshot>(`snapshot:${roomId}:${timestamp}`)
        if (snapshot) snapshots.push(snapshot)
      } catch (error) {
        console.error(`Error fetching snapshot for timestamp ${timestamp}:`, error)
      }
    }

    return snapshots
  } catch (error) {
    console.error(`Error fetching historical snapshots for room ${roomId}:`, error)
    return []
  }
}

// Get recent changes for a streamer
export async function getRecentChanges(roomId: string, limit = 10): Promise<GuardChange[]> {
  const changeTimestamps = await kv.lrange<string>(`changes:${roomId}`, 0, limit - 1)
  if (!changeTimestamps || changeTimestamps.length === 0) return []

  const changes: GuardChange[] = []
  for (const timestamp of changeTimestamps) {
    const change = await kv.get<GuardChange>(`change:${roomId}:${timestamp}`)
    if (change) changes.push(change)
  }

  return changes
}

