"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, RefreshCw } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { StreamerInfo } from "@/lib/db"
import Link from "next/link"

interface StreamerCardProps {
  streamer: StreamerInfo
  onDelete?: (roomId: string) => void
  onRefresh?: (roomId: string) => void
  isAdmin?: boolean
}

export function StreamerCard({ streamer, onDelete, onRefresh, isAdmin = false }: StreamerCardProps) {
  if (!streamer) return null

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{streamer.name || "Unknown Streamer"}</CardTitle>
            <CardDescription>Room ID: {streamer.roomId || "N/A"}</CardDescription>
          </div>
          {streamer.lastUpdated && (
            <Badge variant="outline" className="ml-2">
              Updated: {formatDate(streamer.lastUpdated)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex justify-between items-center">
          <Link href={`/streamer/${streamer.roomId}`} className="text-sm text-blue-600 hover:underline">
            View Details
          </Link>
        </div>
      </CardContent>
      {isAdmin && (
        <CardFooter className="pt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onRefresh?.(streamer.roomId)}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete?.(streamer.roomId)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

