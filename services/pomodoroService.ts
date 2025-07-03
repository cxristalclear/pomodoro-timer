// Enhanced services/pomodoroService.ts
// Now supports all the enhanced database fields that are already in your schema

import { getSupabaseClient } from "@/lib/supabase/client"
import type { Task, Session, Settings, TaskFilters, BulkTaskUpdate } from "@/contexts/PomodoroContext"

export const pomodoroService = {
  tasks: {
    // Enhanced create method with all new fields
    async create(
      userId: string, 
      taskData: {
        name: string
        position: number
        estimatedPomodoros?: number
        category?: string
        priority?: string
        dueDate?: string
        notes?: string
        parentTaskId?: number
      }
    ) {
      const supabase = getSupabaseClient()
      console.log("Creating task with enhanced data:", taskData)
      
      const insertData = { 
        user_id: userId, 
        name: taskData.name,
        position: taskData.position,
        estimated_pomodoros: taskData.estimatedPomodoros || 1,
        actual_pomodoros: 0,
        category: taskData.category || null,
        priority: taskData.priority || null,
        due_date: taskData.dueDate || null,
        notes: taskData.notes || null,
        parent_task_id: taskData.parentTaskId || null,
        is_archived: false
      }
      
      const result = await supabase.from("tasks").insert(insertData).select().single()
      
      if (result.error) {
        console.error("Enhanced task creation error:", result.error)
      }
      
      return result
    },

    // Enhanced update method 
    async update(userId: string, id: number, updates: Partial<Task>) {
      const supabase = getSupabaseClient()
      
      // Convert camelCase to snake_case for database
      const dbUpdates: any = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed
      if (updates.position !== undefined) dbUpdates.position = updates.position
      if (updates.estimatedPomodoros !== undefined) dbUpdates.estimated_pomodoros = updates.estimatedPomodoros
      if (updates.actualPomodoros !== undefined) dbUpdates.actual_pomodoros = updates.actualPomodoros
      if (updates.category !== undefined) dbUpdates.category = updates.category
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes
      if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived
      if (updates.parentTaskId !== undefined) dbUpdates.parent_task_id = updates.parentTaskId
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt
      
      return supabase.from("tasks").update(dbUpdates).eq("id", id).eq("user_id", userId)
    },

    // Enhanced bulk update method
    async bulkUpdate(userId: string, taskIds: number[], updates: Partial<Task>) {
      const supabase = getSupabaseClient()
      
      // Convert updates to database format
      const dbUpdates: any = {}
      if (updates.category !== undefined) dbUpdates.category = updates.category
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority
      if (updates.completed !== undefined) {
        dbUpdates.completed = updates.completed
        dbUpdates.completed_at = updates.completed ? new Date().toISOString() : null
      }
      if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes
      
      return supabase
        .from("tasks")
        .update(dbUpdates)
        .in("id", taskIds)
        .eq("user_id", userId)
    },

    async delete(userId: string, id: number) {
      const supabase = getSupabaseClient()
      return supabase.from("tasks").delete().eq("id", id).eq("user_id", userId)
    },

    // Enhanced list method with filtering
    async list(userId: string, filters?: TaskFilters) {
      const supabase = getSupabaseClient()
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("position", { ascending: true })

      // Apply filters
      if (filters) {
        if (filters.category) {
          query = query.eq("category", filters.category)
        }
        if (filters.priority) {
          query = query.eq("priority", filters.priority)
        }
        if (filters.archived !== undefined) {
          query = query.eq("is_archived", filters.archived)
        }
        if (filters.completed !== undefined) {
          query = query.eq("completed", filters.completed)
        }
        if (filters.parentTaskId !== undefined) {
          query = query.eq("parent_task_id", filters.parentTaskId)
        }
        if (filters.dueDateFrom) {
          query = query.gte("due_date", filters.dueDateFrom)
        }
        if (filters.dueDateTo) {
          query = query.lte("due_date", filters.dueDateTo)
        }
        if (filters.searchQuery) {
          query = query.ilike("name", `%${filters.searchQuery}%`)
        }
      }

      const result = await query
      
      // Convert snake_case to camelCase for frontend
      if (result.data) {
        result.data = result.data.map(task => ({
          id: task.id,
          name: task.name,
          completed: task.completed,
          position: task.position,
          estimatedPomodoros: task.estimated_pomodoros,
          actualPomodoros: task.actual_pomodoros,
          createdAt: task.created_at,
          completedAt: task.completed_at,
          category: task.category,
          priority: task.priority,
          dueDate: task.due_date,
          notes: task.notes,
          isArchived: task.is_archived,
          parentTaskId: task.parent_task_id
        }))
      }
      
      return result
    },

    // Archive/unarchive methods
    async archive(userId: string, taskId: number) {
      const supabase = getSupabaseClient()
      return supabase.from("tasks").update({ is_archived: true }).eq("id", taskId).eq("user_id", userId)
    },

    async unarchive(userId: string, taskId: number) {
      const supabase = getSupabaseClient()
      return supabase.from("tasks").update({ is_archived: false }).eq("id", taskId).eq("user_id", userId)
    },

    // Get available categories
    async getCategories(userId: string) {
      const supabase = getSupabaseClient()
      const result = await supabase
        .from("tasks")
        .select("category")
        .eq("user_id", userId)
        .not("category", "is", null)
        
      if (result.data) {
        const uniqueCategories = [...new Set(result.data.map(item => item.category))]
        return { data: uniqueCategories, error: null }
      }
      
      return result
    },

    // Get subtasks
    async getSubtasks(userId: string, parentId: number) {
      const supabase = getSupabaseClient()
      return supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("parent_task_id", parentId)
        .order("position", { ascending: true })
    },

    // Existing methods (keeping them as-is)
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
      
      // Get current task state
      const { data: task, error: fetchError } = await supabase
        .from("tasks")
        .select("completed")
        .eq("id", taskId)
        .eq("user_id", userId)
        .single()

      if (fetchError || !task) return { error: fetchError }

      // Toggle completion
      const newCompleted = !task.completed
      return supabase.from("tasks").update({ 
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      }).eq("id", taskId).eq("user_id", userId)
    },

    async incrementPomodoros(taskId: number) {
      const supabase = getSupabaseClient()
      return supabase.rpc('increment_pomodoros', { task_id_param: taskId })
    },

    async getTaskStats(userId: string) {
      const supabase = getSupabaseClient()
      const result = await supabase.rpc('get_average_pomodoros_per_task', { 
        user_id_param: userId 
      })
      
      if (result.data && result.data.length > 0) {
        return result.data[0]
      }
      
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalPomodoros: 0,
        avgPomodorosPerTask: 0
      }
    },

    async getTaskProgress(userId: string) {
      const supabase = getSupabaseClient()
      const { data: allTasks } = await supabase.from("tasks").select("*").eq("user_id", userId)
      const { data: todayCompleted } = await supabase.from("tasks").select("*")
        .eq("user_id", userId)
        .eq("completed", true)
        .gte("completed_at", new Date().toISOString().split('T')[0])

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
        notifications_enabled: settings.notificationsEnabled,
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
      }
      
      return result
    },
  },
}
