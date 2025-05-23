import { kv } from "@vercel/kv"
import type { ParsedGuardUser } from "./bilibili"

// Types for our database
export interface StreamerInfo {
  id: string
  name: string
  roomId: string
  avatar?: string
  lastUpdated?: string
  tags?: string[] // 添加标签数组
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

// 为主播添加标签
export async function addTagToStreamer(roomId: string, tag: string): Promise<boolean> {
  const streamers = await getStreamers()
  const streamerIndex = streamers.findIndex((s) => s.roomId === roomId)
  
  if (streamerIndex === -1) return false
  
  // 确保标签数组存在
  if (!streamers[streamerIndex].tags) {
    streamers[streamerIndex].tags = []
  }
  
  // 如果标签不存在，则添加
  if (!streamers[streamerIndex].tags!.includes(tag)) {
    streamers[streamerIndex].tags!.push(tag)
    await saveStreamers(streamers)
  }
  
  return true
}

// 从主播中移除标签
export async function removeTagFromStreamer(roomId: string, tag: string): Promise<boolean> {
  const streamers = await getStreamers()
  const streamerIndex = streamers.findIndex((s) => s.roomId === roomId)
  
  if (streamerIndex === -1 || !streamers[streamerIndex].tags) return false
  
  // 过滤掉要移除的标签
  streamers[streamerIndex].tags = streamers[streamerIndex].tags!.filter(t => t !== tag)
  await saveStreamers(streamers)
  
  return true
}

// 获取所有可用的标签
export async function getAllTags(): Promise<string[]> {
  try {
    // 首先尝试从专用标签库获取
    const tagLibrary = await kv.get<string[]>("tag_library")
    if (tagLibrary && Array.isArray(tagLibrary)) {
      return tagLibrary
    }
    
    // 如果专用标签库不存在，则从主播标签中收集
    const streamers = await getStreamers()
    const tagsSet = new Set<string>()
    
    streamers.forEach(streamer => {
      if (streamer.tags && streamer.tags.length > 0) {
        streamer.tags.forEach(tag => tagsSet.add(tag))
      }
    })
    
    const collectedTags = Array.from(tagsSet)
    
    // 创建标签库以便将来使用
    if (collectedTags.length > 0) {
      await kv.set("tag_library", collectedTags)
    }
    
    return collectedTags
  } catch (error) {
    console.error("Error fetching tags:", error)
    return []
  }
}

// 创建新标签
export async function createTag(tag: string): Promise<boolean> {
  try {
    // 获取所有现有标签
    const existingTags = await getAllTags()
    
    // 检查标签是否已存在
    if (existingTags.includes(tag)) {
      return false // 标签已存在，无需创建
    }
    
    // 将新标签添加到标签库
    const updatedTags = [...existingTags, tag]
    await kv.set("tag_library", updatedTags)
    
    return true
  } catch (error) {
    console.error("Error creating tag:", error)
    return false
  }
}

// 删除标签
export async function deleteTag(tag: string): Promise<boolean> {
  try {
    // 获取所有现有标签
    const existingTags = await getAllTags()
    
    // 检查标签是否存在
    if (!existingTags.includes(tag)) {
      return false // 标签不存在，无需删除
    }
    
    // 从标签库中移除标签
    const updatedTags = existingTags.filter(t => t !== tag)
    await kv.set("tag_library", updatedTags)
    
    // 从所有主播中移除该标签
    const streamers = await getStreamers()
    let modified = false
    
    const updatedStreamers = streamers.map(streamer => {
      if (streamer.tags && streamer.tags.includes(tag)) {
        modified = true
        return {
          ...streamer,
          tags: streamer.tags.filter(t => t !== tag)
        }
      }
      return streamer
    })
    
    if (modified) {
      await saveStreamers(updatedStreamers)
    }
    
    return true
  } catch (error) {
    console.error("Error deleting tag:", error)
    return false
  }
}

// 批量更新主播标签
export async function updateStreamerTags(roomId: string, tags: string[]): Promise<boolean> {
  try {
    const streamers = await getStreamers()
    const streamerIndex = streamers.findIndex(s => s.roomId === roomId)
    
    if (streamerIndex === -1) return false
    
    // 获取所有现有标签
    const existingTags = await getAllTags()
    
    // 检查是否有新标签需要添加到标签库
    const newTags = tags.filter(tag => !existingTags.includes(tag))
    
    if (newTags.length > 0) {
      // 将新标签添加到标签库
      const updatedTags = [...existingTags, ...newTags]
      await kv.set("tag_library", updatedTags)
    }
    
    // 更新主播的标签
    streamers[streamerIndex].tags = [...tags]
    await saveStreamers(streamers)
    
    return true
  } catch (error) {
    console.error("Error updating streamer tags:", error)
    return false
  }
}

// 根据标签筛选主播
export async function getStreamersByTags(tags: string[]): Promise<StreamerInfo[]> {
  if (!tags || tags.length === 0) {
    return getStreamers()
  }
  
  const streamers = await getStreamers()
  
  return streamers.filter(streamer => {
    if (!streamer.tags) return false
    
    // 检查主播是否包含所有指定的标签
    return tags.every(tag => streamer.tags!.includes(tag))
  })
}

// 获取带有标签的主播的最新数据摘要
export async function getTaggedStreamersSummary(tags: string[]): Promise<{
  streamer: StreamerInfo,
  snapshot: GuardSnapshot | null
}[]> {
  const streamers = await getStreamersByTags(tags)
  const result = []
  
  for (const streamer of streamers) {
    const snapshot = await getLatestSnapshot(streamer.roomId)
    result.push({
      streamer,
      snapshot
    })
  }
  
  return result
}

// 分析特定标签下的守护重合度
export async function analyzeTagGuardOverlap(tag: string): Promise<{
  streamers: StreamerInfo[],
  guardOverlap: {
    totalUniqueGuards: number,
    highFrequencyGuards: Array<{
      uid: number,
      name: string,
      guard_level: number,
      count: number,
      percentage: number,
      streamers: string[]
    }>,
    overlapStats: {
      averageOverlap: number,
      maxOverlap: number,
      streamersWithMostOverlap: [string, string] | null
    }
  }
}> {
  // 获取带有此标签的所有主播
  const allStreamers = await getStreamers();
  const streamersWithTag = allStreamers.filter(s => s.tags && s.tags.includes(tag));
  
  if (streamersWithTag.length === 0) {
    return {
      streamers: [],
      guardOverlap: {
        totalUniqueGuards: 0,
        highFrequencyGuards: [],
        overlapStats: {
          averageOverlap: 0,
          maxOverlap: 0,
          streamersWithMostOverlap: null
        }
      }
    };
  }
  
  // 获取每个主播的最新守护数据
  const guardDataPromises = streamersWithTag.map(async (streamer) => {
    const snapshot = await getLatestSnapshot(streamer.roomId);
    return {
      streamer,
      guards: snapshot?.users || []
    };
  });
  
  const guardData = await Promise.all(guardDataPromises);
  
  // 统计每个用户在多少个主播那里是守护
  const guardCount: Record<number, {
    uid: number,
    name: string,
    guard_level: number,
    count: number,
    streamers: string[]
  }> = {};
  
  let totalStreamers = 0;
  guardData.forEach(({ streamer, guards }) => {
    if (guards.length > 0) totalStreamers++;
    
    guards.forEach(guard => {
      if (!guardCount[guard.uid]) {
        guardCount[guard.uid] = {
          uid: guard.uid,
          name: guard.name,
          guard_level: guard.guard_level,
          count: 0,
          streamers: []
        };
      }
      
      guardCount[guard.uid].count++;
      guardCount[guard.uid].streamers.push(streamer.name);
      
      // 更新为最高等级的舰长
      if (guard.guard_level < guardCount[guard.uid].guard_level) {
        guardCount[guard.uid].guard_level = guard.guard_level;
      }
    });
  });
  
  // 转换为数组并计算百分比
  const totalUniqueGuards = Object.keys(guardCount).length;
  const guardCountArray = Object.values(guardCount).map(g => ({
    ...g,
    percentage: totalStreamers > 0 ? (g.count / totalStreamers) * 100 : 0
  }));
  
  // 按照重合度排序，获取高频守护
  const highFrequencyGuards = guardCountArray
    .filter(g => g.count > 1) // 至少在两个主播那里都是守护
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // 取前20名
  
  // 分析主播之间的守护重合度
  let totalOverlapPairs = 0;
  let totalOverlapCount = 0;
  let maxOverlap = 0;
  let streamersWithMostOverlap: [string, string] | null = null;
  
  // 只有当有超过1个主播时才计算重合度
  if (guardData.length > 1) {
    for (let i = 0; i < guardData.length; i++) {
      const streamerA = guardData[i];
      const guardsA = new Set(streamerA.guards.map(g => g.uid));
      
      for (let j = i + 1; j < guardData.length; j++) {
        const streamerB = guardData[j];
        const guardsB = new Set(streamerB.guards.map(g => g.uid));
        
        // 计算两个主播之间的守护重合数
        let overlapCount = 0;
        guardsA.forEach(uid => {
          if (guardsB.has(uid)) overlapCount++;
        });
        
        // 更新统计信息
        if (overlapCount > 0) {
          totalOverlapPairs++;
          totalOverlapCount += overlapCount;
          
          if (overlapCount > maxOverlap) {
            maxOverlap = overlapCount;
            streamersWithMostOverlap = [streamerA.streamer.name, streamerB.streamer.name];
          }
        }
      }
    }
  }
  
  const averageOverlap = totalOverlapPairs > 0 ? totalOverlapCount / totalOverlapPairs : 0;
  
  return {
    streamers: streamersWithTag,
    guardOverlap: {
      totalUniqueGuards,
      highFrequencyGuards,
      overlapStats: {
        averageOverlap,
        maxOverlap,
        streamersWithMostOverlap
      }
    }
  };
}

