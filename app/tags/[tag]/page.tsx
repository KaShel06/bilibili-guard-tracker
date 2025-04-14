"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { TagAnalysis } from "@/components/tag-analysis"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import type { StreamerInfo } from "@/lib/db"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { PageContainer, PageHeader } from "@/components/page-container"

// 分析数据类型
interface TagAnalysisData {
  streamers: StreamerInfo[]
  guardOverlap: {
    totalUniqueGuards: number
    highFrequencyGuards: Array<{
      uid: number
      name: string
      guard_level: number
      count: number
      percentage: number
      streamers: string[]
    }>
    overlapStats: {
      averageOverlap: number
      maxOverlap: number
      streamersWithMostOverlap: [string, string] | null
    }
  }
}

export default function TagPage({ params }: { params: { tag: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [tagName, setTagName] = useState("")
  const [analysisData, setAnalysisData] = useState<TagAnalysisData | null>(null)

  // 解码URL中的标签名
  useEffect(() => {
    if (params.tag) {
      setTagName(decodeURIComponent(params.tag))
    }
  }, [params.tag])

  // 获取标签分析数据
  const fetchAnalysisData = async () => {
    if (!tagName) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/tags/${encodeURIComponent(tagName)}/analyze`)
      
      if (!response.ok) {
        throw new Error("获取标签分析数据失败")
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setAnalysisData(result.data)
      } else {
        throw new Error(result.error || "数据获取失败")
      }
    } catch (error) {
      console.error("Error fetching tag analysis:", error)
      toast({
        title: "获取标签分析失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 首次加载时获取数据
  useEffect(() => {
    if (tagName) {
      fetchAnalysisData()
    }
  }, [tagName])

  // 刷新分析数据
  const handleRefresh = () => {
    fetchAnalysisData()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <PageContainer>
          <PageHeader 
            title={tagName ? `标签: ${tagName}` : "标签分析"} 
            description={tagName ? "查看标签下主播的大航海数据重合分析" : undefined}
            actions={
              <Button variant="outline" size="sm" asChild>
                <Link href="/tags">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回标签列表
                </Link>
              </Button>
            }
          />

          {!tagName ? (
            <Card>
              <CardHeader>
                <CardTitle>无效的标签</CardTitle>
                <CardDescription>未找到标签信息</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">请返回标签列表选择一个有效的标签</p>
                <Button asChild>
                  <Link href="/tags">返回标签列表</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TagAnalysis 
              tag={tagName}
              isLoading={isLoading}
              analysisData={analysisData || undefined}
              onRefresh={handleRefresh}
            />
          )}
        </PageContainer>
      </main>
      <AppFooter />
    </div>
  )
} 