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
          completed_at: string  // Now TIMESTAMPTZ
          notes: string | null
          mood: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          category_id: number
          completed_at: string  // Now TIMESTAMPTZ
          notes?: string | null
          mood?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          category_id?: number
          completed_at?: string  // Now TIMESTAMPTZ
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
      // NEW: Temperament tables
      axis6_temperament_profiles: {
        Row: {
          id: string
          user_id: string
          primary_temperament: string
          secondary_temperament: string | null
          temperament_scores: Json
          personality_insights: Json
          completed_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          primary_temperament: string
          secondary_temperament?: string | null
          temperament_scores?: Json
          personality_insights?: Json
          completed_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          primary_temperament?: string
          secondary_temperament?: string | null
          temperament_scores?: Json
          personality_insights?: Json
          completed_at?: string
          updated_at?: string
        }
      }
      axis6_temperament_questions: {
        Row: {
          id: string
          question_text: Json
          question_type: string
          options: Json
          order_index: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          question_text: Json
          question_type: string
          options: Json
          order_index: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          question_text?: Json
          question_type?: string
          options?: Json
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
      }
      axis6_temperament_responses: {
        Row: {
          id: string
          user_id: string
          question_id: string
          selected_option_index: number
          response_value: Json
          session_id: string
          answered_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          selected_option_index: number
          response_value: Json
          session_id: string
          answered_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          selected_option_index?: number
          response_value?: Json
          session_id?: string
          answered_at?: string
        }
      }
      axis6_personalization_settings: {
        Row: {
          id: string
          user_id: string
          temperament_based_suggestions: boolean
          preferred_motivation_style: string | null
          custom_daily_mantras: Json
          preferred_activity_types: Json
          ui_theme_preference: string
          notification_style: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          temperament_based_suggestions?: boolean
          preferred_motivation_style?: string | null
          custom_daily_mantras?: Json
          preferred_activity_types?: Json
          ui_theme_preference?: string
          notification_style?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          temperament_based_suggestions?: boolean
          preferred_motivation_style?: string | null
          custom_daily_mantras?: Json
          preferred_activity_types?: Json
          ui_theme_preference?: string
          notification_style?: string
          created_at?: string
          updated_at?: string
        }
      }
      axis6_temperament_activities: {
        Row: {
          id: string
          category_id: number
          temperament: string
          activity_name: Json
          description: Json | null
          difficulty_level: number
          energy_level: string
          social_aspect: string
          time_commitment: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category_id: number
          temperament: string
          activity_name: Json
          description?: Json | null
          difficulty_level?: number
          energy_level?: string
          social_aspect?: string
          time_commitment?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: number
          temperament?: string
          activity_name?: Json
          description?: Json | null
          difficulty_level?: number
          energy_level?: string
          social_aspect?: string
          time_commitment?: string
          is_active?: boolean
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
      // NEW: Temperament functions
      calculate_temperament_from_responses: {
        Args: {
          p_user_id: string
          p_session_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}