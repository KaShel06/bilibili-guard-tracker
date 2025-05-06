"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Trash, ExternalLink, Tag, Plus } from "lucide-react"
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
import { BaseStreamerCard, TagsDisplay } from "@/components/base-streamer-card"

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
  compact?: boolean
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
  onUpdateTags,
  compact = false
}: StreamerCardProps) {
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(streamer.tags || tags)
  const [newTag, setNewTag] = useState("")
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [showAddTagInput, setShowAddTagInput] = useState(false)
  const [tagManageOpen, setTagManageOpen] = useState(false)

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

  // 标签内容
  const tagsContent = (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin && (
        <Popover open={tagManageOpen} onOpenChange={setTagManageOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`${compact ? 'h-6 px-1.5 text-[10px]' : 'h-7 px-2 text-xs'}`}
            >
              <Tag className={`${compact ? 'h-3 w-3 mr-1' : 'h-3.5 w-3.5 mr-1.5'}`} />
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
                  className={`${compact ? 'h-6 px-1.5' : 'h-7 px-2'}`}
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
                    className={`${compact ? 'h-6' : 'h-7'} text-xs`}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                  />
                  <Button 
                    variant="ghost"
                    size="sm" 
                    className={`${compact ? 'h-6 w-6' : 'h-7 w-7'} p-0`}
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
      
      <TagsDisplay 
        tags={selectedTags} 
        emptyText={isAdmin ? "点击管理标签添加标签" : "暂无标签"}
        compact={compact}
      />
    </div>
  )

  // 顶部右侧操作按钮
  const headerRight = (
    <div className="flex items-center gap-1">
      {showDetailButton && (
        <Button variant="ghost" size="sm" asChild className={compact ? 'h-7 text-xs px-2' : ''}>
          <Link href={`/streamer/${streamer.roomId}`}>
            查看详情
            <ExternalLink className={`${compact ? 'h-3 w-3 ml-1' : 'h-3.5 w-3.5 ml-1'}`} />
          </Link>
        </Button>
      )}
      {onRefresh && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh} 
          disabled={isLoading}
          title="刷新数据"
          className={compact ? 'h-7 w-7 p-0' : ''}
        >
          {isLoading ? (
            <Loader2 className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} animate-spin`} />
          ) : (
            <RefreshCw className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
          )}
        </Button>
      )}
      {isAdmin && onDelete && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete}
          className={`text-destructive hover:text-destructive/90 ${compact ? 'h-7 w-7 p-0' : ''}`}
          title="删除"
        >
          <Trash className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
        </Button>
      )}
    </div>
  )

  // 底部按钮
  const footerContent = (
    <div className="flex justify-between w-full">
      <div className="flex gap-1">
        {/* Refresh button moved to header */}
      </div>
      {badge && <div>{badge}</div>}
    </div>
  )

  return (
    <BaseStreamerCard 
      streamer={streamer}
      headerRight={headerRight}
      footerContent={badge ? footerContent : undefined}
      compact={compact}
    >
      {tagsContent}
    </BaseStreamerCard>
  )
}

