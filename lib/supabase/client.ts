import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log("Supabase client: URL available:", !!supabaseUrl)
console.log("Supabase client: Anon key available:", !!supabaseAnonKey)

export const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase client: Missing environment variables")
    throw new Error("Missing Supabase environment variables")
  }
  
  console.log("Supabase client: Creating client with URL:", supabaseUrl)
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Singleton pattern for client-side usage
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    console.log("Supabase client: Creating new client instance")
    supabaseClient = createSupabaseClient()
  }
  return supabaseClient
}
