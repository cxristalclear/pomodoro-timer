"use client"

import type React from "react"
import { X, Plus, Trash2, Circle, CheckCircle } from "lucide-react"
import { PomodoroProvider } from "@/components/PomodoroProvider"
import { usePomodoro } from "@/contexts/PomodoroContext"
import Link from "next/link"
import { useState } from "react"
import type { Task } from "@/contexts/PomodoroContext"

/**
 * Task management page component
 * Allows users to add, complete, delete, and reorder tasks
 */
function TasksPageContent() {
  const { tasks, newTaskInput, setNewTaskInput, addTask, deleteTask, selectTask, setTasks } = usePomodoro()

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  /**
   * Handle Enter key press to add task
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTask()
    }
  }

  /**
   * Drag and drop handlers for task reordering
   */
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedTask) return

    const activeTasks = tasks.filter((t) => !t.completed)
    const dragIndex = activeTasks.findIndex((t) => t.id === draggedTask.id)

    if (dragIndex === dropIndex) return

    // Reorder tasks
    const newActiveTasks = [...activeTasks]
    const [removed] = newActiveTasks.splice(dragIndex, 1)
    newActiveTasks.splice(dropIndex, 0, removed)

    // Update the full tasks array maintaining completed tasks at the end
    const completedTasks = tasks.filter((t) => t.completed)
    const newTasks = [...newActiveTasks, ...completedTasks]

    setTasks(newTasks)

    setDraggedTask(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverIndex(null)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Page header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-900">
        <h1 className="text-xl font-light">Tasks</h1>
        <Link
          href="/"
          className="text-white p-2 hover:bg-gray-900 rounded transition-colors"
          aria-label="Back to timer"
        >
          <X size={24} />
        </Link>
      </header>

      {/* Task management interface */}
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {/* Add new task input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add new task..."
            className="flex-1 bg-gray-900 px-4 py-3 rounded outline-none focus:bg-gray-800 transition-colors"
            aria-label="New task name"
          />
          <button
            onClick={addTask}
            className="bg-gray-900 hover:bg-gray-800 p-3 rounded transition-colors"
            aria-label="Add task"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {/* Active tasks with drag and drop */}
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
                className={`flex items-center gap-3 p-3 hover:bg-gray-900 rounded group transition-colors cursor-move ${
                  dragOverIndex === index ? "bg-gray-800 border-t-2 border-gray-600" : ""
                } ${draggedTask?.id === task.id ? "opacity-50" : ""}`}
              >
                <button
                  onClick={() => selectTask(task)}
                  className="flex-1 text-left flex items-center gap-3"
                  aria-label={`Select task: ${task.name}`}
                >
                  <Circle size={20} className="text-gray-600" />
                  <span className="text-gray-300">{task.name}</span>
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all"
                  aria-label={`Delete task: ${task.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

          {/* Completed tasks section */}
          {tasks.filter((t) => t.completed).length > 0 && (
            <>
              <div className="text-gray-600 text-sm mt-6 mb-2">Completed</div>
              {tasks
                .filter((t) => t.completed)
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 opacity-50">
                    <CheckCircle size={20} className="text-gray-600" />
                    <span className="text-gray-500 line-through">{task.name}</span>
                  </div>
                ))}
            </>
          )}
        </div>

        {/* Instructions */}
        {tasks.filter((t) => !t.completed).length > 1 && (
          <div className="mt-6 text-center text-gray-600 text-xs">
            <p>Drag and drop tasks to reorder them</p>
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
    <PomodoroProvider>
      <TasksPageContent />
    </PomodoroProvider>
  )
}
