import Link from "next/link"
import { Shield, Github } from "lucide-react"

export function AppFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="flex flex-col items-center justify-between gap-4 px-8 md:flex-row md:py-4">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
          <Link href="/" className="flex items-center gap-1 text-sm">
            <Shield className="h-4 w-4" />
            <span className="font-semibold">Bilibili 大航海追踪</span>
          </Link>
          <p className="text-sm text-muted-foreground md:border-l md:border-gray-200 md:pl-2">
            &copy; {new Date().getFullYear()} All rights reserved
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="https://github.com/yourusername/bilibili-guard-tracker" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <Github className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </footer>
  )
} 