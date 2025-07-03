"use client"

import { NavMenu } from "@/components/NavMenu"
import { ProtectedRoute } from "@/components/ProtectedRoute"

/**
 * Menu page with navigation links
 */
export default function MenuPage() {
  return (
    <ProtectedRoute>
      <NavMenu />
    </ProtectedRoute>
  )
}
