"use client"
import { X, TrendingUp, Clock, Target, Zap, Calendar, BarChart3 } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { generateCalendarGrid, getIntensityColor, calculateAnalytics } from "@/lib/utils"
import Link from "next/link"
import { useEffect, useState } from "react"

/**
 * Enhanced Analytics page with daily view and beautiful design
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

  // Calculate analytics data
  const analytics = calculateAnalytics(sessions)
  const calendarGrid = generateCalendarGrid(sessions)

  // Get today's sessions for daily view
  const today = new Date().toISOString().split('T')[0]
  const todaysSessions = sessions.filter(s => s.date === today)

  // Generate hourly breakdown for daily view
  const generateHourlyBreakdown = () => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sessions: 0,
      minutes: 0,
      intensity: 0
    }))

    todaysSessions.forEach(session => {
      if (session.completedAt) {
        const hour = new Date(session.completedAt).getHours()
        hourlyData[hour].sessions += 1
        hourlyData[hour].minutes += session.duration || 0
      }
    })

    // Calculate intensity (0-4) based on session count
    hourlyData.forEach(data => {
      data.intensity = Math.min(4, Math.floor(data.sessions / 1))
    })

    return hourlyData
  }

  const hourlyBreakdown = generateHourlyBreakdown()

  // Generate session timeline for today
  const generateSessionTimeline = () => {
    return todaysSessions
      .filter(s => s.completedAt)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .map(session => ({
        ...session,
        time: new Date(session.completedAt).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        isBreak: session.task.includes('Break')
      }))
  }

  const sessionTimeline = generateSessionTimeline()

  if (dataLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Enhanced header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-light">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Your productivity insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Back to timer"
          >
            <X size={24} />
          </Link>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Today's Focus Hero Section */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Zap className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-blue-100">Today's Focus</h2>
              <p className="text-blue-300/70 text-sm">Your momentum is building! 🚀</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {analytics.todayCount ?? 0}
              </div>
              <p className="text-blue-200 text-sm mt-1">Sessions</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {((analytics.todayCount || 0) * 25 / 60).toFixed(1)}h
              </div>
              <p className="text-green-200 text-sm mt-1">Focus Time</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {analytics.todayCount >= 8 ? "🔥" : analytics.todayCount >= 4 ? "⭐" : "📈"}
              </div>
              <p className="text-purple-200 text-sm mt-1">Status</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {Math.round(((analytics.todayCount || 0) / 8) * 100)}%
              </div>
              <p className="text-orange-200 text-sm mt-1">Daily Goal</p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="text-blue-400" size={20} />
              <span className="text-gray-300 text-sm">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.totalSessions ?? 0}</p>
            <p className="text-gray-400 text-xs">Sessions</p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-green-400" size={20} />
              <span className="text-gray-300 text-sm">Hours</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.totalHours ?? 0}h</p>
            <p className="text-gray-400 text-xs">Focus Time</p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-purple-400" size={20} />
              <span className="text-gray-300 text-sm">Average</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.avgPerDay ?? 0}</p>
            <p className="text-gray-400 text-xs">Per Day</p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Target className="text-yellow-400" size={20} />
              <span className="text-gray-300 text-sm">Tasks</span>
            </div>
            <p className="text-2xl font-bold text-white">{taskStats.completedTasks ?? 0}</p>
            <p className="text-gray-400 text-xs">Completed</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-200">Activity Overview</h3>
          <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700/50">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'daily'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Calendar size={16} className="inline mr-2" />
              Daily
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Monthly
            </button>
          </div>
        </div>

        {/* Daily View */}
        {viewMode === 'daily' && (
          <div className="space-y-6">
            {/* Today's Session Timeline */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Today's Session Timeline</h4>
              {sessionTimeline.length > 0 ? (
                <div className="space-y-3">
                  {sessionTimeline.map((session, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        session.isBreak 
                          ? 'bg-green-500/10 border border-green-500/20' 
                          : 'bg-blue-500/10 border border-blue-500/20'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        session.isBreak ? 'bg-green-400' : 'bg-blue-400'
                      }`} />
                      <div className="flex-1">
                        <span className="text-white font-medium">{session.task}</span>
                        <span className="text-gray-400 ml-2">• {session.duration}min</span>
                      </div>
                      <span className="text-gray-300 text-sm">{session.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No sessions today yet. Start focusing! 🎯</p>
                </div>
              )}
            </div>

            {/* Hourly Heatmap */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Today's Focus Hours</h4>
              <div className="grid grid-cols-12 gap-2">
                {hourlyBreakdown.map((data, index) => (
                  <div key={index} className="text-center">
                    <div
                      className={`w-full h-8 rounded-md ${getIntensityColor(data.intensity)} hover:ring-2 hover:ring-blue-400/50 transition-all cursor-pointer mb-1`}
                      title={`${data.hour}:00 - ${data.sessions} sessions (${data.minutes}min)`}
                    />
                    <span className="text-xs text-gray-400">
                      {data.hour === 0 ? '12A' : data.hour <= 12 ? `${data.hour}${data.hour === 12 ? 'P' : ''}` : `${data.hour - 12}P`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                <span>12 AM</span>
                <span>Peak focus hours highlighted</span>
                <span>11 PM</span>
              </div>
            </div>
          </div>
        )}

        {/* Monthly View (existing calendar) */}
        {viewMode === 'monthly' && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
            <h4 className="text-lg font-semibold text-gray-200 mb-4">Activity (Last 30 Days)</h4>
            <div className="grid grid-cols-10 gap-2 mb-4">
              {calendarGrid.map((day, index) => (
                <div key={index} className="aspect-square">
                  <div
                    className={`w-full h-full rounded-md ${getIntensityColor(day.intensity ?? 0)} hover:ring-2 hover:ring-blue-400/50 transition-all cursor-pointer`}
                    title={`${day.date}: ${day.count ?? 0} sessions`}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${getIntensityColor(i)}`} />
                  ))}
                </div>
                <span>More</span>
              </div>
              <span>30-day activity overview</span>
            </div>
          </div>
        )}

        {/* Enhanced Task Breakdown */}
        {analytics.taskBreakdown && Object.keys(analytics.taskBreakdown).length > 0 && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
            <h4 className="text-lg font-semibold text-gray-200 mb-4">Task Breakdown</h4>
            <div className="space-y-3">
              {Object.entries(analytics.taskBreakdown)
                .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
                .map(([task, count]) => {
                  const percentage = ((count || 0) / (analytics.totalSessions || 1)) * 100
                  const isBreak = task.includes('Break')
                  return (
                    <div key={task} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            isBreak ? 'bg-green-400' : 'bg-blue-400'
                          }`} />
                          <span className="text-gray-200 font-medium">{task}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-semibold">{count ?? 0}</span>
                          <span className="text-gray-400 text-sm ml-2">({percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isBreak ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Insights Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-green-100 mb-3">🎯 Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-200">Completion Rate</span>
                <span className="text-green-100 font-semibold">
                  {taskStats.totalTasks > 0 ? Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-200">Avg Pomodoros/Task</span>
                <span className="text-green-100 font-semibold">{(taskStats.avgPomodorosPerTask ?? 0).toFixed(1)} 🍅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-purple-100 mb-3">🚀 Insights</h4>
            <div className="space-y-2 text-purple-200">
              {analytics.todayCount >= 6 && <p className="text-sm">🔥 Amazing focus today!</p>}
              {parseFloat(analytics.avgPerDay) >= 5 && <p className="text-sm">⭐ Consistent daily habits</p>}
              {taskStats.avgPomodorosPerTask < 2 && taskStats.completedTasks > 0 && <p className="text-sm">⚡ Great at quick wins!</p>}
              {taskStats.avgPomodorosPerTask >= 3 && <p className="text-sm">🧠 Deep work champion!</p>}
              {(analytics.todayCount || 0) === 0 && <p className="text-sm">🎯 Ready to start focusing?</p>}
            </div>
          </div>
        </div>
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
