"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, RefreshCw, Tag, Plus, X, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { StreamerInfo } from "@/lib/db"
import Link from "next/link"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

interface StreamerCardProps {
  streamer: StreamerInfo
  onDelete?: (roomId: string) => void
  onRefresh?: (roomId: string) => void
  onManageTags?: (updatedStreamer?: StreamerInfo) => void
  isAdmin?: boolean
  isRefreshing?: boolean
  allTags?: string[] // 所有可用标签列表，从标签库获取
  onCreateTag?: (tag: string) => Promise<boolean> // 创建新标签的回调函数
}

export function StreamerCard({ 
  streamer, 
  onDelete, 
  onRefresh, 
  onManageTags,
  isAdmin = false,
  isRefreshing = false,
  allTags = [], // 从父组件传入的所有标签
  onCreateTag
}: StreamerCardProps) {
  if (!streamer) return null
  
  // 组件内部状态
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(streamer.tags || [])
  const [newTag, setNewTag] = useState("")
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [showAddTagInput, setShowAddTagInput] = useState(false)
  
  // 处理标签选择
  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }
  
  // 创建新标签
  const handleCreateTag = async () => {
    if (!newTag.trim() || !onCreateTag) return
    
    // 检查标签是否已存在
    if (allTags.includes(newTag.trim())) {
      toast({
        title: "标签已存在",
        description: `标签 "${newTag.trim()}" 已存在`,
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsCreatingTag(true)
      const success = await onCreateTag(newTag.trim())
      
      if (success) {
        toast({
          title: "创建成功",
          description: `已创建标签 "${newTag.trim()}"`,
        })
        
        // 自动选中新创建的标签
        setSelectedTags(prev => [...prev, newTag.trim()])
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
  
  // 保存标签更改
  const saveTagChanges = async () => {
    if (JSON.stringify(selectedTags) === JSON.stringify(streamer.tags || [])) {
      return // 没有变化，不需要保存
    }
    
    try {
      setIsUpdatingTags(true)
      
      const response = await fetch(`/api/streamers/${streamer.roomId}/tags/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: selectedTags }),
      })
      
      if (!response.ok) {
        throw new Error("更新标签失败")
      }
      
      const data = await response.json()
      
      toast({
        title: "标签更新成功",
        description: `已更新 ${streamer.name} 的标签`,
      })
      
      // 更新本地状态
      const updatedStreamer = { ...streamer, tags: selectedTags }
      
      // 如果有回调函数，通知父组件更新特定主播数据
      if (onManageTags) {
        onManageTags(updatedStreamer)
      }
    } catch (error) {
      console.error("Error updating tags:", error)
      toast({
        title: "更新标签失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingTags(false)
    }
  }
  
  // 移除单个标签
  const removeTag = async (tag: string) => {
    try {
      const response = await fetch(`/api/streamers/${streamer.roomId}/tags`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag }),
      })
      
      if (!response.ok) {
        throw new Error("移除标签失败")
      }
      
      // 更新本地状态
      setSelectedTags(prev => prev.filter(t => t !== tag))
      
      // 如果有回调函数，通知父组件刷新数据
      if (onManageTags) {
        onManageTags()
      }
    } catch (error) {
      console.error("Error removing tag:", error)
      toast({
        title: "移除标签失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{streamer.name || "未知主播"}</CardTitle>
            <CardDescription>房间号: {streamer.roomId || "N/A"}</CardDescription>
          </div>
          {streamer.lastUpdated && (
            <Badge variant="outline" className="ml-2">
              更新: {formatDate(streamer.lastUpdated)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {/* 标签管理区域 */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {isAdmin && (
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Tag className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">选择标签</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => setShowAddTagInput(!showAddTagInput)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  {/* 添加新标签输入框 */}
                  {showAddTagInput && (
                    <div className="flex items-center space-x-1 mb-2">
                      <Input
                        placeholder="输入新标签"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="h-7 text-xs"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                      />
                      <Button 
                        size="sm" 
                        className="h-7 px-2" 
                        onClick={handleCreateTag}
                        disabled={isCreatingTag || !newTag.trim()}
                      >
                        {isCreatingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      </Button>
                    </div>
                  )}
                  
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {allTags.length > 0 ? (
                      allTags.map(tag => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`tag-${streamer.roomId}-${tag}`} 
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={() => handleTagSelect(tag)}
                          />
                          <Label htmlFor={`tag-${streamer.roomId}-${tag}`} className="text-sm cursor-pointer">
                            {tag}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-xs text-gray-500 mb-2">暂无可用标签</p>
                        {!showAddTagInput && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowAddTagInput(true)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            创建标签
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* 只在有标签变更时显示保存按钮 */}
                  {JSON.stringify(selectedTags) !== JSON.stringify(streamer.tags || []) && (
                    <div className="pt-2 flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={saveTagChanges}
                        disabled={isUpdatingTags}
                      >
                        {isUpdatingTags ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            保存中
                          </>
                        ) : "保存"}
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {streamer.tags && streamer.tags.length > 0 ? (
            streamer.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs group relative">
                {tag}
                {isAdmin && (
                  <button 
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))
          ) : (
            <span></span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Link href={`/streamer/${streamer.roomId}`} className="text-sm text-blue-600 hover:underline">
            查看详情
          </Link>
        </div>
      </CardContent>
      {isAdmin && (
        <CardFooter className="pt-2 flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onRefresh?.(streamer.roomId)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中' : '刷新'}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete?.(streamer.roomId)}>
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

