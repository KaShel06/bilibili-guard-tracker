import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStreamers } from "@/lib/db"
import { StreamerCard } from "@/components/streamer-card"
import { ChevronRight, Shield, BarChart2, Users, Layers, Tag } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { PageContainer } from "@/components/page-container"
import type { StreamerInfo } from "@/lib/db"

export default async function Home() {
  let streamers: StreamerInfo[] = []

  try {
    streamers = await getStreamers()
  } catch (error) {
    console.error("Error in Home page:", error)
    // Continue with empty streamers array
  }

  // 获取主播的标签
  const streamersWithTags = streamers.slice(0, 6).map((streamer) => ({
    ...streamer,
    tags: streamer.tags || []
  }))

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20 lg:py-24 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-background">
          <PageContainer className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <Shield className="h-12 w-12 text-primary" />
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Bilibili 大航海数据追踪系统
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  追踪多个主播的大航海数据变化，分析贡献用户情况，实时掌握直播间动态
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="#features">
                  <Button size="lg" variant="default">
                    了解功能
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#streamers">
                  <Button size="lg" variant="outline">
                    查看主播列表
                  </Button>
                </Link>
              </div>
            </div>
          </PageContainer>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 md:py-16 bg-muted/50">
          <PageContainer className="space-y-8">
            <div className="mx-auto text-center space-y-4">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">主要功能</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                全方位追踪和分析Bilibili直播间大航海数据
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-background">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">大航海追踪</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    实时追踪主播大航海数量变化，记录总督、提督、舰长数据
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-background">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">用户分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    记录大航海用户变动情况，追踪新增和退出的用户
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-background">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">数据可视化</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    通过图表直观展示大航海数据变化趋势，便于分析
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-background">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">标签管理</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    使用标签对主播进行分类管理，分析相同标签下的数据重合
                  </p>
                </CardContent>
              </Card>
            </div>
          </PageContainer>
        </section>

        {/* Streamers Section */}
        <section id="streamers" className="py-12 md:py-16">
          <PageContainer className="space-y-8">
            <div className="mx-auto text-center space-y-4">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">主播列表</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                当前追踪的主播列表，点击查看详细数据
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {streamersWithTags.length > 0 ? (
                streamersWithTags.map((streamer) => (
                  <StreamerCard 
                    key={streamer.roomId} 
                    streamer={streamer}
                    lastUpdated={streamer.lastUpdated}
                    tags={streamer.tags}
                    showDetailButton={true}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 border rounded-md bg-background">
                  <p className="text-muted-foreground">暂无追踪的主播</p>
                </div>
              )}
            </div>

            {streamers.length > 6 && (
              <div className="flex justify-center mt-6">
                <Button asChild variant="outline">
                  <Link href="/dashboard">
                    查看更多主播
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </PageContainer>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-primary/5">
          <PageContainer>
            <div className="mx-auto max-w-3xl text-center space-y-6">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
                开始追踪主播的大航海数据
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-lg">
                登录管理员账号，添加主播并开始追踪。系统会自动抓取数据并呈现给您。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/login">
                    管理员登录
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/dashboard">
                    查看控制面板
                  </Link>
                </Button>
              </div>
            </div>
          </PageContainer>
        </section>
      </main>
      
      <AppFooter />
    </div>
  )
}

