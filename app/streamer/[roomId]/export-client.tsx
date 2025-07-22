"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ExportSnapshots({ roomId }: { roomId: string }) {
  const [loading, setLoading] = useState(false)

  const handleExport = async (details: boolean) => {
    setLoading(true)
    try {
      const url = `/api/streamers/${roomId}/export?details=${details}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("导出失败")
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = window.URL.createObjectURL(blob)
      a.download = `${roomId}-snapshots${details ? '-details' : ''}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      alert("导出失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 mb-4">
      <Button onClick={() => handleExport(false)} disabled={loading} variant="outline">
        导出汇总 (XLSX)
      </Button>
      <Button onClick={() => handleExport(true)} disabled={loading} variant="outline">
        导出详细 (XLSX)
      </Button>
    </div>
  )
} 