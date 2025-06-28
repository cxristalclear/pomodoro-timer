"use client"

import { PomodoroProvider } from "@/components/PomodoroProvider"
import { NavMenu } from "@/components/NavMenu"

/**
 * Menu page with navigation links
 */
export default function MenuPage() {
  return (
    <PomodoroProvider>
      <NavMenu />
    </PomodoroProvider>
  )
}
