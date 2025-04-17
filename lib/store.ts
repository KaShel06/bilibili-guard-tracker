/**
 * 全局状态管理
 * 使用Zustand管理应用状态
 */

import { create } from 'zustand'
import type { StreamerInfo, GuardSnapshot } from './db'
import { toast } from '@/components/ui/use-toast'

// API请求函数
async function apiRequest<T = any>(
  url: string, 
  options: { body?: any, showErrorToast?: boolean } & RequestInit = {}
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

// 应用状态接口
interface AppState {
  // 数据状态
  streamers: StreamerInfo[]
  filteredStreamers: StreamerInfo[]
  allTags: string[]
  selectedTags: string[]
  pendingRequests: any[]
  previewData: {streamer: StreamerInfo, snapshot: GuardSnapshot | null}[]
  
  // UI状态
  loading: boolean
  refreshing: string | null
  refreshingAll: boolean
  previewLoading: boolean
  previewDialogOpen: boolean
  loadingRequests: boolean
  
  // 操作方法
  fetchStreamers: () => Promise<void>
  fetchAllTags: () => Promise<void>
  handleTagSelect: (tag: string) => void
  clearSelectedTags: () => void
  handleDelete: (roomId: string) => Promise<void>
  handleRefresh: (roomId: string) => Promise<void>
  handleRefreshAll: () => Promise<void>
  handlePreviewData: () => Promise<void>
  setPreviewDialogOpen: (open: boolean) => void
  fetchPendingRequests: () => Promise<void>
  handleApproveRequest: (requestId: string) => Promise<void>
  handleRejectRequest: (requestId: string) => Promise<void>
  updateStreamerTags: (updatedStreamer: StreamerInfo) => void
}

// 创建Zustand store
export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  streamers: [],
  filteredStreamers: [],
  allTags: [],
  selectedTags: [],
  pendingRequests: [],
  previewData: [],
  loading: false,
  refreshing: null,
  refreshingAll: false,
  previewLoading: false,
  previewDialogOpen: false,
  loadingRequests: false,
  
  // 获取主播列表
  fetchStreamers: async () => {
    try {
      set({ loading: true })
      const data = await apiRequest<{ streamers: StreamerInfo[] }>('/api/streamers')
      set(state => ({ 
        streamers: data.streamers,
        filteredStreamers: state.selectedTags.length > 0 
          ? state.filteredStreamers 
          : data.streamers,
        loading: false
      }))
    } catch (error) {
      set({ loading: false })
      console.error('Error fetching streamers:', error)
    }
  },
  
  // 获取所有标签
  fetchAllTags: async () => {
    try {
      const data = await apiRequest<{ tags: string[] }>('/api/tags')
      set({ allTags: data.tags })
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  },
  
  // 处理标签选择
  handleTagSelect: (tag: string) => {
    set(state => {
      const newSelectedTags = state.selectedTags.includes(tag)
        ? state.selectedTags.filter(t => t !== tag)
        : [...state.selectedTags, tag]
      
      return { selectedTags: newSelectedTags }
    })
    
    // 筛选主播
    const { selectedTags } = get()
    if (selectedTags.length === 0) {
      set(state => ({ filteredStreamers: state.streamers }))
    } else {
      get().filterStreamersByTags(selectedTags)
    }
  },
  
  // 清除选中的标签
  clearSelectedTags: () => {
    set(state => ({ 
      selectedTags: [],
      filteredStreamers: state.streamers
    }))
  },
  
  // 按标签筛选主播
  filterStreamersByTags: async (tags: string[]) => {
    if (tags.length === 0) {
      set(state => ({ filteredStreamers: state.streamers }))
      return
    }

    try {
      const data = await apiRequest<{ streamers: StreamerInfo[] }>('/api/streamers/filter', {
        method: 'POST',
        body: { tags }
      })
      set({ filteredStreamers: data.streamers })
    } catch (error) {
      console.error('Error filtering streamers:', error)
    }
  },
  
  // 删除主播
  handleDelete: async (roomId: string) => {
    try {
      await apiRequest<{ success: boolean }>(`/api/streamers/${roomId}`, {
        method: 'DELETE'
      })
      
      toast({
        title: "删除成功",
        description: "已成功删除该主播",
      })
      
      // 更新本地状态
      set(state => ({
        streamers: state.streamers.filter(s => s.roomId !== roomId),
        filteredStreamers: state.filteredStreamers.filter(s => s.roomId !== roomId)
      }))
    } catch (error) {
      console.error('Error deleting streamer:', error)
    }
  },
  
  // 刷新主播数据
  handleRefresh: async (roomId: string) => {
    try {
      set({ refreshing: roomId })
      
      const data = await apiRequest<{ guardCount: number }>('/api/collect', {
        method: 'POST',
        body: { roomId }
      })
      
      toast({
        title: "刷新成功",
        description: `已获取 ${data.guardCount} 条大航海数据`,
      })
      
      await get().fetchStreamers()
    } catch (error) {
      console.error('Error refreshing streamer:', error)
    } finally {
      set({ refreshing: null })
    }
  },
  
  // 刷新所有主播数据
  handleRefreshAll: async () => {
    try {
      set({ refreshingAll: true })
      
      const data = await apiRequest<{ results: any[] }>('/api/collect/all', {
        method: 'POST'
      })
      
      toast({
        title: "刷新成功",
        description: `已为 ${data.results.length} 个主播更新大航海数据`,
      })
      
      await get().fetchStreamers()
    } catch (error) {
      console.error('Error refreshing all streamers:', error)
    } finally {
      set({ refreshingAll: false })
    }
  },
  
  // 获取预览数据
  handlePreviewData: async () => {
    const { selectedTags } = get()
    if (selectedTags.length === 0) return
    
    try {
      set({ previewLoading: true })
      
      const data = await apiRequest<{ summary: {streamer: StreamerInfo, snapshot: GuardSnapshot | null}[] }>('/api/streamers/summary', {
        method: 'POST',
        body: { tags: selectedTags }
      })
      
      set({ 
        previewData: data.summary,
        previewDialogOpen: true,
        previewLoading: false
      })
    } catch (error) {
      set({ previewLoading: false })
      console.error('Error getting preview data:', error)
    }
  },
  
  // 设置预览对话框状态
  setPreviewDialogOpen: (open: boolean) => {
    set({ previewDialogOpen: open })
  },
  
  // 获取待处理请求
  fetchPendingRequests: async () => {
    try {
      set({ loadingRequests: true })
      
      const data = await apiRequest<{ requests: any[] }>('/api/requests')
      
      set({ 
        pendingRequests: data.requests,
        loadingRequests: false
      })
    } catch (error) {
      set({ loadingRequests: false })
      console.error('Error fetching pending requests:', error)
    }
  },
  
  // 批准请求
  handleApproveRequest: async (requestId: string) => {
    try {
      await apiRequest<{ success: boolean }>(`/api/requests/${requestId}/approve`, {
        method: 'POST'
      })
      
      toast({
        title: "审批成功",
        description: "已成功添加主播或标签",
      })
      
      // 刷新数据
      await get().fetchPendingRequests()
      await get().fetchStreamers()
      await get().fetchAllTags()
    } catch (error) {
      console.error('Error approving request:', error)
    }
  },
  
  // 拒绝请求
  handleRejectRequest: async (requestId: string) => {
    try {
      await apiRequest<{ success: boolean }>(`/api/requests/${requestId}/reject`, {
        method: 'POST'
      })
      
      toast({
        title: "已拒绝请求",
        description: "已成功拒绝该请求",
      })
      
      // 刷新请求列表
      await get().fetchPendingRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  },
  
  // 更新主播标签
  updateStreamerTags: (updatedStreamer: StreamerInfo) => {
    set(state => ({
      streamers: state.streamers.map(s => 
        s.roomId === updatedStreamer.roomId ? updatedStreamer : s
      ),
      filteredStreamers: state.filteredStreamers.map(s => 
        s.roomId === updatedStreamer.roomId ? updatedStreamer : s
      )
    }))
  }
}))