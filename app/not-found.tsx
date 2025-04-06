import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-6xl font-bold">404</h1>
      <h2 className="text-2xl font-semibold mt-4">页面未找到</h2>
      <p className="text-gray-500 mt-2 text-center">抱歉，您访问的页面不存在或已被移除。</p>
      <Link href="/" className="mt-8">
        <Button>返回首页</Button>
      </Link>
    </div>
  )
}

