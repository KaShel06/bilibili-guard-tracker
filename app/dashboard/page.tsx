import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Shield, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DashboardClient } from "./client"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <span className="font-bold">管理控制台</span>
            </Link>
          </div>
          <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              首页
            </Link>
          </nav>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <span className="text-sm text-muted-foreground mr-2">{session.user?.name}</span>
            <Link href="/api/auth/signout">
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-1" />
                退出登录
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-bold mb-6">管理控制台</h1>
        <DashboardClient />
      </main>
    </div>
  )
}

