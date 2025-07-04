"use client"
import { X, TrendingUp, Clock, Target, Zap, Calendar, BarChart3 } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { generateCalendarGrid, getIntensityColor, calculateAnalytics } from "@/lib/utils"
import Link from "next/link"
import { useEffect, useState } from "react"

/**
 * Enhanced Analytics page with daily view and minimalist design
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
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')

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

  if (dataLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading analytics...</div>
      </div>
    )
  }

  const analytics = calculateAnalytics(sessions || [])
  const calendarGrid = generateCalendarGrid(sessions || [])

  // Generate daily timeline for today
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = (sessions || []).filter(s => s.date === today)
  const sortedTodaySessions = todaySessions.sort((a, b) => (a.completedAt || '').localeCompare(b.completedAt || ''))

  // Generate hourly heatmap using local time
  const hourlyData = Array.from({length: 24}, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    const sessionsInHour = todaySessions.filter(s => {
      if (!s.completedAt) return false
      // Convert UTC timestamp to local time
      const localTime = new Date(s.completedAt)
      const localHour = localTime.getHours().toString().padStart(2, '0')
      return localHour === hour
    }).length
    return { hour, count: sessionsInHour }
  })

  // Helper function to format timestamp to local time
  const formatLocalTime = (utcTimestamp: string) => {
    const date = new Date(utcTimestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Consistent header with settings page */}
      <header className="flex justify-between items-center p-6 border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <BarChart3 className="text-blue-400" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Analytics</h1>
            <p className="text-gray-400 text-sm">Track your productivity patterns</p>
          </div>
        </div>
        
        <Link
          href="/"
          className="text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Back to timer"
        >
          <X size={24} />
        </Link>
      </header>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        
        {/* View Toggle */}
        <div className="flex justify-center">
          <div className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'daily'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Monthly View
            </button>
          </div>
        </div>

        {viewMode === 'daily' ? (
          <>
            {/* Today's Focus Hero Section */}
            <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Target className="text-blue-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Today's Focus</h2>
                  <p className="text-gray-400 text-sm">Your productivity summary for today</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{analytics.todayCount}</div>
                  <div className="text-gray-300 text-sm">Sessions Today</div>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{taskStats.completedTasks}</div>
                  <div className="text-gray-300 text-sm">Tasks Done</div>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">{analytics.totalHours}h</div>
                  <div className="text-gray-300 text-sm">Total Hours</div>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-400">{analytics.avgPerDay}</div>
                  <div className="text-gray-300 text-sm">Avg/Day</div>
                </div>
              </div>
            </section>

            {/* Hourly Heatmap */}
            <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="text-purple-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Peak Hours</h2>
                  <p className="text-gray-400 text-sm">When you're most productive today</p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-1">
                {hourlyData.map(({ hour, count }) => (
                  <div key={hour} className="text-center">
                    <div 
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                        count > 0 ? 'bg-blue-500 text-white' : 'bg-gray-800/50 text-gray-500'
                      }`}
                      title={`${parseInt(hour) === 0 ? '12' : parseInt(hour) > 12 ? parseInt(hour) - 12 : parseInt(hour)}${parseInt(hour) < 12 ? 'AM' : 'PM'} - ${count} sessions`}
                    >
                      {count || ''}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {parseInt(hour) === 0 ? '12A' : parseInt(hour) > 12 ? `${parseInt(hour) - 12}P` : parseInt(hour) === 12 ? '12P' : `${parseInt(hour)}A`}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Today's Timeline */}
            <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Clock className="text-green-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Today's Timeline</h2>
                  <p className="text-gray-400 text-sm">Chronological view of your work sessions</p>
                </div>
              </div>

              <div className="space-y-3">
                {sortedTodaySessions.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No sessions recorded for today</p>
                ) : (
                  sortedTodaySessions.map((session, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-lg">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-gray-200 font-medium">{session.task}</div>
                        <div className="text-gray-400 text-sm">
                          {formatLocalTime(session.completedAt)} • {session.duration} min
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Monthly Stats */}
            <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="text-blue-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Monthly Overview</h2>
                  <p className="text-gray-400 text-sm">Your productivity patterns this month</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{analytics.totalSessions}</div>
                  <div className="text-gray-300 text-sm">Total Sessions</div>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{taskStats.totalTasks}</div>
                  <div className="text-gray-300 text-sm">Total Tasks</div>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">{analytics.totalHours}h</div>
                  <div className="text-gray-300 text-sm">Total Hours</div>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-400">{analytics.avgPerDay}</div>
                  <div className="text-gray-300 text-sm">Avg Per Day</div>
                </div>
              </div>
            </section>

            {/* Activity Calendar */}
            <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Calendar className="text-green-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Activity Calendar</h2>
                  <p className="text-gray-400 text-sm">Visual representation of your daily progress</p>
                </div>
              </div>

              <div className="space-y-2">
                {Array.from({ length: Math.ceil(calendarGrid.length / 7) }, (_, weekIndex) => (
                  <div key={weekIndex} className="flex gap-1">
                    {calendarGrid.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`w-4 h-4 rounded-sm ${day.intensity > 0 ? getIntensityColor(day.intensity) : 'bg-gray-800/50'}`}
                        title={`${day.date}: ${day.count} sessions`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Task Breakdown */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Target className="text-orange-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Task Breakdown</h2>
              <p className="text-gray-400 text-sm">How you spent your time across different tasks</p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(analytics.taskBreakdown).length === 0 ? (
              <p className="text-gray-400 text-center py-4">No tasks recorded yet</p>
            ) : (
              Object.entries(analytics.taskBreakdown).map(([task, count]) => {
                const percentage = Math.round((count / analytics.totalSessions) * 100)
                return (
                  <div key={task} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-200 font-medium">{task}</span>
                        <span className="text-gray-400 text-sm">{count} sessions ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-800/50 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Insights */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Smart Insights</h2>
              <p className="text-gray-400 text-sm">AI-powered observations about your productivity</p>
            </div>
          </div>

          <div className="space-y-3">
            {analytics.todayCount >= 6 && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-200 text-sm">🔥 Amazing focus today! You've completed {analytics.todayCount} sessions.</p>
              </div>
            )}
            {parseFloat(analytics.avgPerDay) >= 5 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-200 text-sm">⭐ You're building consistent daily habits with {analytics.avgPerDay} sessions per day.</p>
              </div>
            )}
            {taskStats.avgPomodorosPerTask < 2 && taskStats.completedTasks > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-200 text-sm">⚡ You're great at quick wins! Most tasks completed in under 2 sessions.</p>
              </div>
            )}
            {taskStats.avgPomodorosPerTask >= 3 && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-purple-200 text-sm">🧠 Deep work champion! You average {taskStats.avgPomodorosPerTask.toFixed(1)} sessions per task.</p>
              </div>
            )}
            {(analytics.todayCount || 0) === 0 && (
              <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                <p className="text-gray-300 text-sm">📈 Ready to start your productivity journey? Begin with your first session!</p>
              </div>
            )}
          </div>
        </section>
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
