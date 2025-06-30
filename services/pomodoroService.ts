// Pomodoro Supabase Service Layer
// Handles all DB operations for tasks, sessions, settings
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Task, Session, Settings } from "@/contexts/PomodoroContext"

export const pomodoroService = {
  tasks: {
    async create(userId: string, name: string, position: number, estimatedPomodoros: number = 1) {
      const supabase = getSupabaseClient()
      console.log("Creating task with data:", { userId, name, position, estimatedPomodoros })
      
      // Try with new schema first
      const insertData = { 
        user_id: userId, 
        name, 
        position,
        estimated_pomodoros: estimatedPomodoros,
        actual_pomodoros: 0
      }
      
      console.log("Insert data:", insertData)
      
      let result = await supabase.from("tasks").insert(insertData).select().single()
      
      console.log("Task creation result:", result)
      
      // If new schema fails, try with old schema
      if (result.error && result.error.message?.includes('column "estimated_pomodoros" does not exist')) {
        console.log("New schema not available, trying old schema...")
        const oldInsertData = { 
          user_id: userId, 
          name, 
          position
        }
        result = await supabase.from("tasks").insert(oldInsertData).select().single()
        console.log("Old schema task creation result:", result)
      }
      
      if (result.error) {
        console.error("Task creation error:", result.error)
        console.error("Error details:", result.error.details)
        console.error("Error hint:", result.error.hint)
      }
      
      return result
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
    async completeTask(userId: string, taskId: number) {
      const supabase = getSupabaseClient()
      return supabase.from("tasks").update({ 
        completed: true,
        completed_at: new Date().toISOString()
      }).eq("id", taskId).eq("user_id", userId)
    },
    async uncompleteTask(userId: string, taskId: number) {
      const supabase = getSupabaseClient()
      return supabase.from("tasks").update({ 
        completed: false,
        completed_at: null
      }).eq("id", taskId).eq("user_id", userId)
    },
    async toggleTaskCompletion(userId: string, taskId: number) {
      const supabase = getSupabaseClient()
      // First get current state
      const { data: task } = await supabase
        .from("tasks")
        .select("completed")
        .eq("id", taskId)
        .eq("user_id", userId)
        .single()

      if (!task) throw new Error("Task not found")

      if (!task.completed) {
        return this.completeTask(userId, taskId)
      } else {
        return this.uncompleteTask(userId, taskId)
      }
    },
    async incrementPomodoros(taskId: number) {
      const supabase = getSupabaseClient()
      return supabase.rpc("increment_pomodoros", { task_id_param: taskId })
    },
    async getTaskStats(userId: string) {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc("get_average_pomodoros_per_task", { 
        user_id_param: userId 
      })
      
      if (error) throw error
      
      const stats = data?.[0] || {
        total_tasks: 0,
        completed_tasks: 0,
        total_pomodoros: 0,
        avg_pomodoros_per_task: 0
      }
      
      return {
        totalTasks: Number(stats.total_tasks),
        completedTasks: Number(stats.completed_tasks),
        totalPomodoros: Number(stats.total_pomodoros),
        avgPomodorosPerTask: Number(stats.avg_pomodoros_per_task)
      }
    },
    async getCompletionStats(userId: string) {
      const supabase = getSupabaseClient()
      const today = new Date().toISOString().split('T')[0]
      
      // Tasks completed today
      const { data: todayCompleted } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", true)
        .gte("completed_at", today)

      // All tasks for completion rate
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("completed")
        .eq("user_id", userId)

      const completionRate = allTasks && allTasks.length > 0 
        ? allTasks.filter(t => t.completed).length / allTasks.length 
        : 0

      return { 
        todayCompleted: todayCompleted || [], 
        completionRate 
      }
    }
  },
  sessions: {
    async create(userId: string, session: Omit<Session, "completedAt" | "date"> & { date: string }) {
      const supabase = getSupabaseClient()
      return supabase.from("sessions").insert({ 
        user_id: userId, 
        task_id: session.taskId || null,
        task: session.task,
        duration: session.duration,
        date: session.date
      })
    },
    async list(userId: string, limit = 100) {
      const supabase = getSupabaseClient()
      return supabase.from("sessions").select("*").eq("user_id", userId).order("completed_at", { ascending: false }).limit(limit)
    },
    async saveCompletedSession(userId: string, taskId: number | null, taskName: string, duration: number) {
      const supabase = getSupabaseClient()
      const today = new Date().toISOString().split('T')[0]
      
      return supabase.from("sessions").insert({
        user_id: userId,
        task_id: taskId,
        task: taskName,
        duration: duration,
        date: today,
        completed_at: new Date().toISOString()
      })
    }
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
      
      console.log("Upserting settings:", settingsData)
      
      // Try update, if not exists, insert
      const { data: existing } = await supabase.from("settings").select("user_id").eq("user_id", userId).single()
      let result
      if (existing) {
        result = await supabase.from("settings").update(settingsData).eq("user_id", userId)
      } else {
        result = await supabase.from("settings").insert(settingsData)
      }
      
      if (result.error) {
        console.error("Settings upsert error:", result.error)
        console.error("Error details:", result.error.details)
        console.error("Error hint:", result.error.hint)
      }
      
      return result
    },
  },
}
