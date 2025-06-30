// Session tracking hook for Pomodoro
import { useState } from "react"
import type { Session } from "@/contexts/PomodoroContext"
import { pomodoroService } from "@/services/pomodoroService"

export function useSessions(userId: string | undefined) {
  const [sessions, setSessions] = useState<Session[]>([])
  // Load sessions from DB
  const loadSessions = async (limit = 100) => {
    if (!userId) return
    const { data, error } = await pomodoroService.sessions.list(userId, limit)
    if (data && !error) {
      setSessions(
        data.map((s: any) => ({
          task: s.task,
          duration: s.duration,
          completedAt: s.completed_at,
          date: s.date,
        }))
      )
    }
  }

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

  // Session stats utilities (example: getSessionsByDate, getTodaysFocusTime, getSessionStats)
  const getSessionsByDate = (date: string) => sessions.filter((s) => s.date === date)
  const getTodaysFocusTime = () => {
    const today = new Date().toLocaleDateString()
    return sessions.filter((s) => s.date === today && s.task !== "Short Break" && s.task !== "Long Break").reduce((acc, s) => acc + (s.duration || 0), 0)
  }
  const getSessionStats = () => {
    return {
      total: sessions.length,
      workSessions: sessions.filter((s) => s.task !== "Short Break" && s.task !== "Long Break").length,
      breakSessions: sessions.filter((s) => s.task === "Short Break" || s.task === "Long Break").length,
    }
  }

  return {
    sessions,
    setSessions,
    loadSessions,
    addSession,
    getSessionsByDate,
    getTodaysFocusTime,
    getSessionStats,
  }
}
