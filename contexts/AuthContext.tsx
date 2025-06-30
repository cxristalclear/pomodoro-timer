"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    console.log("AuthProvider: Starting auth initialization")
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("AuthProvider: Timeout reached, forcing loading to false")
      setLoading(false)
    }, 5000) // 5 second timeout
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("AuthProvider: Getting initial session...")
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()
        
        if (error) {
          console.error("AuthProvider: Error getting session:", error)
        }
        
        console.log("AuthProvider: Initial session:", session ? "found" : "not found")
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        clearTimeout(timeoutId)
        console.log("AuthProvider: Loading set to false")
      } catch (error) {
        console.error("AuthProvider: Exception getting session:", error)
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthProvider: Auth state change:", event, session ? "session found" : "no session")
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      clearTimeout(timeoutId)
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [supabase.auth])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  console.log("AuthProvider: Current state - loading:", loading, "user:", user ? "present" : "null")

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
