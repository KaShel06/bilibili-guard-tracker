"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Eye, Plus, Tag, X, Check } from "lucide-react"
import type { StreamerInfo, GuardSnapshot } from "@/lib/db"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TagFilterProps {
  allTags: string[]
  selectedTags: string[]
  onTagSelect: (tag: string) => void
  onClearTags: () => void
  onPreviewData: () => Promise<void>
  previewLoading: boolean
  previewDialogOpen: boolean
  setPreviewDialogOpen: (open: boolean) => void
  previewData: {streamer: StreamerInfo, snapshot: GuardSnapshot | null}[]
  onCreateTag?: (tag: string) => Promise<boolean>
  onDeleteTag?: (tag: string) => Promise<boolean>
  isAdmin?: boolean
}

export function TagFilter({
  allTags,
  selectedTags,
  onTagSelect,
  onClearTags,
  onPreviewData,
  previewLoading,
  previewDialogOpen,
  setPreviewDialogOpen,
  previewData,
  onCreateTag,
  onDeleteTag,
  isAdmin = false
}: TagFilterProps) {
  const [newTag, setNewTag] = useState("")
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [tagManageOpen, setTagManageOpen] = useState(false)
  const [showAddTagInput, setShowAddTagInput] = useState(false)
  const [isDeletingTag, setIsDeletingTag] = useState<string | null>(null)
  const [tagError, setTagError] = useState<string | null>(null)

  // 创建新标签
  const handleCreateTag = async () => {
    if (!newTag.trim() || !onCreateTag) return
    
    // 检查标签是否已存在
    if (allTags.includes(newTag.trim())) {
      setTagError("标签已存在")
      return
    }
    
    setTagError(null)
    try {
      setIsCreatingTag(true)
      const success = await onCreateTag(newTag.trim())
      
      if (success) {
        toast({
          title: "创建成功",
          description: `已创建标签 "${newTag.trim()}"`,
        })
        setNewTag("")
        setShowAddTagInput(false)
      }
    } catch (error) {
      toast({
        title: "创建失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsCreatingTag(false)
    }
  }

  // 删除标签
  const handleDeleteTag = async (tag: string) => {
    if (!onDeleteTag) return
    
    try {
      setIsDeletingTag(tag)
      const success = await onDeleteTag(tag)
      
      if (success) {
        toast({
          title: "删除成功",
          description: `已删除标签 "${tag}"`,
        })
        
        // 如果删除的标签在当前选中的标签中，也要从选中标签中移除
        if (selectedTags.includes(tag)) {
          onTagSelect(tag) // 触发取消选择
        }
      }
    } catch (error) {
      toast({
        title: "删除失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsDeletingTag(null)
    }
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">标签筛选</CardTitle>
          <div className="flex gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setShowAddTagInput(!showAddTagInput)}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加标签
              </Button>
            )}
            {isAdmin && (
              <Popover open={tagManageOpen} onOpenChange={setTagManageOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <Tag className="h-4 w-4 mr-1" />
                    管理标签
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4">
                  <h4 className="font-medium text-sm mb-3">管理标签</h4>
                  
                  {/* 创建新标签 */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Input
                      placeholder="输入新标签名称"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                    />
                    <Button 
                      size="sm" 
                      className="h-8 px-2" 
                      onClick={handleCreateTag}
                      disabled={isCreatingTag || !newTag.trim()}
                    >
                      {isCreatingTag ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {/* 标签列表 */}
                  <div className="max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {allTags.length > 0 ? (
                        allTags.map(tag => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="text-xs py-1 px-2 group flex items-center"
                          >
                            {tag}
                            <button
                              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteTag(tag)}
                              disabled={isDeletingTag === tag}
                            >
                              {isDeletingTag === tag ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">暂无标签</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setTagManageOpen(false)}
                    >
                      完成
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* 添加标签输入框 */}
          {isAdmin && showAddTagInput && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="输入新标签名称"
                  value={newTag}
                  onChange={(e) => {
                    setNewTag(e.target.value)
                    setTagError(null) // 清除错误信息
                  }}
                  className={`h-8 text-sm ${tagError ? "border-red-500" : ""}`}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                />
                <Button 
                  size="sm" 
                  onClick={handleCreateTag}
                  disabled={isCreatingTag || !newTag.trim()}
                >
                  {isCreatingTag ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  创建
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setShowAddTagInput(false)
                    setTagError(null)
                  }}
                >
                  取消
                </Button>
              </div>
              {tagError && (
                <p className="text-xs text-red-500">{tagError}</p>
              )}
              <p className="text-xs text-gray-500">
                注意：新创建的标签将被添加到系统中，但不会立即分配给任何主播。
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {allTags.map(tag => (
              <Badge 
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onTagSelect(tag)}
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
              onClick={onClearTags}
              disabled={selectedTags.length === 0}
            >
              清除筛选
            </Button>
            <Button 
              size="sm"
              onClick={onPreviewData}
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
    </>
  )
}