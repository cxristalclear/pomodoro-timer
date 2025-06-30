"use client"

import { PomodoroProvider } from "@/components/PomodoroProvider"
import { TimerDisplay } from "@/components/TimerDisplay"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { DebugPanel } from "@/components/DebugPanel"

/**
 * Main timer page - home route
 */
export default function HomePage() {
  return (
    <ProtectedRoute>
      <PomodoroProvider>
        <TimerDisplay />
        <DebugPanel />
      </PomodoroProvider>
    </ProtectedRoute>
  )
}
