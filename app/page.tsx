"use client"

import { PomodoroProvider } from "@/components/PomodoroProvider"
import { TimerDisplay } from "@/components/TimerDisplay"

/**
 * Main timer page - home route
 */
export default function HomePage() {
  return (
    <PomodoroProvider>
      <TimerDisplay />
    </PomodoroProvider>
  )
}
