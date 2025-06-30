"use client"

import type React from "react"
import { X, Plus, Trash2, Circle, CheckCircle, Edit2, Check, X as XIcon } from "lucide-react"
import { PomodoroProvider } from "@/components/PomodoroProvider"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Link from "next/link"
import { useState } from "react"
import type { Task } from "@/contexts/PomodoroContext"

/**
 * Task management page component
 * Allows users to add, complete, delete, and reorder tasks
 */
function TasksPageContent() {
  const { tasks, newTaskInput, setNewTaskInput, addTask, deleteTask, selectTask, setTasks, dataLoading, selectedTaskId, currentTask, toggleTaskCompletion, updateTask } = usePomodoro()

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")

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
   * Handle Enter key press in edit mode
   */
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit()
    } else if (e.key === "Escape") {
      cancelEdit()
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

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading tasks...</div>
      </div>
    )
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

      {/* Current task indicator */}
      {currentTask && (
        <div className="px-6 py-3 bg-transparent border-b border-gray-800">
          <div className="text-sm text-gray-400">Current Task:</div>
          <div className="text-white font-medium">{currentTask}</div>
        </div>
      )}

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
            className="flex-1 bg-transparent border border-gray-800 px-4 py-3 rounded outline-none focus:border-gray-600 transition-colors"
            aria-label="New task name"
          />
          <button
            onClick={addTask}
            className="bg-transparent hover:bg-gray-800 p-3 rounded transition-colors"
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
                } ${draggedTask?.id === task.id ? "opacity-50" : ""} ${
                  selectedTaskId === task.id ? "" : ""
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTaskCompletion(task.id)
                  }}
                  className="flex items-center gap-3"
                  aria-label={`${task.completed ? 'Mark as incomplete' : 'Mark as complete'}: ${task.name}`}
                >
                  <Circle 
                    size={20} 
                    className={selectedTaskId === task.id ? "text-blue-400" : "text-gray-600"} 
                  />
                </button>
                
                {editingTaskId === task.id ? (
                  // Edit mode
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      className="flex-1 bg-transparent border border-gray-600 px-2 py-1 rounded outline-none focus:border-gray-400"
                      autoFocus
                    />
                    <button
                      onClick={saveEdit}
                      className="text-green-400 hover:text-green-300 p-1"
                      aria-label="Save changes"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-red-400 hover:text-red-300 p-1"
                      aria-label="Cancel editing"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                ) : (
                  // View mode
                  <button
                    onClick={() => selectTask(task)}
                    onDoubleClick={() => startEditing(task)}
                    className="flex-1 text-left flex items-center gap-3"
                    aria-label={`Select task: ${task.name}`}
                  >
                    <span className={selectedTaskId === task.id ? "text-white font-medium" : "text-gray-300"}>
                      {task.name}
                    </span>
                    {selectedTaskId === task.id && (
                      <span className="text-xs text-blue-400 bg-transparent px-2 py-1 rounded">
                        selected
                      </span>
                    )}
                  </button>
                )}
                
                <div className="flex items-center gap-1">
                  {editingTaskId !== task.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(task)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-blue-400 transition-all p-1"
                      aria-label={`Edit task: ${task.name}`}
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all p-1"
                    aria-label={`Delete task: ${task.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

          {/* Completed tasks section */}
          {tasks.filter((t) => t.completed).length > 0 && (
            <>
              <div className="text-gray-600 text-sm mt-6 mb-2">Completed</div>
              {tasks
                .filter((t) => t.completed)
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 opacity-50 hover:opacity-75 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTaskCompletion(task.id)
                      }}
                      className="flex items-center gap-3"
                      aria-label={`Mark as incomplete: ${task.name}`}
                    >
                      <CheckCircle size={20} className="text-gray-600 hover:text-green-400 transition-colors" />
                    </button>
                    
                    {editingTaskId === task.id ? (
                      // Edit mode
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          className="flex-1 bg-transparent border border-gray-600 px-2 py-1 rounded outline-none focus:border-gray-400"
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          className="text-green-400 hover:text-green-300 p-1"
                          aria-label="Save changes"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-400 hover:text-red-300 p-1"
                          aria-label="Cancel editing"
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                    ) : (
                      // View mode
                      <span 
                        className="text-gray-500 line-through flex-1 cursor-pointer"
                        onDoubleClick={() => startEditing(task)}
                      >
                        {task.name}
                      </span>
                    )}
                    
                    <div className="flex items-center gap-1">
                      {editingTaskId !== task.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditing(task)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-blue-400 transition-all p-1"
                          aria-label={`Edit task: ${task.name}`}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>

        {/* Instructions */}
        {tasks.filter((t) => !t.completed).length > 1 && (
          <div className="mt-6 text-center text-gray-600 text-xs space-y-1">
            <p>Drag and drop tasks to reorder them</p>
            <p>Double-click task name or click edit icon to edit</p>
            <p>Click circle to complete, checkmark to uncomplete</p>
          </div>
        )}
        {tasks.filter((t) => !t.completed).length <= 1 && tasks.length > 0 && (
          <div className="mt-6 text-center text-gray-600 text-xs space-y-1">
            <p>Double-click task name or click edit icon to edit</p>
            <p>Click circle to complete, checkmark to uncomplete</p>
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
      <PomodoroProvider>
        <TasksPageContent />
      </PomodoroProvider>
    </ProtectedRoute>
  )
}
