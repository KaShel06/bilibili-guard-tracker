import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStreamers } from "@/lib/db"
import { StreamerCard } from "@/components/streamer-card"
import { ChevronRight, Shield, BarChart2, Users } from "lucide-react"

export default async function Home() {
  let streamers = []

  try {
    streamers = await getStreamers()
  } catch (error) {
    console.error("Error in Home page:", error)
    // Continue with empty streamers array
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
            <Link href="/login">
              <Button variant="outline" size="sm">
                管理员登录
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-blue-50 to-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Bilibili 大航海数据追踪系统
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  追踪多个主播的大航海数据变化，分析贡献用户情况，实时掌握直播间动态
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="#streamers">
                  <Button>
                    查看主播列表
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container py-12 space-y-6 md:py-16">
          <div className="mx-auto text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">主要功能</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-lg">全方位追踪和分析Bilibili直播间大航海数据</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>大航海追踪</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>实时追踪主播大航海数量变化，记录总督、提督、舰长数据</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>用户分析</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>记录大航海用户变动情况，追踪新增和退出的用户</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                <CardTitle>数据可视化</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>通过图表直观展示大航海数据变化趋势，便于分析</CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="streamers" className="container py-12 space-y-6 md:py-16">
          <div className="mx-auto text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">主播列表</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-lg">当前追踪的主播列表，点击查看详细数据</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {streamers && streamers.length > 0 ? (
              streamers.map((streamer) => <StreamerCard key={streamer.roomId} streamer={streamer} />)
            ) : (
              <div className="col-span-full text-center py-12 border rounded-md">
                <p className="text-gray-500">暂无追踪的主播</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Bilibili 大航海追踪系统</p>
        </div>
      </footer>
    </div>
  )
}

