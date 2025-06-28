"use client"

import { PomodoroProvider } from "@/components/PomodoroProvider"
import { TimerDisplay } from "@/components/TimerDisplay"
import { ProtectedRoute } from "@/components/ProtectedRoute"

/**
 * Main timer page - home route
 */
export default function HomePage() {
  return (
    <ProtectedRoute>
      <PomodoroProvider>
        <TimerDisplay />
      </PomodoroProvider>
    </ProtectedRoute>
  )
}
