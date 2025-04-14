"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tag, Plus, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { StreamerInfo } from "@/lib/db"
import Link from "next/link"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

interface PublicStreamerCardProps {
  streamer: StreamerInfo
  onRequestTag?: (tag: string) => Promise<boolean>
}

export function PublicStreamerCard({ 
  streamer, 
  onRequestTag
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
        {/* 标签展示区域 */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {streamer.tags && streamer.tags.length > 0 ? (
            streamer.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-500">暂无标签</span>
          )}
          
          {onRequestTag && (
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Plus className="h-3.5 w-3.5" />
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
        <div className="mt-4">
          <Link href={`/streamer/${streamer.roomId}`} className="text-sm text-blue-600 hover:underline">
            查看大航海数据
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}