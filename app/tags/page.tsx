"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash, BarChart4 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { PageContainer, PageHeader } from "@/components/page-container"
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
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <PageContainer>
          <PageHeader 
            title="标签管理" 
            description="创建和管理标签，用于对主播进行分类和分析"
          />

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
            <CardContent className="min-h-[120px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>加载中...</span>
                </div>
              ) : tags.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag) => (
                    <div key={tag} className="flex items-center mb-2">
                      <Badge variant="outline" className="text-sm py-1 px-2 mr-1">
                        {tag}
                      </Badge>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full"
                          asChild
                          title="查看标签分析"
                        >
                          <Link href={`/tags/${encodeURIComponent(tag)}`}>
                            <BarChart4 className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full"
                          onClick={() => setDeleteDialog({ open: true, tag })}
                          title="删除标签"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">暂无标签，请创建新标签</p>
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
        </PageContainer>
      </main>
      <AppFooter />
    </div>
  )
}