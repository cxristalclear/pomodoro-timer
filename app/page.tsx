"use client"

import { TimerDisplay } from "@/components/TimerDisplay"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { DebugPanel } from "@/components/DebugPanel"

/**
 * Main timer page - home route
 */
export default function HomePage() {
  return (
    <ProtectedRoute>
      <TimerDisplay />
      <DebugPanel />
    </ProtectedRoute>
  )
}
