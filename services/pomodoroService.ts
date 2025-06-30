// Pomodoro Supabase Service Layer
// Handles all DB operations for tasks, sessions, settings
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Task, Session, Settings } from "@/contexts/PomodoroContext"

export const pomodoroService = {
  tasks: {
    async create(userId: string, name: string, position: number) {
      const supabase = getSupabaseClient()
      return supabase.from("tasks").insert({ user_id: userId, name, position }).select().single()
    },
    async update(userId: string, id: number, updates: Partial<Task>) {
      const supabase = getSupabaseClient()
      return supabase.from("tasks").update(updates).eq("id", id).eq("user_id", userId)
    },
    async delete(userId: string, id: number) {
      const supabase = getSupabaseClient()
      return supabase.from("tasks").delete().eq("id", id).eq("user_id", userId)
    },
    async list(userId: string) {
      const supabase = getSupabaseClient()
      return supabase.from("tasks").select("*").eq("user_id", userId).order("position", { ascending: true })
    },
  },
  sessions: {
    async create(userId: string, session: Omit<Session, "completedAt" | "date"> & { date: string }) {
      const supabase = getSupabaseClient()
      return supabase.from("sessions").insert({ user_id: userId, ...session })
    },
    async list(userId: string, limit = 100) {
      const supabase = getSupabaseClient()
      return supabase.from("sessions").select("*").eq("user_id", userId).order("completed_at", { ascending: false }).limit(limit)
    },
  },
  settings: {
    async get(userId: string) {
      const supabase = getSupabaseClient()
      return supabase.from("settings").select("*").eq("user_id", userId).single()
    },
    async upsert(userId: string, settings: Settings) {
      const supabase = getSupabaseClient()
      const settingsData = {
        user_id: userId,
        work_duration: settings.workDuration,
        break_duration: settings.breakDuration,
        long_break_duration: settings.longBreakDuration,
        sessions_until_long_break: settings.sessionsUntilLongBreak,
        sound_enabled: settings.soundEnabled,
        sound_volume: settings.soundVolume,
        auto_start_breaks: settings.autoStartBreaks,
        auto_start_work: settings.autoStartWork,
        timer_display_mode: settings.timerDisplayMode,
      }
      // Try update, if not exists, insert
      const { data: existing } = await supabase.from("settings").select("user_id").eq("user_id", userId).single()
      if (existing) {
        return supabase.from("settings").update(settingsData).eq("user_id", userId)
      } else {
        return supabase.from("settings").insert(settingsData)
      }
    },
  },
}
