export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      axis6_profiles: {
        Row: {
          id: string
          name: string
          timezone: string
          onboarded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          timezone?: string
          onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          timezone?: string
          onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      axis6_categories: {
        Row: {
          id: number
          slug: string
          name: Json
          description: Json | null
          color: string
          icon: string
          position: number
          created_at: string
        }
        Insert: {
          id?: number
          slug: string
          name: Json
          description?: Json | null
          color: string
          icon: string
          position: number
          created_at?: string
        }
        Update: {
          id?: number
          slug?: string
          name?: Json
          description?: Json | null
          color?: string
          icon?: string
          position?: number
          created_at?: string
        }
      }
      axis6_checkins: {
        Row: {
          id: number
          user_id: string
          category_id: number
          completed_at: string
          notes: string | null
          mood: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          category_id: number
          completed_at: string
          notes?: string | null
          mood?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          category_id?: number
          completed_at?: string
          notes?: string | null
          mood?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      axis6_streaks: {
        Row: {
          id: number
          user_id: string
          category_id: number
          current_streak: number
          longest_streak: number
          last_checkin: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          category_id: number
          current_streak?: number
          longest_streak?: number
          last_checkin?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          category_id?: number
          current_streak?: number
          longest_streak?: number
          last_checkin?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      axis6_daily_stats: {
        Row: {
          user_id: string
          date: string
          completion_rate: number | null
          categories_completed: number
          total_mood: number | null
          created_at: string
        }
        Insert: {
          user_id: string
          date: string
          completion_rate?: number | null
          categories_completed?: number
          total_mood?: number | null
          created_at?: string
        }
        Update: {
          user_id?: string
          date?: string
          completion_rate?: number | null
          categories_completed?: number
          total_mood?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      axis6_calculate_streak: {
        Args: {
          p_user_id: string
          p_category_id: number
        }
        Returns: void
      }
      axis6_update_daily_stats: {
        Args: {
          p_user_id: string
          p_date: string
        }
        Returns: void
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}