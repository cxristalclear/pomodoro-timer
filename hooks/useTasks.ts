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
        console.log("Loaded tasks from DB:", data)
        // The enhanced service layer already converts snake_case to camelCase
        setTasks(data)
      }
    } catch (error) {
      console.error("Error loading tasks:", error)
    }
  }, [userId])

  // Add a new task
  const addTask = useCallback(async () => {
    if (newTaskInput.trim() && userId) {
      console.log("Adding task:", { newTaskInput: newTaskInput.trim(), userId, tasksLength: tasks.length })
      try {
        // Use the new enhanced service layer signature
        const { data, error } = await pomodoroService.tasks.create(userId, {
          name: newTaskInput.trim(),
          position: tasks.length,
          estimatedPomodoros: 1
        })
        console.log("Add task response:", { data, error })
        if (error) {
          console.error("Error adding task:", error)
          console.error("Error details:", error.details)
          console.error("Error hint:", error.hint)
          return
        }
        if (data) {
          console.log("Task created successfully:", data)
          const newTask: Task = {
            id: data.id,
            name: data.name,
            completed: data.completed || false,
            position: data.position,
            estimatedPomodoros: data.estimated_pomodoros || 1,
            actualPomodoros: data.actual_pomodoros || 0,
            createdAt: data.created_at,
            completedAt: data.completed_at,
            category: data.category,
            priority: data.priority,
            dueDate: data.due_date,
            notes: data.notes,
            isArchived: data.is_archived || false,
            parentTaskId: data.parent_task_id
          }
          console.log("New task object:", newTask)
          setTasks((prev) => [...prev, newTask])
          setNewTaskInput("")
        }
      } catch (error) {
        console.error("Exception adding task:", error)
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

  // Toggle task completion with proper validation
  const toggleTaskCompletion = useCallback(async (taskId: number) => {
    if (userId) {
      try {
        const currentTask = tasks.find(task => task.id === taskId)
        if (!currentTask) return

        // Validate before completing
        if (!currentTask.completed && (!currentTask.name || currentTask.name.trim() === '')) {
          throw new Error('Task must have a name before completing')
        }

        const { error } = await pomodoroService.tasks.toggleTaskCompletion(userId, taskId)
        if (error) {
          console.error("Error updating task completion:", error)
          return
        }

        // Update local state
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { 
                  ...task, 
                  completed: !task.completed, 
                  completedAt: !task.completed ? new Date().toISOString() : undefined 
                }
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

  // Increment pomodoros for a task
  const incrementTaskPomodoros = useCallback(async (taskId: number) => {
    try {
      const { error } = await pomodoroService.tasks.incrementPomodoros(taskId)
      if (error) {
        console.error("Error incrementing pomodoros:", error)
        return
      }

      // Update local state
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, actualPomodoros: task.actualPomodoros + 1 }
            : task
        )
      )
    } catch (error) {
      console.error("Error incrementing pomodoros:", error)
    }
  }, [])

  // Get task statistics
  const getTaskStats = useCallback(async () => {
    if (!userId) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalPomodoros: 0,
        avgPomodorosPerTask: 0
      }
    }

    try {
      return await pomodoroService.tasks.getTaskStats(userId)
    } catch (error) {
      console.error("Error getting task stats:", error)
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalPomodoros: 0,
        avgPomodorosPerTask: 0
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
  const selectTask = useCallback(async (task: Task) => {
    setCurrentTask(task.name)
    setSelectedTaskId(task.id)
    
    // Move the selected task to the top of the list
    const activeTasks = tasks.filter(t => !t.completed)
    const completedTasks = tasks.filter(t => t.completed)
    
    // Remove the selected task from active tasks
    const otherActiveTasks = activeTasks.filter(t => t.id !== task.id)
    
    // Put the selected task first, then other active tasks, then completed tasks
    const newTasks = [task, ...otherActiveTasks, ...completedTasks]
    
    // Update the state immediately
    setTasks(newTasks)
    
    // Wait for the database update to complete
    await updateTaskOrder(newTasks)
  }, [updateTaskOrder, tasks])

  // Select a task by id without reordering (for skip/next logic)
  const selectTaskByIdNoReorder = useCallback((taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task.name);
      setSelectedTaskId(task.id);
    }
  }, [tasks]);

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
    selectTaskByIdNoReorder,
    currentTask,
    selectedTaskId,
    loadTasks,
    updateTask,
    updateTaskOrder,
    incrementTaskPomodoros,
    getTaskStats,
  }
}
