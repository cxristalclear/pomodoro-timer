"use client"
import { X, TrendingUp, Clock, Target, Zap, Calendar, BarChart3, Trash2, Check, AlertCircle } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { BreadcrumbNav, useBreadcrumbs } from "@/components/BreadcrumbNav"
import { generateCalendarGrid, getIntensityColor, calculateAnalytics, formatTime } from "@/lib/utils"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

/**
 * Enhanced Analytics page with daily view and minimalist design
 */
function AnalyticsPageContent() {
  const { 
    sessions, 
    dataLoading, 
    getTaskStats, 
    loadSessions, 
    tasks, 
    deleteTask, 
    setTasks, 
    toggleTaskCompletion, 
    loadTasks, 
    deleteSessionsByTaskId,
    // Current session info
    currentTask,
    selectedTaskId,
    isRunning,
    sessionType,
    time,
    sessionCount,
    settings
  } = usePomodoro()
  const pathname = usePathname()
  const breadcrumbs = useBreadcrumbs(pathname)
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalPomodoros: 0,
    avgPomodorosPerTask: 0
  })
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')

  // Load sessions and tasks when component mounts
  useEffect(() => {
    if (loadSessions) {
      console.log("📊 Analytics page loading sessions...");
      setSessionsLoading(true);
      loadSessions().finally(() => {
        setSessionsLoading(false);
      });
    }
    if (loadTasks) {
      console.log("📊 Analytics page loading tasks...");
      loadTasks();
    }
  }, [loadSessions, loadTasks])

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

  // Function to completely delete a task and its sessions
  const deleteTaskCompletely = async (taskId: number, taskName: string) => {
    try {
      console.log("🗑️ Completely deleting task:", taskName);
      
      // Delete associated sessions first
      await deleteSessionsByTaskId(taskId);
      
      // Then delete the task
      deleteTask(taskId);
      
      console.log("✅ Task and sessions deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting task completely:", error);
    }
  };

  // Function to clear all completed tasks and their sessions
  const clearAllCompletedTasks = async () => {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return;
    
    if (!window.confirm(`Delete ${completedTasks.length} completed tasks and all their session data?`)) {
      return;
    }
    
    try {
      console.log("🗑️ Clearing all completed tasks and sessions");
      
      // Delete sessions for all completed tasks
      await Promise.all(
        completedTasks.map(task => deleteSessionsByTaskId(task.id))
      );
      
      // Delete all completed tasks
      completedTasks.forEach(task => deleteTask(task.id));
      
      console.log("✅ All completed tasks and sessions cleared");
    } catch (error) {
      console.error("❌ Error clearing completed tasks:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Consistent header with settings page */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-between items-center p-6">
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
        </div>
        
        {/* Breadcrumb */}
        <div className="px-6 pb-4">
          <BreadcrumbNav items={breadcrumbs} />
        </div>
      </header>

      {/* Current Session Display */}
      {(currentTask || sessionType !== "work") && (
        <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Current Session</span>
                    <span className="text-xs text-gray-500">
                      {sessionCount}.{((sessionCount - 1) % settings.sessionsUntilLongBreak) + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-white font-medium">
                      {sessionType === "work" 
                        ? (currentTask || "[no task selected]")
                        : sessionType === "shortBreak" 
                        ? "[short break]"
                        : "[long break]"
                      }
                    </p>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300 font-mono text-sm">
                      {formatTime(time)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {isRunning ? "running" : "paused"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="px-3 py-1 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors text-sm"
                >
                  Go to Timer
                </Link>
                {sessionType === "work" && !currentTask && (
                  <Link
                    href="/tasks"
                    className="px-3 py-1 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors text-sm"
                  >
                    Select Task
                  </Link>
                )}
              </div>
            </div>
            
            {/* Task progress for work sessions */}
            {sessionType === "work" && selectedTaskId && (
              <div className="mt-3 ml-7">
                {(() => {
                  const currentTaskObj = tasks.find(task => task.id === selectedTaskId);
                  if (currentTaskObj) {
                    const progress = currentTaskObj.estimatedPomodoros > 0 
                      ? Math.min(currentTaskObj.actualPomodoros / currentTaskObj.estimatedPomodoros, 1)
                      : 0;
                    
                    return (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-yellow-500">🍅</span>
                        <span className="text-gray-400">
                          {currentTaskObj.actualPomodoros}
                          {currentTaskObj.estimatedPomodoros > 0 && `/${currentTaskObj.estimatedPomodoros}`}
                        </span>
                        {currentTaskObj.estimatedPomodoros > 0 && (
                          <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-400 transition-all duration-300"
                              style={{ width: `${Math.min(progress * 100, 100)}%` }}
                            />
                          </div>
                        )}
                        {currentTaskObj.actualPomodoros >= currentTaskObj.estimatedPomodoros && 
                         currentTaskObj.estimatedPomodoros > 0 && (
                          <span className="text-green-400 text-xs">Ready to complete!</span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

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

        {/* Task Management */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Trash2 className="text-red-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-100">Task Management</h2>
                <p className="text-gray-400 text-sm">Manage your tasks and clean up completed ones</p>
              </div>
            </div>
            {tasks.filter(t => t.completed).length > 0 && (
              <button 
                onClick={clearAllCompletedTasks}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
              >
                Clear Completed ({tasks.filter(t => t.completed).length})
              </button>
            )}
          </div>

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Target size={48} className="mx-auto mb-3 opacity-50" />
                <p>No tasks found</p>
                <p className="text-sm mt-1">Create tasks from the timer page to see them here</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="group flex items-center gap-4 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                  {/* Status indicator */}
                  <div className="flex items-center gap-2">
                    {task.completed ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ) : task.actualPomodoros > 0 ? (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    )}
                  </div>

                  {/* Task info */}
                  <div className="flex-1">
                    <div className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                      {task.name}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{task.actualPomodoros}/{task.estimatedPomodoros} sessions</span>
                      {task.completed && task.completedAt && (
                        <span>Completed {new Date(task.completedAt).toLocaleDateString()}</span>
                      )}
                      {task.actualPomodoros >= task.estimatedPomodoros && task.estimatedPomodoros > 0 && !task.completed && (
                        <span className="text-green-400 text-xs">Ready to complete</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="hidden md:block w-24">
                    {task.estimatedPomodoros > 0 && (
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            task.completed ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${Math.min((task.actualPomodoros / task.estimatedPomodoros) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!task.completed && task.actualPomodoros >= task.estimatedPomodoros && task.estimatedPomodoros > 0 && (
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                        title="Mark as complete"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete task "${task.name}" and all its session data?`)) {
                          deleteTaskCompletely(task.id, task.name);
                        }
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete task and session data"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          {tasks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700/30">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <span>{tasks.filter(t => !t.completed && t.actualPomodoros === 0).length} not started</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{tasks.filter(t => !t.completed && t.actualPomodoros > 0).length} in progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{tasks.filter(t => t.completed).length} completed</span>
                </div>
              </div>
            </div>
          )}
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
