// Task management hook for Pomodoro
import { useState, useCallback } from "react"
import type { Task } from "@/contexts/PomodoroContext"
import { pomodoroService } from "@/services/pomodoroService"

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskInput, setNewTaskInput] = useState("")

  // Load tasks from DB
  const loadTasks = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await pomodoroService.tasks.list(userId)
      if (error) {
        console.error("Error loading tasks:", error)
        return
      }
      if (data) {
        setTasks(
          data.map((t: any) => ({
            id: t.id,
            name: t.name,
            completed: t.completed,
            createdAt: t.created_at,
            completedAt: t.completed_at,
          }))
        )
      }
    } catch (error) {
      console.error("Error loading tasks:", error)
    }
  }, [userId])

  // Add a new task
  const addTask = useCallback(async () => {
    if (newTaskInput.trim() && userId) {
      try {
        const { data, error } = await pomodoroService.tasks.create(userId, newTaskInput.trim(), tasks.length)
        if (error) {
          console.error("Error adding task:", error)
          return
        }
        if (data) {
          const newTask: Task = {
            id: data.id,
            name: data.name,
            completed: false,
            createdAt: data.created_at,
          }
          setTasks((prev) => [...prev, newTask])
          setNewTaskInput("")
        }
      } catch (error) {
        console.error("Error adding task:", error)
      }
    }
  }, [newTaskInput, userId, tasks.length])

  // Delete a task
  const deleteTask = useCallback(async (taskId: number) => {
    if (userId) {
      try {
        const { error } = await pomodoroService.tasks.delete(userId, taskId)
        if (error) {
          console.error("Error deleting task:", error)
          return
        }
        setTasks((prev) => prev.filter((task) => task.id !== taskId))
      } catch (error) {
        console.error("Error deleting task:", error)
      }
    }
  }, [userId])

  // Toggle task completion
  const toggleTaskCompletion = useCallback(async (taskId: number) => {
    if (userId) {
      try {
        const currentTask = tasks.find(task => task.id === taskId)
        if (!currentTask) return

        const newCompletedState = !currentTask.completed
        const completedAt = newCompletedState ? new Date().toISOString() : undefined

        const { error } = await pomodoroService.tasks.update(userId, taskId, {
          completed: newCompletedState,
          completed_at: completedAt
        } as any)

        if (error) {
          console.error("Error updating task completion:", error)
          return
        }

        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, completed: newCompletedState, completedAt }
              : task
          )
        )
      } catch (error) {
        console.error("Error updating task completion:", error)
      }
    }
  }, [userId, tasks])

  // Update task
  const updateTask = useCallback(async (taskId: number, updates: Partial<Task>) => {
    if (userId) {
      try {
        const { error } = await pomodoroService.tasks.update(userId, taskId, updates)
        if (error) {
          console.error("Error updating task:", error)
          return
        }

        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, ...updates }
              : task
          )
        )
      } catch (error) {
        console.error("Error updating task:", error)
      }
    }
  }, [userId])

  // Update task order
  const updateTaskOrder = useCallback(async (newTasks: Task[]) => {
    setTasks(newTasks)
    if (userId) {
      try {
        for (const [index, task] of newTasks.entries()) {
          // Use 'any' to allow position property for update
          const { error } = await pomodoroService.tasks.update(userId, task.id, { position: index } as any)
          if (error) {
            console.error("Error updating task order:", error)
          }
        }
      } catch (error) {
        console.error("Error updating task order:", error)
      }
    }
  }, [userId])

  // Select a task (UI logic, not DB)
  const [currentTask, setCurrentTask] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const selectTask = useCallback((task: Task) => {
    setCurrentTask(task.name)
    setSelectedTaskId(task.id)
  }, [])

  // setTasks for context: allow both array and updater function, but always call updateTaskOrder
  const setTasksForContext = useCallback((tasksOrUpdater: Task[] | ((prev: Task[]) => Task[])) => {
    if (typeof tasksOrUpdater === "function") {
      // updater function
      setTasks((prev) => {
        const next = (tasksOrUpdater as (prev: Task[]) => Task[])(prev)
        updateTaskOrder(next)
        return next
      })
    } else {
      setTasks(tasksOrUpdater)
      updateTaskOrder(tasksOrUpdater)
    }
  }, [updateTaskOrder])

  return {
    tasks,
    setTasks: setTasksForContext,
    newTaskInput,
    setNewTaskInput,
    addTask,
    deleteTask,
    toggleTaskCompletion,
    selectTask,
    currentTask,
    selectedTaskId,
    loadTasks,
    updateTask,
  }
}
