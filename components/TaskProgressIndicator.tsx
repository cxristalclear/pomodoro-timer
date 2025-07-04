"use client"

import type React from "react"
import type { Task } from "@/contexts/PomodoroContext"

interface TaskProgressIndicatorProps {
  task: Task
  className?: string
}

/**
 * TaskProgressIndicator component displays pomodoro progress for a task
 * Shows current/estimated pomodoros and indicates when task is ready to complete
 */
export const TaskProgressIndicator: React.FC<TaskProgressIndicatorProps> = ({ 
  task, 
  className = "" 
}) => {
  const progress = task.estimatedPomodoros > 0 
    ? Math.min(task.actualPomodoros / task.estimatedPomodoros, 1)
    : 0;
  
  const isReady = task.actualPomodoros >= task.estimatedPomodoros && task.estimatedPomodoros > 0;
  const hasProgress = task.actualPomodoros > 0;

  if (!hasProgress) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {/* Pomodoro icon */}
      <span className="text-yellow-500">🍅</span>
      
      {/* Progress count */}
      <span className={isReady ? "text-green-400 font-medium" : "text-gray-400"}>
        {task.actualPomodoros}
        {task.estimatedPomodoros > 0 && (
          <>
            <span className="text-gray-600">/</span>
            <span className="text-gray-500">{task.estimatedPomodoros}</span>
          </>
        )}
      </span>
      
      {/* Ready indicator */}
      {isReady && (
        <span className="text-green-400" title="Ready to complete!">
          ✨
        </span>
      )}
      
      {/* Progress bar for visual indication */}
      {task.estimatedPomodoros > 0 && (
        <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              isReady ? "bg-green-400" : "bg-blue-400"
            }`}
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * ReadyToCompleteBadge component shows when a task is ready for completion
 */
export const ReadyToCompleteBadge: React.FC<{ task: Task; className?: string }> = ({ 
  task, 
  className = "" 
}) => {
  const isReadyToComplete = task.actualPomodoros >= task.estimatedPomodoros && 
                           task.estimatedPomodoros > 0 && 
                           !task.completed;

  if (!isReadyToComplete) {
    return null;
  }

  return (
    <span className={`text-xs bg-green-600 text-white px-2 py-1 rounded font-medium animate-pulse ${className}`}>
      Ready to complete!
    </span>
  );
}

/**
 * CompactTaskProgress for use in smaller spaces like timer display
 */
export const CompactTaskProgress: React.FC<{ task: Task; className?: string }> = ({ 
  task, 
  className = "" 
}) => {
  const isReady = task.actualPomodoros >= task.estimatedPomodoros && task.estimatedPomodoros > 0;
  const hasProgress = task.actualPomodoros > 0;

  if (!hasProgress) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      <span className="text-yellow-500">🍅</span>
      <span className={isReady ? "text-green-400" : "text-gray-400"}>
        {task.actualPomodoros}
        {task.estimatedPomodoros > 0 && `/${task.estimatedPomodoros}`}
      </span>
      {isReady && <span className="text-green-400">✨</span>}
    </div>
  );
} 