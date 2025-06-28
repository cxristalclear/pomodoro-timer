export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: number
          user_id: string
          name: string
          completed: boolean
          position: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          completed?: boolean
          position: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          completed?: boolean
          position?: number
          created_at?: string
          completed_at?: string | null
        }
      }
      sessions: {
        Row: {
          id: number
          user_id: string
          task: string
          duration: number
          date: string
          completed_at: string
        }
        Insert: {
          id?: number
          user_id: string
          task: string
          duration: number
          date: string
          completed_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          task?: string
          duration?: number
          date?: string
          completed_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          user_id: string
          work_duration: number
          break_duration: number
          long_break_duration: number
          sessions_until_long_break: number
          sound_enabled: boolean
          sound_volume: number
          auto_start_breaks: boolean
          auto_start_work: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          work_duration?: number
          break_duration?: number
          long_break_duration?: number
          sessions_until_long_break?: number
          sound_enabled?: boolean
          sound_volume?: number
          auto_start_breaks?: boolean
          auto_start_work?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          work_duration?: number
          break_duration?: number
          long_break_duration?: number
          sessions_until_long_break?: number
          sound_enabled?: boolean
          sound_volume?: number
          auto_start_breaks?: boolean
          auto_start_work?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
