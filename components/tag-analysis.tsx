"use client"

import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, BarChart4, Users, Award } from "lucide-react"
import type { StreamerInfo } from "@/lib/db"

// 定义组件接收的属性类型
interface TagAnalysisProps {
  tag: string
  isLoading: boolean
  analysisData?: {
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
  onRefresh: () => void
}

export function TagAnalysis({ tag, isLoading, analysisData, onRefresh }: TagAnalysisProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // 守护等级对应的名称和颜色
  const guardLevelInfo = {
    1: { name: "总督", color: "bg-purple-500" },
    2: { name: "提督", color: "bg-blue-500" },
    3: { name: "舰长", color: "bg-pink-500" }
  }

  if (isLoading) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="text-xl">标签 &quot;{tag}&quot; 守护分析</CardTitle>
          <CardDescription>正在加载分析数据...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!analysisData || !analysisData.streamers || analysisData.streamers.length === 0) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="text-xl">标签 &quot;{tag}&quot; 守护分析</CardTitle>
          <CardDescription>无法获取分析数据或标签下无主播</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-500 mb-4">没有找到带有此标签的主播数据</p>
          <Button onClick={onRefresh}>刷新数据</Button>
        </CardContent>
      </Card>
    )
  }

  const { streamers, guardOverlap } = analysisData
  const { totalUniqueGuards, highFrequencyGuards, overlapStats } = guardOverlap

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">标签 &quot;{tag}&quot; 守护分析</CardTitle>
            <CardDescription>
              {streamers.length} 个主播，{totalUniqueGuards} 个独立守护
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            刷新数据
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">
              <BarChart4 className="h-4 w-4 mr-2" />
              概览
            </TabsTrigger>
            <TabsTrigger value="highFrequency">
              <Award className="h-4 w-4 mr-2" />
              高频守护
            </TabsTrigger>
            <TabsTrigger value="streamers">
              <Users className="h-4 w-4 mr-2" />
              主播列表
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">总计数据</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">主播数量</span>
                      <span className="font-medium">{streamers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">独立守护数量</span>
                      <span className="font-medium">{totalUniqueGuards}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">高频守护数量</span>
                      <span className="font-medium">{highFrequencyGuards.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">守护重合度</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">平均重合数</span>
                      <span className="font-medium">{overlapStats.averageOverlap.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">最大重合数</span>
                      <span className="font-medium">{overlapStats.maxOverlap}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">重合度最高的主播</span>
                      <span className="font-medium">
                        {overlapStats.streamersWithMostOverlap 
                          ? `${overlapStats.streamersWithMostOverlap[0]} 和 ${overlapStats.streamersWithMostOverlap[1]}`
                          : "无"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">重合度分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...Array(Math.min(streamers.length, 5))].map((_, i) => {
                      const count = highFrequencyGuards.filter(g => g.count === i + 1).length
                      const percentage = totalUniqueGuards > 0 
                        ? (count / totalUniqueGuards * 100).toFixed(1) 
                        : "0.0"
                      
                      return (
                        <div key={i} className="flex justify-between">
                          <span className="text-gray-500">出现在 {i + 1} 个主播</span>
                          <span className="font-medium">{count} ({percentage}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="highFrequency">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">高频守护用户</CardTitle>
                <CardDescription>在多个主播间重复出现的守护用户</CardDescription>
              </CardHeader>
              <CardContent>
                {highFrequencyGuards.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用户名</TableHead>
                        <TableHead>等级</TableHead>
                        <TableHead>出现次数</TableHead>
                        <TableHead>覆盖率</TableHead>
                        <TableHead>出现在</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {highFrequencyGuards.map((guard) => (
                        <TableRow key={guard.uid}>
                          <TableCell>{guard.name}</TableCell>
                          <TableCell>
                            <Badge 
                              className={`${guardLevelInfo[guard.guard_level as 1 | 2 | 3].color} text-white`}
                            >
                              {guardLevelInfo[guard.guard_level as 1 | 2 | 3].name}
                            </Badge>
                          </TableCell>
                          <TableCell>{guard.count}</TableCell>
                          <TableCell>{guard.percentage.toFixed(1)}%</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {guard.streamers.map((streamer, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {streamer}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">没有找到高频守护用户</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="streamers">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">主播列表</CardTitle>
                <CardDescription>拥有此标签的主播列表</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>房间号</TableHead>
                      <TableHead>其他标签</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {streamers.map((streamer) => (
                      <TableRow key={streamer.roomId}>
                        <TableCell>{streamer.name}</TableCell>
                        <TableCell>{streamer.roomId}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {streamer.tags
                              ?.filter(t => t !== tag)
                              .map((otherTag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {otherTag}
                                </Badge>
                              ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 