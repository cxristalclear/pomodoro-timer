"use client"

import type React from "react"
import { X, Plus, Trash2, Circle, CheckCircle2, Edit3, Check, MoreVertical, Clock, Target } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { BreadcrumbNav, useBreadcrumbs } from "@/components/BreadcrumbNav"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import type { Task } from "@/contexts/PomodoroContext"

/**
 * Enhanced Task management page with minimal design
 */
function EnhancedTasksContent() {
  const { 
    tasks, 
    newTaskInput, 
    setNewTaskInput, 
    addTask, 
    deleteTask, 
    selectTask, 
    selectTaskAndNavigate, 
    setTasks, 
    dataLoading, 
    selectedTaskId, 
    currentTask, 
    toggleTaskCompletion, 
    updateTask,
    loadTasks 
  } = usePomodoro()

  const pathname = usePathname()
  const breadcrumbs = useBreadcrumbs(pathname)

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")

  // Click delay state for double-click handling
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)
  const [lastClickedTask, setLastClickedTask] = useState<number | null>(null)

  /**
   * Handle Enter key press to add task
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTask()
    }
  }

  /**
   * Start editing a task
   */
  const startEditing = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingText(task.name)
  }

  /**
   * Save the edited task
   */
  const saveEdit = async () => {
    if (editingTaskId && editingText.trim()) {
      await updateTask(editingTaskId, { name: editingText.trim() })
      setEditingTaskId(null)
      setEditingText("")
    }
  }

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingTaskId(null)
    setEditingText("")
  }

  /**
   * Handle edit key down
   */
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit()
    } else if (e.key === "Escape") {
      cancelEdit()
    }
  }

  /**
   * Handle task click (single click selects, double click edits)
   */
  const handleTaskClick = (task: Task) => {
    if (clickTimeout && lastClickedTask === task.id) {
      // Double click - edit
      clearTimeout(clickTimeout)
      setClickTimeout(null)
      setLastClickedTask(null)
      startEditing(task)
    } else {
      // Single click - select and navigate
      setLastClickedTask(task.id)
      const timeout = setTimeout(() => {
        selectTaskAndNavigate(task)
        setClickTimeout(null)
        setLastClickedTask(null)
      }, 200)
      setClickTimeout(timeout)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedTask) return

    const activeTasks = tasks.filter((t) => !t.completed)
    const completedTasks = tasks.filter((t) => t.completed)

    // Remove dragged task from active tasks
    const filteredActiveTasks = activeTasks.filter((t) => t.id !== draggedTask.id)

    // Insert at new position
    filteredActiveTasks.splice(dropIndex, 0, draggedTask)

    // Combine with completed tasks
    const newTasks = [...filteredActiveTasks, ...completedTasks]
    setTasks(newTasks)

    setDraggedTask(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverIndex(null)
  }

  /**
   * Progress indicator component
   */
  const ProgressIndicator: React.FC<{ task: Task }> = ({ task }) => {
    const progress = task.estimatedPomodoros > 0 
      ? Math.min(task.actualPomodoros / task.estimatedPomodoros, 1)
      : 0

    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1 text-gray-400">
          <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
          <span>{task.actualPomodoros}/{task.estimatedPomodoros}</span>
        </div>
        {task.actualPomodoros > 0 && (
          <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  /**
   * Task status indicator
   */
  const TaskStatusIndicator: React.FC<{ task: Task }> = ({ task }) => {
    const isSelected = selectedTaskId === task.id
    const hasProgress = task.actualPomodoros > 0
    const isReady = task.actualPomodoros >= task.estimatedPomodoros && task.estimatedPomodoros > 0

    return (
      <div className="flex items-center gap-2">
        {isSelected && (
          <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
        )}
        {hasProgress && !isSelected && (
          <div className="w-1 h-6 bg-gray-600 rounded-full"></div>
        )}
        {isReady && (
          <div className="text-xs text-green-400 font-medium">Ready</div>
        )}
      </div>
    )
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && loadTasks) {
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout)
      }
    }
  }, [clickTimeout])

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-gray-900">
        <div className="flex justify-between items-center p-6">
          <div>
            <h1 className="text-xl font-light">Tasks</h1>
            <p className="text-gray-500 text-sm mt-1">{tasks.filter(t => !t.completed).length} active</p>
          </div>
          <Link
            href="/"
            className="text-white p-2 hover:bg-gray-900 rounded transition-colors"
            aria-label="Back to timer"
          >
            <X size={20} />
          </Link>
        </div>
        
        {/* Breadcrumb */}
        <div className="px-6 pb-4">
          <BreadcrumbNav items={breadcrumbs} />
        </div>
      </header>

      {/* Current task indicator */}
      {currentTask && selectedTaskId && (
        <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wide">Current Focus</span>
              <p className="text-white font-medium">{currentTask}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        
        {/* Add task input */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add new task..."
              className="w-full bg-transparent border-b border-gray-800 pb-3 text-white placeholder-gray-500 focus:border-gray-600 focus:outline-none transition-colors text-lg"
            />
            {newTaskInput && (
              <button
                onClick={addTask}
                className="absolute right-0 top-0 text-gray-400 hover:text-white transition-colors"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Active tasks */}
        <div className="space-y-1 mb-8">
          {tasks
            .filter((t) => !t.completed)
            .map((task, index) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-4 p-4 hover:bg-gray-900/30 rounded-lg transition-all cursor-move ${
                  dragOverIndex === index ? "bg-gray-800 border-t border-blue-500" : ""
                } ${draggedTask?.id === task.id ? "opacity-50" : ""}`}
              >
                
                <TaskStatusIndicator task={task} />
                
                {/* Task completion toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTaskCompletion(task.id)
                  }}
                  className="text-gray-600 hover:text-blue-400 transition-colors"
                >
                  <Circle size={18} />
                </button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  {editingTaskId === task.id ? (
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={saveEdit}
                      className="w-full bg-transparent border-b border-gray-700 pb-1 text-white focus:border-blue-500 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => handleTaskClick(task)}
                      className="w-full text-left"
                    >
                      <div className={`font-medium ${selectedTaskId === task.id ? "text-blue-200" : "text-white"}`}>
                        {task.name}
                      </div>
                      <div className="mt-1">
                        <ProgressIndicator task={task} />
                      </div>
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingTaskId !== task.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(task)
                      }}
                      className="text-gray-500 hover:text-gray-300 p-1 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTask(task.id)
                    }}
                    className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Completed section */}
        {tasks.filter((t) => t.completed).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px bg-gray-800 flex-1"></div>
              <span className="text-gray-500 text-sm px-3">Completed</span>
              <div className="h-px bg-gray-800 flex-1"></div>
            </div>
            
            <div className="space-y-1">
              {tasks
                .filter((t) => t.completed)
                .map((task) => (
                  <div 
                    key={task.id} 
                    className="group flex items-center gap-4 p-4 opacity-60 hover:opacity-80 transition-opacity"
                  >
                    
                    {/* Completed indicator */}
                    <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTaskCompletion(task.id)
                      }}
                      className="text-green-500 hover:text-green-400 transition-colors"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    
                    <div className="flex-1">
                      <div className="text-gray-400 line-through font-medium">
                        {task.name}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                        {task.completedAt && (
                          <span>{new Date(task.completedAt).toLocaleDateString()}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span>{task.actualPomodoros}/{task.estimatedPomodoros}</span>
                        </div>
                        {task.actualPomodoros >= task.estimatedPomodoros && (
                          <div className="w-12 h-1 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Target size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No tasks yet</p>
            <p className="text-sm mt-1">Add your first task to start focusing</p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Tasks page with provider wrapper
 */
export default function TasksPage() {
  return (
    <ProtectedRoute>
      <EnhancedTasksContent />
    </ProtectedRoute>
  )
}
