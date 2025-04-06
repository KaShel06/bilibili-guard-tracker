"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GuardSnapshot } from "@/lib/db"
import { getGuardLevelName, getGuardLevelColor, formatDate } from "@/lib/utils"
import { Chart, registerables } from "chart.js"

// Register Chart.js components
Chart.register(...registerables)

interface GuardChartProps {
  snapshots: GuardSnapshot[]
  title?: string
}

export function GuardChart({ snapshots, title = "大航海数量变化" }: GuardChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!snapshots || snapshots.length === 0) {
      setError("No data available for chart")
      return
    }

    try {
      // Destroy previous chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      // Sort snapshots by timestamp
      const sortedSnapshots = [...snapshots].sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      })

      // Prepare data
      const labels = sortedSnapshots.map((s) => formatDate(s.timestamp || ""))
      const totalData = sortedSnapshots.map((s) => s.totalCount || 0)
      const level1Data = sortedSnapshots.map((s) =>
        s.guardLevelCounts && s.guardLevelCounts[1] !== undefined ? s.guardLevelCounts[1] : 0,
      )
      const level2Data = sortedSnapshots.map((s) =>
        s.guardLevelCounts && s.guardLevelCounts[2] !== undefined ? s.guardLevelCounts[2] : 0,
      )
      const level3Data = sortedSnapshots.map((s) =>
        s.guardLevelCounts && s.guardLevelCounts[3] !== undefined ? s.guardLevelCounts[3] : 0,
      )

      // Create chart
      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "总计",
                data: totalData,
                borderColor: "#0ea5e9",
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.1,
              },
              {
                label: getGuardLevelName(1),
                data: level1Data,
                borderColor: getGuardLevelColor(1),
                backgroundColor: "transparent",
                borderWidth: 2,
                tension: 0.1,
              },
              {
                label: getGuardLevelName(2),
                data: level2Data,
                borderColor: getGuardLevelColor(2),
                backgroundColor: "transparent",
                borderWidth: 2,
                tension: 0.1,
              },
              {
                label: getGuardLevelName(3),
                data: level3Data,
                borderColor: getGuardLevelColor(3),
                backgroundColor: "transparent",
                borderWidth: 2,
                tension: 0.1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                mode: "index",
                intersect: false,
              },
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: "时间",
                },
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: "数量",
                },
                beginAtZero: true,
              },
            },
          },
        })
      }
    } catch (err) {
      console.error("Error creating chart:", err)
      setError("Failed to create chart")
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [snapshots])

  if (error) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center border rounded-md">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  )
}

