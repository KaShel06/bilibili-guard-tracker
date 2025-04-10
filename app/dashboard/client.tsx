"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { StreamerInfo, GuardSnapshot } from "@/lib/db"
import { StreamerCard } from "@/components/streamer-card"
import { AddStreamerForm } from "@/components/add-streamer-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Tag, Filter, Eye } from "lucide-react"

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
  
  // 标签相关状态
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [currentStreamer, setCurrentStreamer] = useState<StreamerInfo | null>(null)
  const [filteredStreamers, setFilteredStreamers] = useState<StreamerInfo[]>([])
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{streamer: StreamerInfo, snapshot: GuardSnapshot | null}[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    fetchStreamers()
    fetchAllTags()
  }, [])

  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredStreamers(streamers)
    } else {
      filterStreamersByTags()
    }
  }, [selectedTags, streamers])

  const fetchStreamers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/streamers")
      const data = await response.json()
      setStreamers(data.streamers || [])
      setFilteredStreamers(data.streamers || [])
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

  const fetchAllTags = async () => {
    try {
      const response = await fetch("/api/tags")
      const data = await response.json()
      setAllTags(data.tags || [])
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const filterStreamersByTags = async () => {
    if (selectedTags.length === 0) {
      setFilteredStreamers(streamers)
      return
    }

    try {
      const response = await fetch("/api/streamers/filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: selectedTags }),
      })
      const data = await response.json()
      setFilteredStreamers(data.streamers || [])
    } catch (error) {
      console.error("Error filtering streamers:", error)
      toast({
        title: "筛选主播失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleAddTag = async () => {
    if (!newTag.trim() || !currentStreamer) return

    try {
      const response = await fetch(`/api/streamers/${currentStreamer.roomId}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag: newTag.trim() }),
      })

      if (!response.ok) {
        throw new Error("添加标签失败")
      }

      toast({
        title: "添加标签成功",
        description: `已为 ${currentStreamer.name} 添加标签 "${newTag.trim()}"`,
      })

      setNewTag("")
      fetchStreamers()
      fetchAllTags()
    } catch (error) {
      toast({
        title: "添加标签失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleRemoveTag = async (roomId: string, tag: string) => {
    try {
      const response = await fetch(`/api/streamers/${roomId}/tags`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag }),
      })

      if (!response.ok) {
        throw new Error("移除标签失败")
      }

      toast({
        title: "移除标签成功",
        description: `已移除标签 "${tag}"`,
      })

      fetchStreamers()
      fetchAllTags()
    } catch (error) {
      toast({
        title: "移除标签失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const openTagDialog = (streamer: StreamerInfo) => {
    setCurrentStreamer(streamer)
    setTagDialogOpen(true)
  }

  const handlePreviewData = async () => {
    if (selectedTags.length === 0) return

    try {
      setPreviewLoading(true)
      const response = await fetch("/api/streamers/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: selectedTags }),
      })
      const data = await response.json()
      setPreviewData(data.summary || [])
      setPreviewDialogOpen(true)
    } catch (error) {
      toast({
        title: "获取预览数据失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setPreviewLoading(false)
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
          {/* 标签筛选部分 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">标签筛选</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {allTags.map(tag => (
                  <Badge 
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagSelect(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                {allTags.length === 0 && <span className="text-sm text-gray-500">暂无标签</span>}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  disabled={selectedTags.length === 0}
                >
                  清除筛选
                </Button>
                <Button 
                  size="sm"
                  onClick={handlePreviewData}
                  disabled={selectedTags.length === 0 || previewLoading}
                >
                  {previewLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      加载中...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      预览数据
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  主播列表 
                  {selectedTags.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      (已筛选: {filteredStreamers.length} 个主播)
                    </span>
                  )}
                </h2>
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
                  {filteredStreamers.length > 0 ? (
                    filteredStreamers.map((streamer) => (
                      <StreamerCard
                        key={streamer.roomId}
                        streamer={streamer}
                        isAdmin={true}
                        onDelete={handleDelete}
                        onRefresh={handleRefresh}
                        onManageTags={() => openTagDialog(streamer)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 border rounded-md">
                      <p className="text-gray-500">
                        {selectedTags.length > 0 ? "没有符合筛选条件的主播" : "暂无追踪的主播"}
                      </p>
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

      {/* 标签管理对话框 */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>管理标签</DialogTitle>
            <DialogDescription>
              {currentStreamer?.name || "主播"} (房间号: {currentStreamer?.roomId || "未知"})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <p className="text-sm text-gray-500 w-full mb-1">当前标签:</p>
              {currentStreamer?.tags && currentStreamer.tags.length > 0 ? (
                currentStreamer.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button 
                      className="ml-1 text-xs hover:text-red-500"
                      onClick={() => handleRemoveTag(currentStreamer.roomId, tag)}
                    >
                      ×
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">暂无标签</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="输入新标签"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
              <Button onClick={handleAddTag} disabled={!newTag.trim()}>添加</Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 数据预览对话框 */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>标签数据预览</DialogTitle>
            <DialogDescription>
              已选标签: {selectedTags.join(", ")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>主播</TableHead>
                  <TableHead>房间号</TableHead>
                  <TableHead>总督</TableHead>
                  <TableHead>提督</TableHead>
                  <TableHead>舰长</TableHead>
                  <TableHead>总计</TableHead>
                  <TableHead>最后更新</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.length > 0 ? (
                  previewData.map(({ streamer, snapshot }) => (
                    <TableRow key={streamer.roomId}>
                      <TableCell>{streamer.name}</TableCell>
                      <TableCell>{streamer.roomId}</TableCell>
                      <TableCell>{snapshot?.guardLevelCounts[1] || 0}</TableCell>
                      <TableCell>{snapshot?.guardLevelCounts[2] || 0}</TableCell>
                      <TableCell>{snapshot?.guardLevelCounts[3] || 0}</TableCell>
                      <TableCell>{snapshot?.totalCount || 0}</TableCell>
                      <TableCell>{streamer.lastUpdated ? new Date(streamer.lastUpdated).toLocaleString() : "未更新"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">暂无数据</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 现有的删除确认对话框 */}
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

