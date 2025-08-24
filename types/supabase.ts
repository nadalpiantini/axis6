export interface Database {
  public: {
    Tables: {
      axis6_categories: {
        Row: {
          id: number
          name: string
          color: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          color: string
          icon: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          color?: string
          icon?: string
          created_at?: string
        }
      }
      axis6_checkins: {
        Row: {
          id: string
          user_id: string
          category_id: number
          completed_at: string
          mood: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: number
          completed_at?: string
          mood?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: number
          completed_at?: string
          mood?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      axis6_streaks: {
        Row: {
          id: string
          user_id: string
          category_id: number
          current_streak: number
          longest_streak: number
          last_checkin: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: number
          current_streak?: number
          longest_streak?: number
          last_checkin?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: number
          current_streak?: number
          longest_streak?: number
          last_checkin?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      axis6_profiles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      axis6_daily_stats: {
        Row: {
          id: string
          user_id: string
          date: string
          categories_completed: number
          total_mood: number
          completion_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          categories_completed: number
          total_mood: number
          completion_rate: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          categories_completed?: number
          total_mood?: number
          completion_rate?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}