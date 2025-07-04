import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format seconds into MM:SS format
 * @param seconds - Number of seconds to format
 * @returns Formatted time string (e.g., "25:00")
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * Get intensity color class for activity grid based on session count
 * @param intensity - Intensity level (0-4)
 * @returns Tailwind CSS class name
 */
export function getIntensityColor(intensity: number): string {
  switch (intensity) {
    case 0:
      return "bg-gray-900"
    case 1:
      return "bg-red-900"
    case 2:
      return "bg-red-800"
    case 3:
      return "bg-red-700"
    case 4:
      return "bg-red-600"
    default:
      return "bg-gray-900"
  }
}

/**
 * Generate calendar grid data for analytics view
 * @param sessions - Array of completed sessions
 * @returns Array of calendar day data with intensity levels
 */
export function generateCalendarGrid(sessions: Array<{ date: string }>) {
  const today = new Date()
  const grid = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const daysSessions = sessions.filter((s) => s.date === dateStr)

    grid.push({
      date: dateStr,
      day: date.toLocaleDateString("en", { weekday: "short" })[0],
      count: daysSessions.length,
      intensity: daysSessions.length === 0 ? 0 : Math.min(4, Math.ceil(daysSessions.length / 2)),
    })
  }

  return grid
}

/**
 * Calculate analytics data from sessions
 * @param sessions - Array of completed sessions
 * @returns Analytics object with statistics
 */
export function calculateAnalytics(sessions: Array<{ date: string; duration: number; task: string }>) {
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter((s) => s.date === today)
  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0)
  const uniqueDays = [...new Set(sessions.map((s) => s.date))].length

  return {
    todayCount: todaySessions.length,
    totalSessions: sessions.length,
    totalHours: (totalMinutes / 60).toFixed(1),
    avgPerDay: uniqueDays > 0 ? (sessions.length / uniqueDays).toFixed(1) : "0",
    taskBreakdown: sessions.reduce(
      (acc, s) => {
        acc[s.task] = (acc[s.task] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  }
}
