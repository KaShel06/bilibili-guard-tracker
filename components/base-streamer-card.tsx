"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import type { StreamerInfo } from "@/lib/db"

export interface BaseStreamerCardProps {
  streamer: StreamerInfo
  headerContent?: ReactNode
  headerRight?: ReactNode
  children?: ReactNode
  footerContent?: ReactNode
  compact?: boolean
}

export function BaseStreamerCard({
  streamer,
  headerContent,
  headerRight,
  children,
  footerContent,
  compact = false
}: BaseStreamerCardProps) {
  if (!streamer) return null
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className={`flex flex-row items-start justify-between ${compact ? 'p-3 pb-0' : 'p-4 pb-0'}`}>
        <div className="flex flex-col">
          {headerContent || (
            <>
              <Link 
                href={`/streamer/${streamer.roomId}`} 
                className={`${compact ? 'text-base' : 'text-lg'} font-semibold hover:underline`}
              >
                {streamer.name || "未知主播"}
              </Link>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                房间号: {streamer.roomId || "N/A"}
              </p>
              {streamer.lastUpdated && (
                <p className="text-xs text-muted-foreground mt-1">
                  更新: {formatDate(streamer.lastUpdated)}
                </p>
              )}
            </>
          )}
        </div>
        {headerRight && <div>{headerRight}</div>}
      </CardHeader>
      
      <CardContent className={compact ? "p-3 min-h-[48px]" : "p-4 min-h-[64px]"}>
        {children}
      </CardContent>
      
      {footerContent && (
        <div className={`border-t flex justify-between ${compact ? 'p-3 pt-2' : 'p-4 pt-3'}`}>
          {footerContent}
        </div>
      )}
    </Card>
  )
}

// 标签展示组件
export interface TagsDisplayProps {
  tags?: string[]
  emptyText?: string
  variant?: "default" | "secondary" | "outline"
  compact?: boolean
}

export function TagsDisplay({ 
  tags = [], 
  emptyText = "暂无标签",
  variant = "outline",
  compact = false
}: TagsDisplayProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags && tags.length > 0 ? (
        tags.map(tag => (
          <Badge key={tag} variant={variant} className={`${compact ? 'text-[10px] py-0' : 'text-xs'}`}>
            {tag}
          </Badge>
        ))
      ) : (
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>{emptyText}</span>
      )}
    </div>
  )
}