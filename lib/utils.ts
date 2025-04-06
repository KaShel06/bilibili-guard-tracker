import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date for display
export function formatDate(dateString: string): string {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"

    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Error"
  }
}

// Get guard level name
export function getGuardLevelName(level: number): string {
  switch (level) {
    case 1:
      return "总督"
    case 2:
      return "提督"
    case 3:
      return "舰长"
    default:
      return "未知"
  }
}

// Get guard level color
export function getGuardLevelColor(level: number): string {
  switch (level) {
    case 1:
      return "#E22D2D" // 总督 - red
    case 2:
      return "#9D3DCF" // 提督 - purple
    case 3:
      return "#61C2F0" // 舰长 - blue
    default:
      return "#999999"
  }
}

// Generate a color from a string (for consistent colors per user)
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  let color = "#"
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    color += ("00" + value.toString(16)).substr(-2)
  }

  return color
}

