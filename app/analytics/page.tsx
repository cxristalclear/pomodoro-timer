"use client"
import { X } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { generateCalendarGrid, getIntensityColor, calculateAnalytics } from "@/lib/utils"
import Link from "next/link"
import { useEffect, useState } from "react"

/**
 * Debug button component for troubleshooting analytics data
 */
const DebugButton = () => {
  const { sessions } = usePomodoro();
  
  const debug = () => {
    console.log("🔍 ANALYTICS DEBUG:");
    console.log("- Sessions count:", sessions?.length);
    console.log("- Sample session:", sessions?.[0]);
    console.log("- Today (JS):", new Date().toLocaleDateString());
    console.log("- Today (ISO):", new Date().toISOString().split('T')[0]);
    
    if (sessions?.[0]) {
      console.log("- Session date format:", sessions[0].date);
      console.log("- Session date type:", typeof sessions[0].date);
    }
    
    // Show all unique dates in sessions
    const uniqueDates = [...new Set(sessions?.map(s => s.date) || [])];
    console.log("- All unique dates in sessions:", uniqueDates);
    
    // Check today's sessions using both formats
    const todayJS = new Date().toLocaleDateString();
    const todayISO = new Date().toISOString().split('T')[0];
    
    const todaySessionsJS = sessions?.filter(s => s.date === todayJS) || [];
    const todaySessionsISO = sessions?.filter(s => s.date === todayISO) || [];
    
    console.log("- Today sessions (JS format):", todaySessionsJS.length);
    console.log("- Today sessions (ISO format):", todaySessionsISO.length);
  };
  
  return (
    <button 
      onClick={debug} 
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
    >
      🔍 Debug Analytics
    </button>
  );
};

/**
 * Analytics page component
 * Displays session statistics, activity calendar, and task breakdown
 */
function AnalyticsPageContent() {
  const { sessions, dataLoading, getTaskStats, loadSessions } = usePomodoro()
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalPomodoros: 0,
    avgPomodorosPerTask: 0
  })
  const [sessionsLoading, setSessionsLoading] = useState(true)

  // Load sessions when component mounts
  useEffect(() => {
    if (loadSessions) {
      console.log("📊 Analytics page loading sessions...");
      setSessionsLoading(true);
      loadSessions().finally(() => {
        setSessionsLoading(false);
      });
    }
  }, [loadSessions])

  // Load task statistics
  useEffect(() => {
    const loadTaskStats = async () => {
      try {
        const stats = await getTaskStats()
        setTaskStats(stats)
      } catch (error) {
        console.error("Error loading task stats:", error)
      }
    }
    loadTaskStats()
  }, [getTaskStats])

  // Calculate analytics data
  const analytics = calculateAnalytics(sessions)
  const calendarGrid = generateCalendarGrid(sessions)

  if (dataLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Page header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-900">
        <h1 className="text-xl font-light">Analytics</h1>
        <div className="flex items-center gap-4">
          <DebugButton />
          <Link
            href="/"
            className="text-white p-2 hover:bg-gray-900 rounded transition-colors"
            aria-label="Back to timer"
          >
            <X size={24} />
          </Link>
        </div>
      </header>

      {/* Analytics content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Statistics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center">
            <p className="text-3xl font-light">{analytics.todayCount ?? 0}</p>
            <p className="text-gray-500 text-sm">Today</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">{analytics.totalSessions ?? 0}</p>
            <p className="text-gray-500 text-sm">Total</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">{analytics.totalHours ?? 0}h</p>
            <p className="text-gray-500 text-sm">Hours</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">{analytics.avgPerDay ?? 0}</p>
            <p className="text-gray-500 text-sm">Avg/Day</p>
          </div>
        </div>

        {/* Task completion statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center">
            <p className="text-3xl font-light">{taskStats.totalTasks ?? 0}</p>
            <p className="text-gray-500 text-sm">Total Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">{taskStats.completedTasks ?? 0}</p>
            <p className="text-gray-500 text-sm">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">{taskStats.totalPomodoros ?? 0}</p>
            <p className="text-gray-500 text-sm">Pomodoros</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">{(taskStats.avgPomodorosPerTask ?? 0).toFixed(1)}</p>
            <p className="text-gray-500 text-sm">Avg/Task</p>
          </div>
        </div>

        {/* Completion rate */}
        {taskStats.totalTasks > 0 && (
          <div className="mb-8">
            <h3 className="text-gray-500 text-sm mb-4">Task Completion Rate</h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Completion Rate</span>
                <span className="text-sm text-white">
                  {((taskStats.completedTasks / (taskStats.totalTasks || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(taskStats.completedTasks / (taskStats.totalTasks || 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>{taskStats.completedTasks ?? 0} completed</span>
                <span>{(taskStats.totalTasks ?? 0) - (taskStats.completedTasks ?? 0)} remaining</span>
              </div>
            </div>
          </div>
        )}

        {/* Activity calendar grid */}
        <div className="mb-8">
          <h3 className="text-gray-500 text-sm mb-4">Activity (Last 30 Days)</h3>
          <div className="grid grid-cols-10 gap-1">
            {calendarGrid.map((day, index) => (
              <div key={index} className="aspect-square">
                <div
                  className={`w-full h-full rounded-sm ${getIntensityColor(day.intensity ?? 0)} hover:ring-1 hover:ring-gray-700 transition-all cursor-pointer`}
                  title={`${day.date}: ${day.count ?? 0} sessions`}
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
        {analytics.taskBreakdown && Object.keys(analytics.taskBreakdown).length > 0 && (
          <div>
            <h3 className="text-gray-500 text-sm mb-4">Task Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(analytics.taskBreakdown)
                .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
                .map(([task, count]) => (
                  <div key={task} className="flex justify-between items-center py-2 border-b border-gray-900">
                    <span className="text-gray-300">{task}</span>
                    <span className="text-gray-500">{count ?? 0}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Pomodoro efficiency insights */}
        {taskStats.totalPomodoros > 0 && (
          <div className="mt-8">
            <h3 className="text-gray-500 text-sm mb-4">Pomodoro Insights</h3>
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-500">🍅</span>
                  <span className="text-sm text-gray-400">Average Pomodoros per Task</span>
                </div>
                <p className="text-2xl font-light">{(taskStats.avgPomodorosPerTask ?? 0).toFixed(1)}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {(taskStats.avgPomodorosPerTask ?? 0) < 2 ? "Great efficiency!" : 
                   (taskStats.avgPomodorosPerTask ?? 0) < 4 ? "Good pace" : 
                   "Consider breaking down complex tasks"}
                </p>
              </div>
              
              {taskStats.completedTasks > 0 && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-400">Completion Rate</span>
                  </div>
                  <p className="text-2xl font-light">
                    {((taskStats.completedTasks / (taskStats.totalTasks || 1)) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {taskStats.completedTasks ?? 0} of {taskStats.totalTasks ?? 0} tasks completed
                  </p>
                </div>
              )}
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
    <ProtectedRoute>
      <AnalyticsPageContent />
    </ProtectedRoute>
  )
}
