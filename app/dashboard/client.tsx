"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { StreamerInfo } from "@/lib/db"
import { StreamerCard } from "@/components/streamer-card"
import { AddStreamerForm } from "@/components/add-streamer-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function DashboardClient() {
  const router = useRouter()
  const [streamers, setStreamers] = useState<StreamerInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; roomId: string | null }>({
    open: false,
    roomId: null,
  })

  useEffect(() => {
    fetchStreamers()
  }, [])

  const fetchStreamers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/streamers")
      const data = await response.json()
      setStreamers(data.streamers || [])
    } catch (error) {
      console.error("Error fetching streamers:", error)
      toast({
        title: "获取主播列表失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (roomId: string) => {
    setDeleteDialog({ open: true, roomId })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.roomId) return

    try {
      const response = await fetch("/api/streamers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: deleteDialog.roomId }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete streamer")
      }

      toast({
        title: "删除成功",
        description: "已成功删除主播",
      })

      fetchStreamers()
    } catch (error) {
      toast({
        title: "删除失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setDeleteDialog({ open: false, roomId: null })
    }
  }

  const handleRefresh = async (roomId: string) => {
    try {
      setRefreshing(roomId)

      const response = await fetch("/api/collect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to refresh data")
      }

      toast({
        title: "刷新成功",
        description: `已获取 ${data.guardCount} 条大航海数据`,
      })

      fetchStreamers()
    } catch (error) {
      toast({
        title: "刷新失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setRefreshing(null)
    }
  }

  const handleRefreshAll = async () => {
    try {
      setRefreshingAll(true)
      
      const response = await fetch("/api/collect/all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to refresh all data")
      }

      toast({
        title: "刷新成功",
        description: `已为 ${data.results.length} 个主播更新大航海数据`,
      })

      await fetchStreamers()
    } catch (error) {
      toast({
        title: "刷新失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setRefreshingAll(false)
    }
  }

  return (
    <>
      <Tabs defaultValue="streamers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="streamers">主播管理</TabsTrigger>
          <TabsTrigger value="settings">系统设置</TabsTrigger>
        </TabsList>

        <TabsContent value="streamers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">主播列表</h2>
                <Button 
                  onClick={handleRefreshAll} 
                  disabled={refreshingAll || loading || streamers.length === 0}
                  size="sm"
                >
                  {refreshingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      刷新中...
                    </>
                  ) : (
                    "刷新全部"
                  )}
                </Button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12 border rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>加载中...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {streamers.length > 0 ? (
                    streamers.map((streamer) => (
                      <StreamerCard
                        key={streamer.roomId}
                        streamer={streamer}
                        isAdmin={true}
                        onDelete={handleDelete}
                        onRefresh={handleRefresh}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 border rounded-md">
                      <p className="text-gray-500">暂无追踪的主播</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">添加主播</h2>
              <AddStreamerForm onSuccess={fetchStreamers} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">系统设置</h2>
            <p className="text-gray-500">系统设置功能正在开发中...</p>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个主播吗？此操作将删除所有相关的历史数据，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

