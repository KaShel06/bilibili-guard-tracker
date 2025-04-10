"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Eye } from "lucide-react"
import type { StreamerInfo, GuardSnapshot } from "@/lib/db"

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
  previewData
}: TagFilterProps) {
  return (
    <>
      <Card className="mt-6">
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