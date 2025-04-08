import { kv } from "@vercel/kv"

// Types for Bilibili API responses
export interface GuardUser {
  uinfo: {
    uid: number
    base: {
      name: string
      face: string
    }
    medal: {
      guard_level: number
      level: number
      name: string
    }
  }
  accompany: number
  rank: number
  ruid: number
}

export interface ParsedGuardUser {
  uid: number
  name: string
  face: string
  guard_level: number
  level: number
  medal_name: string
  accompany: number
  rank: number
  ruid: number
}

export interface GuardData {
  info: {
    page: number
  }
  top3: GuardUser[]
  list: GuardUser[]
}

// Cache for room UIDs to avoid repeated API calls
const ruidCache: Record<string, number> = {}

// Get room owner UID from room ID
export async function getRuid(roomId: string): Promise<number | null> {
  if (!roomId) {
    console.error("Invalid room ID")
    return null
  }

  if (ruidCache[roomId]) {
    return ruidCache[roomId]
  }

  try {
    const cachedRuid = await kv.get<number>(`ruid:${roomId}`)
    if (cachedRuid) {
      ruidCache[roomId] = cachedRuid
      return cachedRuid
    }
  } catch (error) {
    console.error(`Error fetching cached ruid for room ${roomId}:`, error)
    // Continue to fetch from API
  }

  try {
    const infoApi = "https://api.live.bilibili.com/room/v1/Room/get_info"
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0"

    const response = await fetch(`${infoApi}?room_id=${roomId}`, {
      headers: { "user-agent": userAgent },
    })

    if (!response.ok) {
      console.error(`API error for room ${roomId}: ${response.status} ${response.statusText}`)
      return null
    }

    const result = await response.json()

    if (result.code === 0 && result.data && result.data.uid) {
      const ruid = result.data.uid
      ruidCache[roomId] = ruid
      try {
        await kv.set(`ruid:${roomId}`, ruid, { ex: 86400 }) // Cache for 24 hours
      } catch (error) {
        console.error(`Error caching ruid for room ${roomId}:`, error)
        // Continue without caching
      }
      return ruid
    }

    console.error(`Invalid API response for room ${roomId}:`, result)
    return null
  } catch (error) {
    console.error(`Error fetching ruid for room ${roomId}:`, error)
    return null
  }
}

// 获取主播名称的接口响应类型
export interface AnchorInfo {
  info: {
    uname: string
  }
}

// 从房间ID获取主播名称的缓存
const unameCache: Record<string, string> = {}

// 获取房间主播的用户名
export async function getUname(roomId: string): Promise<string | null> {
  if (!roomId) {
    console.error("Invalid room ID")
    return null
  }

  if (unameCache[roomId]) {
    return unameCache[roomId]
  }

  try {
    const cachedUname = await kv.get<string>(`uname:${roomId}`)
    if (cachedUname) {
      unameCache[roomId] = cachedUname
      return cachedUname
    }
  } catch (error) {
    console.error(`Error fetching cached uname for room ${roomId}:`, error)
    // 继续从API获取
  }

  try {
    const anchorApi = "https://api.live.bilibili.com/live_user/v1/UserInfo/get_anchor_in_room"
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0"

    const response = await fetch(`${anchorApi}?roomid=${roomId}`, {
      headers: { "user-agent": userAgent },
    })

    if (!response.ok) {
      console.error(`API error for room ${roomId}: ${response.status} ${response.statusText}`)
      return null
    }

    const result = await response.json()

    if (result.code === 0 && result.data && result.data.info && result.data.info.uname) {
      const uname = result.data.info.uname
      unameCache[roomId] = uname
      try {
        await kv.set(`uname:${roomId}`, uname, { ex: 86400 }) // 缓存24小时
      } catch (error) {
        console.error(`Error caching uname for room ${roomId}:`, error)
        // 继续执行，不中断流程
      }
      return uname
    }

    console.error(`Invalid API response for room ${roomId}:`, result)
    return null
  } catch (error) {
    console.error(`Error fetching uname for room ${roomId}:`, error)
    return null
  }
}

// Fetch guard data for a specific page
export async function fetchGuardData(
  page: number,
  roomId: string,
): Promise<[GuardData | null, number, GuardUser[], GuardUser[], number]> {
  const ruid = await getRuid(roomId)
  if (!ruid) {
    return [null, page, [], [], 0]
  }

  try {
    const api = "https://api.live.bilibili.com/xlive/app-room/v2/guardTab/topListNew"
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0"

    const response = await fetch(`${api}?page=${page}&roomid=${roomId}&ruid=${ruid}&page_size=20&typ=5&platform=web`, {
      headers: { "user-agent": userAgent },
    })

    if (response.status !== 200) {
      return [null, page, [], [], 0]
    }

    const data = await response.json()

    if (data.code !== 0) {
      return [null, page, [], [], 0]
    }

    const totalPage = data.data.info.page
    const top3 = data.data.top3 || []
    const guardList = data.data.list || []

    return [data.data, page, top3, guardList, totalPage]
  } catch (error) {
    console.error(`Error fetching guard data for room ${roomId}, page ${page}:`, error)
    return [null, page, [], [], 0]
  }
}

// Parse user data from API response
export function parseUser(user: GuardUser): ParsedGuardUser {
  if (!user || !user.uinfo || !user.uinfo.uid || !user.uinfo.base || !user.uinfo.medal) {
    throw new Error("Invalid user data structure")
  }

  const medal = user.uinfo.medal
  return {
    uid: user.uinfo.uid,
    name: user.uinfo.base.name || "Unknown",
    face: user.uinfo.base.face || "",
    guard_level: medal.guard_level || 0,
    level: medal.level || 0,
    medal_name: medal.name || "",
    accompany: user.accompany || 0,
    rank: user.rank || 0,
    ruid: user.ruid || 0,
  }
}

// Fetch all guard data for a room
export async function fetchAllGuardData(roomId: string): Promise<ParsedGuardUser[]> {
  if (!roomId) {
    console.error("Invalid room ID")
    return []
  }

  try {
    // Fetch first page to get total pages
    const [data, page, top3Data, listData, totalPages] = await fetchGuardData(1, roomId)

    if (!data || totalPages <= 0) {
      console.error(`No data or invalid total pages for room ${roomId}`)
      return []
    }

    const results: Record<number, [GuardUser[], GuardUser[]]> = {
      [page]: [top3Data, listData],
    }

    // Fetch remaining pages in parallel
    if (totalPages > 1) {
      const promises = []
      for (let p = 2; p <= totalPages; p++) {
        promises.push(fetchGuardData(p, roomId))
      }

      const pagesData = await Promise.all(promises)

      for (const [_, p, t, l] of pagesData) {
        if (p && Array.isArray(t) && Array.isArray(l)) {
          results[p] = [t, l]
        }
      }
    }

    // Process all data in order
    const allUsers: ParsedGuardUser[] = []
    const seenUids = new Set<number>()

    // Process pages in order
    for (let p = 1; p <= totalPages; p++) {
      if (!results[p]) continue

      const [top3, guardList] = results[p]

      // Process top3 first
      if (Array.isArray(top3)) {
        for (const user of top3) {
          try {
            const parsed = parseUser(user)
            if (!seenUids.has(parsed.uid)) {
              seenUids.add(parsed.uid)
              allUsers.push(parsed)
            }
          } catch (error) {
            console.error("Error parsing top3 user:", error)
            // Continue with next user
          }
        }
      }

      // Then process the list
      if (Array.isArray(guardList)) {
        for (const user of guardList) {
          try {
            const parsed = parseUser(user)
            if (!seenUids.has(parsed.uid)) {
              seenUids.add(parsed.uid)
              allUsers.push(parsed)
            }
          } catch (error) {
            console.error("Error parsing guard list user:", error)
            // Continue with next user
          }
        }
      }
    }

    return allUsers
  } catch (error) {
    console.error(`Error fetching all guard data for room ${roomId}:`, error)
    return []
  }
}

// Mask UID for privacy (only show first and last 2 digits)
export function maskUid(uid: number): string {
  const uidStr = uid.toString()
  if (uidStr.length <= 4) return uidStr

  return `${uidStr.substring(0, 2)}****${uidStr.substring(uidStr.length - 2)}`
}

