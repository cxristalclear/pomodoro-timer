"use client"

import type { Task } from "@/contexts/PomodoroContext"
import { usePomodoro } from "@/contexts/PomodoroContext"

export const QuickCompleteButton = ({ task, className = "" }: { task: Task; className?: string }) => {
  const { toggleTaskCompletion } = usePomodoro();
  const isReady = task.actualPomodoros >= task.estimatedPomodoros && !task.completed && task.estimatedPomodoros > 0;

  if (!isReady) return null;

  return (
    <button
      onClick={() => toggleTaskCompletion(task.id)}
      className={`text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded ml-2 transition-colors ${className}`}
      aria-label={`Quick complete task: ${task.name}`}
    >
      ✓ Complete
    </button>
  );
}; 