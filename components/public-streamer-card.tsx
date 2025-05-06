"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2 } from "lucide-react"
import type { StreamerInfo } from "@/lib/db"
import Link from "next/link"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { BaseStreamerCard, TagsDisplay } from "@/components/base-streamer-card"

interface PublicStreamerCardProps {
  streamer: StreamerInfo
  onRequestTag?: (tag: string) => Promise<boolean>
  compact?: boolean
}

export function PublicStreamerCard({ 
  streamer, 
  onRequestTag,
  compact = false
}: PublicStreamerCardProps) {
  if (!streamer) return null
  
  const [newTag, setNewTag] = useState("")
  const [isRequestingTag, setIsRequestingTag] = useState(false)
  
  // 请求添加标签
  const handleRequestTag = async () => {
    if (!newTag.trim() || !onRequestTag) return
    
    try {
      setIsRequestingTag(true)
      const success = await onRequestTag(newTag.trim())
      
      if (success) {
        setNewTag("")
      }
    } catch (error) {
      toast({
        title: "请求失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsRequestingTag(false)
    }
  }

  const tagsContent = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <TagsDisplay 
          tags={streamer.tags} 
          variant="secondary"
          compact={compact}
        />
        
        {onRequestTag && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${compact ? 'h-5 px-1' : 'h-6 px-2'} hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                <Plus className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">请求添加标签</h4>
                <div className="flex items-center space-x-1">
                  <Input
                    placeholder="输入新标签"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="h-8 text-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleRequestTag()}
                  />
                  <Button 
                    size="sm" 
                    className="h-8 px-2" 
                    onClick={handleRequestTag}
                    disabled={isRequestingTag || !newTag.trim()}
                  >
                    {isRequestingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  您的请求将提交给管理员审核
                </p>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {/* 大航海数据展示 */}
      <div>
        <Link 
          href={`/streamer/${streamer.roomId}`} 
          className={`${compact ? 'text-xs' : 'text-sm'} text-blue-600 hover:underline`}
        >
          查看大航海数据
        </Link>
      </div>
    </div>
  )

  return (
    <BaseStreamerCard 
      streamer={streamer}
      compact={compact}
    >
      {tagsContent}
    </BaseStreamerCard>
  )
}