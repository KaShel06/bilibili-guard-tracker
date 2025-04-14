import { Suspense } from "react"
import { StreamerListClient } from "./client"

export const metadata = {
  title: "主播列表 | B站大航海追踪",
  description: "查看所有追踪的B站主播及其大航海数据",
}

export default function StreamerListPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">主播列表</h1>
      <Suspense fallback={<div>加载中...</div>}>
        <StreamerListClient />
      </Suspense>
    </div>
  )
}