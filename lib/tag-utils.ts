import { toast } from "@/components/ui/use-toast"
import { createTag, updateStreamerTags, getAllTags } from "@/lib/db"

// 创建新标签
export async function handleCreateTag(tagName: string): Promise<boolean> {
  if (!tagName.trim()) return false

  try {
    const success = await createTag(tagName.trim())
    
    if (success) {
      toast({
        title: "创建标签成功",
        description: `已创建标签 "${tagName.trim()}"`,
      })
      return true
    }
    
    return false
  } catch (error) {
    console.error("Error creating tag:", error)
    toast({
      title: "创建标签失败",
      description: (error as Error).message,
      variant: "destructive",
    })
    return false
  }
}

// 更新主播标签
export async function handleUpdateStreamerTags(roomId: string, tags: string[]): Promise<boolean> {
  try {
    const success = await updateStreamerTags(roomId, tags)
    
    if (success) {
      toast({
        title: "更新标签成功",
        description: "已更新主播标签",
      })
      return true
    }
    
    return false
  } catch (error) {
    console.error("Error updating streamer tags:", error)
    toast({
      title: "更新标签失败",
      description: (error as Error).message,
      variant: "destructive",
    })
    return false
  }
}

// 获取所有标签
export async function fetchAllTags(): Promise<string[]> {
  try {
    return await getAllTags()
  } catch (error) {
    console.error("Error fetching tags:", error)
    toast({
      title: "获取标签失败",
      description: (error as Error).message,
      variant: "destructive",
    })
    return []
  }
} 