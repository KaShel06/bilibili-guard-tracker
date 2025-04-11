"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function TagsPage() {
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newTag, setNewTag] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tag: string | null }>({
    open: false,
    tag: null,
  })

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tags")
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error("Error fetching tags:", error)
      toast({
        title: "获取标签失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTag.trim()) return

    try {
      setIsCreating(true)
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag: newTag.trim() }),
      })

      if (!response.ok) {
        throw new Error("创建标签失败")
      }

      const data = await response.json()
      setTags(data.tags || [])
      setNewTag("")
      toast({
        title: "创建标签成功",
        description: `已创建标签 "${newTag.trim()}"`,
      })
    } catch (error) {
      console.error("Error creating tag:", error)
      toast({
        title: "创建标签失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTag = async () => {
    if (!deleteDialog.tag) return

    try {
      const response = await fetch(`/api/tags/${encodeURIComponent(deleteDialog.tag)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("删除标签失败")
      }

      setTags(tags.filter(tag => tag !== deleteDialog.tag))
      toast({
        title: "删除标签成功",
        description: `已删除标签 "${deleteDialog.tag}"`,
      })
    } catch (error) {
      console.error("Error deleting tag:", error)
      toast({
        title: "删除标签失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setDeleteDialog({ open: false, tag: null })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">标签管理</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">创建新标签</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="输入新标签名称"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
            />
            <Button onClick={handleCreateTag} disabled={isCreating || !newTag.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  创建中
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  创建
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">所有标签</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>加载中...</span>
            </div>
          ) : tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-sm py-1 px-2 group">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 ml-1 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => setDeleteDialog({ open: true, tag })}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无标签</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除标签</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除标签 "{deleteDialog.tag}" 吗？此操作将从所有主播中移除该标签。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}