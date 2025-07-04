"use client"
import { X } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { formatTime } from "@/lib/utils"
import Link from "next/link"
import { useEffect, useState } from "react"

/**
 * Enhanced Analytics page with daily view and minimalist design
 */
function AnalyticsPageContent() {
  const { 
    sessions, 
    dataLoading, 
    loadSessions, 
    tasks, 
    loadTasks,
    // Current session info
    currentTask,
    selectedTaskId,
    isRunning,
    sessionType,
    time,
    sessionCount,
    settings
  } = usePomodoro()
  const [sessionsLoading, setSessionsLoading] = useState(true)

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

  if (dataLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl font-light">Loading progress...</div>
      </div>
    )
  }

  // Calculate minimal progress data
  const calculateProgressData = () => {
    const today = new Date().toISOString().split('T')[0]
    
    // Today's data
    const todaySessions = (sessions || []).filter(s => s.date === today && !s.task.includes('Break'))
    const todayCompletedTasks = tasks.filter(t => 
      t.completed && t.completedAt && t.completedAt.split('T')[0] === today
    )
    
    // Calculate focus time (exclude breaks)
    const todayFocusTime = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0)
    
    // Calculate streak
    const calculateStreak = () => {
      const dates = [...new Set((sessions || [])
        .filter(s => !s.task.includes('Break'))
        .map(s => s.date)
      )].sort().reverse()
      
      let streak = 0
      const today = new Date().toISOString().split('T')[0]
      
      for (let i = 0; i < dates.length; i++) {
        const expectedDate = new Date()
        expectedDate.setDate(expectedDate.getDate() - i)
        const expectedDateStr = expectedDate.toISOString().split('T')[0]
        
        if (dates[i] === expectedDateStr) {
          streak++
        } else {
          break
        }
      }
      return streak
    }
    
    return {
      today: {
        sessions: todaySessions.length,
        hours: Math.round(todayFocusTime / 60 * 10) / 10,
        completed: todayCompletedTasks.length
      },
      streak: calculateStreak(),
      totalSessions: (sessions || []).filter(s => !s.task.includes('Break')).length,
      totalCompleted: tasks.filter(t => t.completed).length
    }
  }

  // Generate GitHub-style activity grid
  const generateActivityGrid = () => {
    const today = new Date()
    const grid = []
    
    // Generate last 12 weeks (84 days)
    for (let i = 83; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const daySessions = (sessions || []).filter(s => 
        s.date === dateStr && !s.task.includes('Break')
      )
      
      // Intensity levels: 0 (none), 1 (1-2), 2 (3-5), 3 (6-8), 4 (9+)
      let intensity = 0
      if (daySessions.length >= 9) intensity = 4
      else if (daySessions.length >= 6) intensity = 3
      else if (daySessions.length >= 3) intensity = 2
      else if (daySessions.length >= 1) intensity = 1
      
      grid.push({
        date: dateStr,
        count: daySessions.length,
        intensity,
        day: date.getDay(), // 0 = Sunday
        week: Math.floor(i / 7)
      })
    }
    
    return grid
  }

  // Generate accomplishment timeline
  const generateAccomplishmentTimeline = () => {
    const last7Days = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayTasks = tasks.filter(t => 
        t.completed && t.completedAt && t.completedAt.split('T')[0] === dateStr
      )
      
      const daySessions = (sessions || []).filter(s => 
        s.date === dateStr && !s.task.includes('Break')
      )
      
      if (dayTasks.length > 0 || daySessions.length > 0) {
        last7Days.push({
          date: dateStr,
          displayDate: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : 
                     date.toLocaleDateString('en-US', { weekday: 'long' }),
          completed: dayTasks,
          sessions: daySessions.length
        })
      }
    }
    
    return last7Days
  }

  // Get intensity color class
  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-gray-900'
      case 1: return 'bg-blue-900/40'
      case 2: return 'bg-blue-800/60'
      case 3: return 'bg-blue-700/80'
      case 4: return 'bg-blue-600'
      default: return 'bg-gray-900'
    }
  }

  const progressData = calculateProgressData()
  const activityGrid = generateActivityGrid()
  const timeline = generateAccomplishmentTimeline()

      return (
      <div className="min-h-screen bg-black text-white">
      {/* Minimal header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-900">
        <div>
          <h1 className="text-xl font-light">Progress</h1>
          <p className="text-gray-500 text-sm mt-1">Your focus journey</p>
        </div>
        <Link
          href="/"
          className="text-white p-2 hover:bg-gray-900 rounded transition-colors"
        >
          <X size={20} />
        </Link>
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

      <div className="max-w-4xl mx-auto p-6 space-y-12">
        
        {/* Daily Summary */}
        <section>
          <div className="grid grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-light text-white">{progressData.today.sessions}</div>
              <div className="text-gray-500 text-sm mt-1">sessions today</div>
            </div>
            <div>
              <div className="text-3xl font-light text-white">{progressData.today.hours}h</div>
              <div className="text-gray-500 text-sm mt-1">focus time</div>
            </div>
            <div>
              <div className="text-3xl font-light text-white">{progressData.today.completed}</div>
              <div className="text-gray-500 text-sm mt-1">completed</div>
            </div>
            <div>
              <div className="text-3xl font-light text-white">{progressData.streak}</div>
              <div className="text-gray-500 text-sm mt-1">day streak</div>
            </div>
          </div>
        </section>

        {/* Activity Grid */}
        <section>
          <h2 className="text-lg font-light text-gray-300 mb-6">Activity</h2>
          
          <div className="space-y-4">
            {/* Month labels */}
            <div className="flex text-xs text-gray-600 ml-8">
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - (83 - i * 7))
                return (
                  <div key={i} className="w-3 text-center" style={{ marginRight: '2px' }}>
                    {i % 4 === 0 ? date.toLocaleDateString('en-US', { month: 'short' }) : ''}
                  </div>
                )
              })}
            </div>
            
            {/* Grid */}
            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col text-xs text-gray-600 mr-2">
                <div className="h-3"></div>
                <div className="h-3 flex items-center">Mon</div>
                <div className="h-3"></div>
                <div className="h-3 flex items-center">Wed</div>
                <div className="h-3"></div>
                <div className="h-3 flex items-center">Fri</div>
                <div className="h-3"></div>
              </div>
              
              {/* Activity squares */}
              <div className="grid grid-rows-7 grid-flow-col gap-0.5">
                {activityGrid.map((day, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 ${getIntensityColor(day.intensity)} hover:ring-1 hover:ring-gray-500 transition-all`}
                    title={`${day.date}: ${day.count} sessions`}
                  />
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-end gap-2 text-xs text-gray-600">
              <span>Less</span>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-3 h-3 ${getIntensityColor(i)}`} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </section>

        {/* Accomplishment Timeline */}
        <section>
          <h2 className="text-lg font-light text-gray-300 mb-6">Recent accomplishments</h2>
          
          <div className="space-y-6">
            {timeline.map((day, index) => (
              <div key={day.date} className="space-y-3">
                <div className="flex items-center gap-4 text-gray-400">
                  <span className="text-sm font-medium">{day.displayDate}</span>
                  <div className="h-px bg-gray-800 flex-1"></div>
                  <span className="text-xs">{day.sessions} sessions</span>
                </div>
                
                {day.completed.length > 0 && (
                  <div className="space-y-2 ml-4">
                    {day.completed.map((task, taskIndex) => (
                      <div key={task.id} className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-green-500"></div>
                        <span className="text-gray-300">{task.name}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <span>{task.actualPomodoros}</span>
                          <span>/</span>
                          <span>{task.estimatedPomodoros}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {timeline.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              <div className="text-sm">No recent activity</div>
            </div>
          )}
        </section>

        {/* Weekly Summary */}
        <section>
          <h2 className="text-lg font-light text-gray-300 mb-6">This week</h2>
          
          <div className="space-y-4">
            {(() => {
              const thisWeek = (sessions || []).filter(s => {
                const sessionDate = new Date(s.date)
                const startOfWeek = new Date()
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
                return sessionDate >= startOfWeek && !s.task.includes('Break')
              })
              
              const weekCompleted = tasks.filter(t => {
                if (!t.completed || !t.completedAt) return false
                const completedDate = new Date(t.completedAt)
                const startOfWeek = new Date()
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
                return completedDate >= startOfWeek
              })
              
              return (
                <div className="grid grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-2xl font-light text-white">{thisWeek.length}</div>
                    <div className="text-gray-500 text-sm">sessions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-white">{weekCompleted.length}</div>
                    <div className="text-gray-500 text-sm">completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-white">
                      {Math.round(thisWeek.reduce((acc, s) => acc + (s.duration || 0), 0) / 60 * 10) / 10}h
                    </div>
                    <div className="text-gray-500 text-sm">focus time</div>
                  </div>
                </div>
              )
            })()}
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
