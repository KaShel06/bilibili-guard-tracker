/**
 * API客户端
 * 统一处理所有API请求，包括错误处理和响应解析
 */

import { toast } from "@/components/ui/use-toast"
import type { StreamerInfo, GuardSnapshot } from "./db"

// 请求配置类型
interface ApiRequestOptions extends RequestInit {
  body?: any
  showErrorToast?: boolean
}

// API响应类型
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// 统一的请求处理函数
async function apiRequest<T = any>(
  url: string, 
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, showErrorToast = true, ...rest } = options
  
  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...rest.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || `请求失败: ${response.status}`)
    }
    
    return data
  } catch (error) {
    console.error(`API请求错误 (${url}):`, error)
    
    if (showErrorToast) {
      toast({
        title: "请求失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
    
    throw error
  }
}

// 导出API客户端
export const api = {
  streamers: {
    // 获取所有主播
    getAll: async () => {
      return apiRequest<{ streamers: StreamerInfo[] }>('/api/streamers')
    },
    
    // 获取公开主播列表
    getPublic: async () => {
      return apiRequest<{ streamers: StreamerInfo[] }>('/api/streamers/public')
    },
    
    // 按标签筛选主播
    getByTags: async (tags: string[]) => {
      return apiRequest<{ streamers: StreamerInfo[] }>('/api/streamers/filter', {
        method: 'POST',
        body: { tags }
      })
    },
    
    // 添加主播
    add: async (roomId: string) => {
      return apiRequest<{ streamer: StreamerInfo }>('/api/streamers', {
        method: 'POST',
        body: { roomId }
      })
    },
    
    // 删除主播
    delete: async (roomId: string) => {
      return apiRequest<{ success: boolean }>(`/api/streamers/${roomId}`, {
        method: 'DELETE'
      })
    },
    
    // 获取主播摘要数据
    getSummary: async (tags: string[]) => {
      return apiRequest<{ summary: {streamer: StreamerInfo, snapshot: GuardSnapshot | null}[] }>('/api/streamers/summary', {
        method: 'POST',
        body: { tags }
      })
    },
    
    // 刷新主播数据
    refresh: async (roomId: string) => {
      return apiRequest<{ guardCount: number }>('/api/collect', {
        method: 'POST',
        body: { roomId }
      })
    },
    
    // 刷新所有主播数据
    refreshAll: async () => {
      return apiRequest<{ results: any[] }>('/api/collect/all', {
        method: 'POST'
      })
    },
    
    // 管理主播标签
    tags: {
      // 批量更新主播标签
      batchUpdate: async (roomId: string, tags: string[]) => {
        return apiRequest<{ success: boolean }>(`/api/streamers/${roomId}/tags/batch`, {
          method: 'POST',
          body: { tags }
        })
      },
      
      // 删除主播标签
      remove: async (roomId: string, tag: string) => {
        return apiRequest<{ success: boolean }>(`/api/streamers/${roomId}/tags`, {
          method: 'DELETE',
          body: { tag }
        })
      }
    }
  },
  
  tags: {
    // 获取所有标签
    getAll: async () => {
      return apiRequest<{ tags: string[] }>('/api/tags')
    },
    
    // 创建标签
    create: async (tag: string) => {
      return apiRequest<{ success: boolean }>('/api/tags', {
        method: 'POST',
        body: { tag }
      })
    },
    
    // 删除标签
    delete: async (tag: string) => {
      return apiRequest<{ success: boolean }>('/api/tags', {
        method: 'DELETE',
        body: { tag }
      })
    }
  },
  
  requests: {
    // 获取所有请求
    getAll: async () => {
      return apiRequest<{ requests: any[] }>('/api/requests')
    },
    
    // 创建请求
    create: async (data: { type: string, roomId: string, tag?: string }) => {
      return apiRequest<{ success: boolean, request: any }>('/api/requests', {
        method: 'POST',
        body: data
      })
    },
    
    // 批准请求
    approve: async (requestId: string) => {
      return apiRequest<{ success: boolean }>(`/api/requests/${requestId}/approve`, {
        method: 'POST'
      })
    },
    
    // 拒绝请求
    reject: async (requestId: string) => {
      return apiRequest<{ success: boolean }>(`/api/requests/${requestId}/reject`, {
        method: 'POST'
      })
    }
  }
}