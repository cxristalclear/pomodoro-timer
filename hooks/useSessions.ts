// Session tracking hook for Pomodoro
import { useState, useCallback } from "react"
import type { Session } from "@/contexts/PomodoroContext"
import { pomodoroService } from "@/services/pomodoroService"

export function useSessions(userId: string | undefined) {
  const [sessions, setSessions] = useState<Session[]>([])
  
  // Load sessions from DB
  const loadSessions = useCallback(async (limit = 100) => {
    if (!userId) return
    const { data, error } = await pomodoroService.sessions.list(userId, limit)
    if (data && !error) {
      setSessions(
        data.map((s: any) => ({
          task: s.task,
          taskId: s.task_id,
          duration: s.duration,
          completedAt: s.completed_at,
          date: s.date,
        }))
      )
    }
  }, [userId])

  // Add a session
  const addSession = async (session: Omit<Session, "completedAt"> & { date: string }) => {
    if (!userId) return
    await pomodoroService.sessions.create(userId, session)
    // Optionally reload sessions or push to state
    setSessions((prev) => [
      { ...session, completedAt: new Date().toISOString() },
      ...prev,
    ])
  }

  // Save completed session with task tracking
  const saveCompletedSession = useCallback(async (taskId: number | null, taskName: string, duration: number) => {
    if (!userId) {
      console.error("❌ Cannot save session: No userId");
      return;
    }
    
    console.log("💾 Saving completed session:", {
      taskId,
      taskName,
      duration,
      userId
    });
    
    try {
      const { error } = await pomodoroService.sessions.saveCompletedSession(userId, taskId, taskName, duration)
      if (error) {
        console.error("❌ Error saving completed session:", error)
        return
      }
      
      console.log("✅ Session saved successfully to database");
      
      // Add to local state
      const today = new Date().toISOString().split('T')[0]
      const newSession: Session = {
        task: taskName,
        taskId: taskId || undefined,
        duration: duration,
        completedAt: new Date().toISOString(),
        date: today
      }
      
      console.log("📝 Adding session to local state:", newSession);
      
      setSessions((prev) => [newSession, ...prev])
      
      console.log("✅ Session added to local state successfully");
    } catch (error) {
      console.error("❌ Error saving completed session:", error)
    }
  }, [userId])

  // Session stats utilities
  const getSessionsByDate = (date: string) => sessions.filter((s) => s.date === date)
  
  const getTodaysFocusTime = () => {
    const today = new Date().toLocaleDateString()
    return sessions
      .filter((s) => s.date === today && s.task !== "Short Break" && s.task !== "Long Break")
      .reduce((acc, s) => acc + (s.duration || 0), 0)
  }
  
  const getSessionStats = () => {
    return {
      total: sessions.length,
      workSessions: sessions.filter((s) => s.task !== "Short Break" && s.task !== "Long Break").length,
      breakSessions: sessions.filter((s) => s.task === "Short Break" || s.task === "Long Break").length,
    }
  }

  // Get sessions for a specific task
  const getSessionsForTask = useCallback((taskId: number) => {
    return sessions.filter(s => s.taskId === taskId)
  }, [sessions])

  // Get total pomodoros for a task
  const getTaskPomodoros = useCallback((taskId: number) => {
    return sessions
      .filter(s => s.taskId === taskId && s.task !== "Short Break" && s.task !== "Long Break")
      .length
  }, [sessions])

  return {
    sessions,
    setSessions,
    loadSessions,
    addSession,
    saveCompletedSession,
    getSessionsByDate,
    getTodaysFocusTime,
    getSessionStats,
    getSessionsForTask,
    getTaskPomodoros,
  }
}
