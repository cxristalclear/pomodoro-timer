"use client"

import type React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Don't show general shortcuts modal on timer page (it has its own)
  const isTimerPage = pathname === "/"
  
  const { shortcuts, showShortcuts, setShowShortcuts } = useKeyboardShortcuts({
    closeModalOrBack: () => router.back(),
  }, isTimerPage) // Disable shortcuts modal on timer page

  useEffect(() => {
    console.log("ProtectedRoute: useEffect triggered - loading:", loading, "user:", user ? "present" : "null")
    if (!loading && !user) {
      console.log("User not authenticated, redirecting to auth");
      router.push("/auth")
    }
  }, [user, loading, router])

  // Show loading while auth is being determined
  if (loading) {
    console.log("ProtectedRoute: Showing loading screen");
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    console.log("ProtectedRoute: No user found, not rendering protected content");
    return null
  }

  console.log("ProtectedRoute: User authenticated, rendering protected content");
  return (
    <>
      {children}
      {/* Minimal keyboard shortcuts popout - only show on non-timer pages */}
      {showShortcuts && !isTimerPage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowShortcuts(false)}
          style={{ backdropFilter: 'blur(2px)' }}
        >
          <div
            className="bg-gray-900 text-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw] border border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4 text-center">Keyboard Shortcuts</h2>
            <ul className="space-y-2">
              {shortcuts.map((s, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-400">{s.keys}</span>
                  <span className="text-gray-200">{s.description}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-center text-xs text-gray-500">Press <span className="font-mono">Escape</span> to close</div>
          </div>
        </div>
      )}
    </>
  )
}
