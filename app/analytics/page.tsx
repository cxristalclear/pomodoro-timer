"use client"
import { X } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { formatTime } from "@/lib/utils"
import Link from "next/link"
import { useEffect, useState } from "react"

/**
 * Enhanced Analytics page with multiple view modes and completion tracking
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
  
  // Step 1: Add view switching state
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

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

  // Step 3: Session completion tracking helper
  const calculateCompletionRate = (daySessions: any[]) => {
    if (daySessions.length === 0) return 0
    
    // Find sessions with associated completed tasks
    const completedSessions = daySessions.filter(session => {
      if (session.task_id) {
        const task = tasks.find(t => t.id === session.task_id)
        return task && task.completed
      }
      return false
    })
    
    return completedSessions.length / daySessions.length
  }

  // Step 2: Generate GitHub-style activity grid (month view)
  const generateCalendarGrid = () => {
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
      
      const completionRate = calculateCompletionRate(daySessions)
      
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
        completionRate,
        focusTime: daySessions.reduce((acc, s) => acc + (s.duration || 0), 0),
        day: date.getDay(), // 0 = Sunday
        week: Math.floor(i / 7)
      })
    }
    
    return grid
  }

  // Step 2: Generate weekly hourly grid (week view)
  const generateWeeklyHourlyGrid = () => {
    const today = new Date()
    const grid = []
    
    // Generate this week (7 days × 24 hours)
    for (let day = 0; day < 7; day++) {
      const date = new Date()
      date.setDate(today.getDate() - today.getDay() + day) // Start from Sunday
      const dateStr = date.toISOString().split('T')[0]
      
      for (let hour = 0; hour < 24; hour++) {
        const hourSessions = (sessions || []).filter(s => {
          if (s.date !== dateStr || s.task.includes('Break')) return false
          
          // Check if session falls within this hour
          if (s.completedAt) {
            const sessionTime = new Date(s.completedAt)
            return sessionTime.getHours() === hour
          }
          return false
        })
        
        const completionRate = calculateCompletionRate(hourSessions)
        
        let intensity = 0
        if (hourSessions.length >= 3) intensity = 4
        else if (hourSessions.length >= 2) intensity = 3
        else if (hourSessions.length >= 1) intensity = 2
        
        grid.push({
          date: dateStr,
          hour,
          count: hourSessions.length,
          intensity,
          completionRate,
          focusTime: hourSessions.reduce((acc, s) => acc + (s.duration || 0), 0),
          day: date.getDay()
        })
      }
    }
    
    return grid
  }

  // Step 2: Generate daily timeline grid (day view)
  const generateDailyTimelineGrid = () => {
    const today = new Date().toISOString().split('T')[0]
    const grid = []
    
    // Generate 24 hours for today
    for (let hour = 0; hour < 24; hour++) {
      const hourSessions = (sessions || []).filter(s => {
        if (s.date !== today || s.task.includes('Break')) return false
        
        if (s.completedAt) {
          const sessionTime = new Date(s.completedAt)
          return sessionTime.getHours() === hour
        }
        return false
      })
      
      const completionRate = calculateCompletionRate(hourSessions)
      
      grid.push({
        hour,
        count: hourSessions.length,
        completionRate,
        focusTime: hourSessions.reduce((acc, s) => acc + (s.duration || 0), 0),
        sessions: hourSessions
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

  // Step 4: Enhanced intensity color with completion rate
  const getIntensityColor = (intensity: number, completionRate: number = 0) => {
    if (intensity === 0) return 'bg-gray-900'
    
    // Base color based on intensity
    let baseColor = ''
    switch (intensity) {
      case 1: baseColor = 'bg-blue-900/40'; break
      case 2: baseColor = 'bg-blue-800/60'; break
      case 3: baseColor = 'bg-blue-700/80'; break
      case 4: baseColor = 'bg-blue-600'; break
      default: baseColor = 'bg-gray-900'
    }
    
    // Add completion indicator as border
    const completionBorder = completionRate > 0.8 ? 'ring-1 ring-green-400/50' :
                           completionRate > 0.5 ? 'ring-1 ring-yellow-400/50' :
                           completionRate > 0 ? 'ring-1 ring-red-400/50' : ''
    
    return `${baseColor} ${completionBorder}`
  }

  // Step 5: Enhanced tooltip content
  const getTooltipContent = (data: any, mode: string) => {
    if (mode === 'month') {
      const focusHours = Math.round(data.focusTime / 60 * 10) / 10
      const completionPercentage = Math.round(data.completionRate * 100)
      return `${data.date}: ${data.count} sessions, ${focusHours}h focus${data.completionRate > 0 ? `, ${completionPercentage}% completion` : ''}`
    } else if (mode === 'week') {
      const focusHours = Math.round(data.focusTime / 60 * 10) / 10
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][data.day]
      const hourDisplay = data.hour === 0 ? '12 AM' : data.hour < 12 ? `${data.hour} AM` : data.hour === 12 ? '12 PM' : `${data.hour - 12} PM`
      return `${dayName} ${hourDisplay}: ${data.count} sessions${focusHours > 0 ? `, ${focusHours}h focus` : ''}`
    } else {
      const hourDisplay = data.hour === 0 ? '12:00 AM' : data.hour < 12 ? `${data.hour}:00 AM` : data.hour === 12 ? '12:00 PM' : `${data.hour - 12}:00 PM`
      const nextHour = data.hour === 23 ? '12:00 AM' : data.hour === 11 ? '12:00 PM' : data.hour < 11 ? `${data.hour + 1}:00 AM` : `${data.hour - 11}:00 PM`
      const focusMinutes = Math.round(data.focusTime)
      return `${hourDisplay}-${nextHour}: ${data.count} sessions${focusMinutes > 0 ? ` (${focusMinutes} min)` : ''}`
    }
  }

  const progressData = calculateProgressData()
  const calendarGrid = generateCalendarGrid()
  const weeklyGrid = generateWeeklyHourlyGrid()
  const dailyGrid = generateDailyTimelineGrid()
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

        {/* Activity Grid with View Switching */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light text-gray-300">Activity</h2>
            
            {/* Step 1: View toggle buttons */}
            <div className="flex items-center gap-1">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm transition-colors ${
                    viewMode === mode
                      ? 'text-blue-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Step 4: Enhanced grid rendering based on view mode */}
          <div className="space-y-4">
            {viewMode === 'month' && (
              <>
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
                    {calendarGrid.map((day, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 ${getIntensityColor(day.intensity, day.completionRate)} hover:ring-1 hover:ring-gray-500 transition-all cursor-pointer`}
                        title={getTooltipContent(day, 'month')}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {viewMode === 'week' && (
              <>
                {/* Day labels for week view */}
                <div className="flex text-xs text-gray-600 ml-8">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={i} className="w-8 text-center">{day}</div>
                  ))}
                </div>
                
                {/* Hour labels and grid */}
                <div className="flex">
                  <div className="flex flex-col text-xs text-gray-600 mr-2 w-6">
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div key={hour} className="h-2 flex items-center text-right pr-1">
                        {hour % 6 === 0 ? (hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`) : ''}
                      </div>
                    ))}
                  </div>
                  
                  {/* Weekly grid */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: 7 }, (_, day) => (
                      <div key={day} className="flex flex-col gap-0.5">
                        {Array.from({ length: 24 }, (_, hour) => {
                          const gridItem = weeklyGrid.find(item => item.day === day && item.hour === hour)
                          return (
                            <div
                              key={hour}
                              className={`w-8 h-2 ${gridItem ? getIntensityColor(gridItem.intensity, gridItem.completionRate) : 'bg-gray-900'} hover:ring-1 hover:ring-gray-500 transition-all cursor-pointer`}
                              title={gridItem ? getTooltipContent(gridItem, 'week') : ''}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {viewMode === 'day' && (
              <div className="space-y-4">
                <div className="text-sm text-gray-400 mb-4">Today's Timeline</div>
                
                {/* Horizontal timeline */}
                <div className="space-y-2">
                  {dailyGrid.map((hourData, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-16 text-xs text-gray-600 text-right">
                        {hourData.hour === 0 ? '12 AM' : hourData.hour < 12 ? `${hourData.hour} AM` : hourData.hour === 12 ? '12 PM' : `${hourData.hour - 12} PM`}
                      </div>
                      <div className="flex-1 relative">
                        {hourData.count > 0 ? (
                          <div
                            className={`h-6 ${getIntensityColor(hourData.count > 0 ? 2 : 0, hourData.completionRate)} rounded cursor-pointer flex items-center px-2`}
                            title={getTooltipContent(hourData, 'day')}
                            style={{ width: `${Math.min(hourData.focusTime / 60 * 100, 100)}%` }}
                          >
                            <span className="text-xs text-white">{hourData.count} sessions</span>
                          </div>
                        ) : (
                          <div className="h-6 bg-gray-900 rounded opacity-30"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
