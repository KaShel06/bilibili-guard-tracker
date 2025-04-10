"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Trash2, Tag } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { StreamerInfo } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"

interface StreamerCardProps {
  streamer: StreamerInfo
  onDelete?: (roomId: string) => void
  onRefresh?: (roomId: string) => void
  onManageTags?: () => void
  isAdmin?: boolean
  isRefreshing?: boolean
}

export function StreamerCard({
  streamer,
  onDelete,
  onRefresh,
  onManageTags,
  isAdmin = false,
  isRefreshing = false,
}: StreamerCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {streamer.avatar && (
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={streamer.avatar}
                  alt={streamer.name || "主播头像"}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{streamer.name || "未知主播"}</CardTitle>
              <p className="text-sm text-gray-500">房间号: {streamer.roomId}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 显示标签 */}
        {streamer.tags && streamer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {streamer.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="mt-3">
          <p className="text-sm">
            最后更新: {streamer.lastUpdated ? new Date(streamer.lastUpdated).toLocaleString() : "未更新"}
          </p>
        </div>
      </CardContent>

      {isAdmin && (
        <CardFooter className="pt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onManageTags}>
            <Tag className="h-4 w-4 mr-1" />
            标签
          </Button>
          <Button variant="outline" size="sm" onClick={() => onRefresh?.(streamer.roomId)} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                刷新中
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                刷新
              </>
            )}
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

