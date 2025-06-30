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
    const { data, error } = await pomodoroService.tasks.list(userId)
    if (data && !error) {
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
  }, [userId])

  // Add a new task
  const addTask = useCallback(async () => {
    if (newTaskInput.trim() && userId) {
      const { data, error } = await pomodoroService.tasks.create(userId, newTaskInput.trim(), tasks.length)
      if (data && !error) {
        const newTask: Task = {
          id: data.id,
          name: data.name,
          completed: false,
          createdAt: data.created_at,
        }
        setTasks((prev) => [...prev, newTask])
        setNewTaskInput("")
      }
    }
  }, [newTaskInput, userId, tasks.length])

  // Delete a task
  const deleteTask = useCallback(async (taskId: number) => {
    if (userId) {
      await pomodoroService.tasks.delete(userId, taskId)
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    }
  }, [userId])

  // Update task order
  const updateTaskOrder = useCallback(async (newTasks: Task[]) => {
    setTasks(newTasks)
    if (userId) {
      for (const [index, task] of newTasks.entries()) {
        // Use 'any' to allow position property for update
        await pomodoroService.tasks.update(userId, task.id, { position: index } as any)
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
  const setTasksForContext = (tasksOrUpdater: Task[] | ((prev: Task[]) => Task[])) => {
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
  }
  return {
    tasks,
    setTasks: setTasksForContext,
    newTaskInput,
    setNewTaskInput,
    addTask,
    deleteTask,
    selectTask,
    currentTask,
    selectedTaskId,
    loadTasks,
  }
}
