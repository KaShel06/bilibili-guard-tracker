"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-4xl font-bold">出错了</h1>
      <p className="text-gray-500 mt-4 text-center">抱歉，发生了一个错误。</p>
      <div className="flex gap-4 mt-8">
        <Button onClick={reset} variant="outline">
          重试
        </Button>
        <Link href="/">
          <Button>返回首页</Button>
        </Link>
      </div>
    </div>
  )
}

