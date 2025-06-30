"use client"

import type React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()

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
  return <>{children}</>
}
