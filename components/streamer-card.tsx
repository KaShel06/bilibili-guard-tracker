"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Trash, ExternalLink, Tag, Plus, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { StreamerInfo } from "@/lib/db"

interface StreamerCardProps {
  streamer: StreamerInfo
  lastUpdated?: string
  isAdmin?: boolean
  tags?: string[]
  badge?: React.ReactNode
  onDelete?: () => void
  onRefresh?: () => void
  isLoading?: boolean
  showDetailButton?: boolean
  allTags?: string[] // 所有可用标签列表
  onCreateTag?: (tag: string) => Promise<boolean>
  onUpdateTags?: (streamerId: string, tags: string[]) => Promise<boolean>
}

export function StreamerCard({
  streamer,
  lastUpdated,
  isAdmin = false,
  tags = [],
  badge,
  onDelete,
  onRefresh,
  isLoading = false,
  showDetailButton = true,
  allTags = [],
  onCreateTag,
  onUpdateTags
}: StreamerCardProps) {
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(streamer.tags || tags)
  const [newTag, setNewTag] = useState("")
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [showAddTagInput, setShowAddTagInput] = useState(false)
  const [tagManageOpen, setTagManageOpen] = useState(false)

  const formattedLastUpdated = lastUpdated ? 
    new Date(lastUpdated).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) : null;

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
  const handleSaveTags = async () => {
    if (!onUpdateTags) return
    
    if (JSON.stringify(selectedTags) === JSON.stringify(streamer.tags || [])) {
      setTagManageOpen(false)
      return // 没有变化，不需要保存
    }
    
    try {
      setIsUpdatingTags(true)
      
      const success = await onUpdateTags(streamer.roomId, selectedTags)
      
      if (success) {
        toast({
          title: "标签更新成功",
          description: `已更新 ${streamer.name} 的标签`,
        })
      }
      
      setTagManageOpen(false)
    } catch (error) {
      toast({
        title: "更新标签失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingTags(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between p-4 pb-0">
        <div className="flex flex-col">
          <Link 
            href={`/streamer/${streamer.roomId}`} 
            className="text-lg font-semibold hover:underline"
          >
            {streamer.name}
          </Link>
          <p className="text-sm text-muted-foreground">房间号: {streamer.roomId}</p>
          {formattedLastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              更新: {formattedLastUpdated}
            </p>
          )}
        </div>
        {badge && <div>{badge}</div>}
      </CardHeader>
      <CardContent className="p-4 min-h-[64px]">
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Popover open={tagManageOpen} onOpenChange={setTagManageOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  <Tag className="h-3.5 w-3.5 mr-1.5" />
                  管理标签
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">选择标签</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setShowAddTagInput(!showAddTagInput)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  {/* 添加新标签输入框 */}
                  {showAddTagInput && (
                    <div className="flex items-center space-x-1">
                      <Input
                        placeholder="输入新标签"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="h-7 text-xs"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                      />
                      <Button 
                        variant="ghost"
                        size="sm" 
                        className="h-7 w-7 p-0" 
                        onClick={handleCreateTag}
                        disabled={isCreatingTag || !newTag.trim()}
                      >
                        {isCreatingTag ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  )}
                  
                  <div className="max-h-52 overflow-y-auto space-y-2">
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
                        <p className="text-xs text-muted-foreground">暂无可用标签</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={handleSaveTags}
                      disabled={isUpdatingTags || JSON.stringify(selectedTags) === JSON.stringify(streamer.tags || [])}
                    >
                      {isUpdatingTags ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          保存中
                        </>
                      ) : "保存"}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {selectedTags && selectedTags.length > 0 ? (
            selectedTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">{isAdmin ? "点击管理标签添加标签" : "暂无标签"}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0">
        <div className="flex gap-1">
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh} 
              disabled={isLoading}
              title="刷新数据"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
          {isAdmin && onDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="text-destructive hover:text-destructive/90"
              title="删除"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
        {showDetailButton && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/streamer/${streamer.roomId}`}>
              查看详情
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

