import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getLatestSnapshot, getHistoricalSnapshots, getRecentChanges, getStreamers } from "@/lib/db"
import { GuardTable } from "@/components/guard-table"
import { GuardChart } from "@/components/guard-chart"
import { ChangesTable } from "@/components/changes-table"
import { formatDate, getGuardLevelName, getGuardLevelColor } from "@/lib/utils"
import { ChevronLeft, Shield, Users, History, BarChart2 } from "lucide-react"

export default async function StreamerPage({ params }: { params: { roomId: string } }) {
  const { roomId } = await params

  try {
    // Get streamer info
    const streamers = await getStreamers()
    const streamer = streamers.find((s) => s.roomId === roomId)

    if (!streamer) {
      return (
        <div className="container py-12">
          <Link href="/" className="flex items-center text-blue-600 hover:underline mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回首页
          </Link>
          <div className="text-center py-12 border rounded-md">
            <p className="text-gray-500">未找到该主播信息</p>
            <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
              返回首页
            </Link>
          </div>
        </div>
      )
    }

    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    const isAuthenticated = !!session

    // Get data
    const latestSnapshot = await getLatestSnapshot(roomId)
    const historicalSnapshots = await getHistoricalSnapshots(roomId, 30)
    const recentChanges = await getRecentChanges(roomId, 10)

    if (!latestSnapshot) {
      return (
        <div className="container py-12">
          <Link href="/" className="flex items-center text-blue-600 hover:underline mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回首页
          </Link>
          <div className="text-center py-12 border rounded-md">
            <h2 className="text-xl font-bold mb-2">{streamer.name}</h2>
            <p className="text-gray-500">暂无数据，请管理员先刷新数据</p>
            {isAuthenticated && (
              <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
                前往管理控制台
              </Link>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <Link href="/" className="flex items-center space-x-2">
                <Shield className="h-6 w-6" />
                <span className="font-bold">Bilibili 大航海追踪</span>
              </Link>
            </div>
            <div className="flex flex-1 items-center justify-end space-x-2">
              {!isAuthenticated && (
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    管理员登录
                  </Button>
                </Link>
              )}
              {isAuthenticated && (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    管理控制台
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 container py-6">
          <Link href="/" className="flex items-center text-blue-600 hover:underline mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回首页
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">{streamer.name}</h1>
              <p className="text-gray-500">房间号: {roomId}</p>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="text-sm">
                最后更新: {formatDate(latestSnapshot.timestamp)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">总大航海数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{latestSnapshot.totalCount || 0}</div>
              </CardContent>
            </Card>

            {[1, 2, 3].map((level) => (
              <Card key={level}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: getGuardLevelColor(level) }} className="text-white">
                      {getGuardLevelName(level)}
                    </Badge>
                    <CardTitle className="text-lg">数量</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {latestSnapshot.guardLevelCounts &&
                    latestSnapshot.guardLevelCounts[level as 1 | 2 | 3] !== undefined
                      ? latestSnapshot.guardLevelCounts[level as 1 | 2 | 3]
                      : 0}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                大航海列表
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-1">
                <BarChart2 className="h-4 w-4" />
                数据趋势
              </TabsTrigger>
              <TabsTrigger value="changes" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                变动记录
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>大航海用户列表</CardTitle>
                  <CardDescription>当前共有 {latestSnapshot.totalCount || 0} 个大航海用户</CardDescription>
                </CardHeader>
                <CardContent>
                  <GuardTable guards={latestSnapshot.users || []} showFull={isAuthenticated} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>大航海数量趋势</CardTitle>
                  <CardDescription>最近 {historicalSnapshots.length} 次数据采集的大航海数量变化</CardDescription>
                </CardHeader>
                <CardContent>
                  {historicalSnapshots.length > 0 ? (
                    <GuardChart snapshots={historicalSnapshots} />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">暂无历史数据</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="changes">
              <Card>
                <CardHeader>
                  <CardTitle>大航海变动记录</CardTitle>
                  <CardDescription>记录大航海用户的加入和退出情况</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentChanges.length > 0 ? (
                    <ChangesTable changes={recentChanges} showFull={isAuthenticated} />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">暂无变动记录</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        <footer className="border-t py-6 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Bilibili 大航海追踪系统</p>
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error("Error in streamer page:", error)
    return (
      <div className="container py-12">
        <Link href="/" className="flex items-center text-blue-600 hover:underline mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          返回首页
        </Link>
        <div className="text-center py-12 border rounded-md">
          <p className="text-gray-500">加载数据时出错，请稍后再试</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            返回首页
          </Link>
        </div>
      </div>
    )
  }
}

