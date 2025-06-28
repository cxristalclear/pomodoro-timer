"use client"
import { X } from "lucide-react"
import { PomodoroProvider } from "@/components/PomodoroProvider"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { generateCalendarGrid, getIntensityColor, calculateAnalytics } from "@/lib/utils"
import Link from "next/link"

/**
 * Analytics page component
 * Displays session statistics, activity calendar, and task breakdown
 */
function AnalyticsPageContent() {
  const { sessions, setCurrentView } = usePomodoro()

  // Calculate analytics data
  const analytics = calculateAnalytics(sessions)
  const calendarGrid = generateCalendarGrid(sessions)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Page header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-900">
        <h1 className="text-xl font-light">Analytics</h1>
        <Link
          href="/"
          className="text-white p-2 hover:bg-gray-900 rounded transition-colors"
          aria-label="Back to timer"
        >
          <X size={24} />
        </Link>
      </header>

      {/* Analytics content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Statistics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center">
            <p className="text-3xl font-light">{analytics.todayCount}</p>
            <p className="text-gray-500 text-sm">Today</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">{analytics.totalSessions}</p>
            <p className="text-gray-500 text-sm">Total</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">{analytics.totalHours}h</p>
            <p className="text-gray-500 text-sm">Hours</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">{analytics.avgPerDay}</p>
            <p className="text-gray-500 text-sm">Avg/Day</p>
          </div>
        </div>

        {/* Activity calendar grid */}
        <div className="mb-8">
          <h3 className="text-gray-500 text-sm mb-4">Activity (Last 30 Days)</h3>
          <div className="grid grid-cols-10 gap-1">
            {calendarGrid.map((day, index) => (
              <div key={index} className="aspect-square">
                <div
                  className={`w-full h-full rounded-sm ${getIntensityColor(day.intensity)} hover:ring-1 hover:ring-gray-700 transition-all cursor-pointer`}
                  title={`${day.date}: ${day.count} sessions`}
                />
              </div>
            ))}
          </div>
          {/* Intensity legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${getIntensityColor(i)}`} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Task breakdown */}
        {Object.keys(analytics.taskBreakdown).length > 0 && (
          <div>
            <h3 className="text-gray-500 text-sm mb-4">Task Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(analytics.taskBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([task, count]) => (
                  <div key={task} className="flex justify-between items-center py-2 border-b border-gray-900">
                    <span className="text-gray-300">{task}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Analytics page with provider wrapper
 */
export default function AnalyticsPage() {
  return (
    <PomodoroProvider>
      <AnalyticsPageContent />
    </PomodoroProvider>
  )
}
