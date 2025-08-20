
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          app_id: string
          context_data: Json | null
          conversation_type: string
          created_at: string
          id: string
          is_active: boolean
          messages: Json
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          context_data?: Json | null
          conversation_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          context_data?: Json | null
          conversation_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "app_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          encrypted_value: string
          id: string
          is_active: boolean | null
          key_name: string
          last_used: string | null
          project_id: string
          provider: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          encrypted_value: string
          id?: string
          is_active?: boolean | null
          key_name: string
          last_used?: string | null
          project_id: string
          provider: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          encrypted_value?: string
          id?: string
          is_active?: boolean | null
          key_name?: string
          last_used?: string | null
          project_id?: string
          provider?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      app_projects: {
        Row: {
          app_key: string
          app_name: string
          config: Json | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          app_key: string
          app_name: string
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          app_key?: string
          app_name?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automated_tasks: {
        Row: {
          ai_prompt: string | null
          created_at: string
          cron_schedule: string | null
          id: string
          is_active: boolean | null
          last_run: string | null
          link: string | null
          next_run: string | null
          note: string | null
          script_content: string | null
          task_type: string | null
          title: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          ai_prompt?: string | null
          created_at?: string
          cron_schedule?: string | null
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          link?: string | null
          next_run?: string | null
          note?: string | null
          script_content?: string | null
          task_type?: string | null
          title: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          ai_prompt?: string | null
          created_at?: string
          cron_schedule?: string | null
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          link?: string | null
          next_run?: string | null
          note?: string | null
          script_content?: string | null
          task_type?: string | null
          title?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      cinet_credits: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          role: string | null
          title: string
          year: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          role?: string | null
          title: string
          year?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          role?: string | null
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cinet_credits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "cinet_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cinet_documents: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          file_url: string
          id: string
          profile_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          file_url: string
          id?: string
          profile_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string
          id?: string
          profile_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cinet_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "cinet_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cinet_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          id: string
          name: string
          sirecine_no: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          name: string
          sirecine_no?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          name?: string
          sirecine_no?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          active: boolean | null
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          rnc: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          rnc?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          rnc?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      couple_connections: {
        Row: {
          app_id: string
          connected_at: string | null
          connection_code: string
          created_at: string
          creator_user_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          partner_user_id: string | null
          qr_data: Json
        }
        Insert: {
          app_id: string
          connected_at?: string | null
          connection_code: string
          created_at?: string
          creator_user_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          partner_user_id?: string | null
          qr_data: Json
        }
        Update: {
          app_id?: string
          connected_at?: string | null
          connection_code?: string
          created_at?: string
          creator_user_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          partner_user_id?: string | null
          qr_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "couple_connections_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "app_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_entries: {
        Row: {
          app_id: string
          challenges: string[] | null
          content: string | null
          created_at: string
          emotions: Json | null
          entry_date: string
          goals_progress: Json | null
          gratitude: string[] | null
          highlights: string[] | null
          id: string
          is_private: boolean
          mood_score: number | null
          photos: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          challenges?: string[] | null
          content?: string | null
          created_at?: string
          emotions?: Json | null
          entry_date: string
          goals_progress?: Json | null
          gratitude?: string[] | null
          highlights?: string[] | null
          id?: string
          is_private?: boolean
          mood_score?: number | null
          photos?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          challenges?: string[] | null
          content?: string | null
          created_at?: string
          emotions?: Json | null
          entry_date?: string
          goals_progress?: Json | null
          gratitude?: string[] | null
          highlights?: string[] | null
          id?: string
          is_private?: boolean
          mood_score?: number | null
          photos?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_entries_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "app_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          build_logs: string | null
          created_at: string
          deployment_url: string | null
          environment: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          project_id: string
          provider: string
          status: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          build_logs?: string | null
          created_at?: string
          deployment_url?: string | null
          environment?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          provider: string
          status?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          build_logs?: string | null
          created_at?: string
          deployment_url?: string | null
          environment?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          provider?: string
          status?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_profiles: {
        Row: {
          app_id: string
          created_at: string
          emotional_patterns: Json | null
          growth_areas: string[] | null
          id: string
          life_themes: Json | null
          personality_traits: Json | null
          profile_name: string
          strengths: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          created_at?: string
          emotional_patterns?: Json | null
          growth_areas?: string[] | null
          id?: string
          life_themes?: Json | null
          personality_traits?: Json | null
          profile_name: string
          strengths?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          emotional_patterns?: Json | null
          growth_areas?: string[] | null
          id?: string
          life_themes?: Json | null
          personality_traits?: Json | null
          profile_name?: string
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_profiles_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "app_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      erpnext_sync_logs: {
        Row: {
          created_at: string | null
          erpnext_docname: string | null
          erpnext_doctype: string | null
          error_message: string | null
          id: string
          record_id: string
          response_data: Json | null
          sync_direction: string
          sync_payload: Json | null
          sync_status: string
          sync_type: string
          table_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          erpnext_docname?: string | null
          erpnext_doctype?: string | null
          error_message?: string | null
          id?: string
          record_id: string
          response_data?: Json | null
          sync_direction: string
          sync_payload?: Json | null
          sync_status: string
          sync_type: string
          table_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          erpnext_docname?: string | null
          erpnext_doctype?: string | null
          error_message?: string | null
          id?: string
          record_id?: string
          response_data?: Json | null
          sync_direction?: string
          sync_payload?: Json | null
          sync_status?: string
          sync_type?: string
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kutz_api_keys: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: number
          is_active: boolean | null
          key: string
          last_used: string | null
          name: string | null
          rate_limit: number | null
          scopes: Json | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: number
          is_active?: boolean | null
          key?: string
          last_used?: string | null
          name?: string | null
          rate_limit?: number | null
          scopes?: Json | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: number
          is_active?: boolean | null
          key?: string
          last_used?: string | null
          name?: string | null
          rate_limit?: number | null
          scopes?: Json | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kutz_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "kutz_users"
            referencedColumns: ["id"]
          },
        ]
      }
      kutz_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["kutz_asset_type"] | null
          bucket_name: string | null
          cdn_url: string | null
          created_at: string | null
          description: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          is_processed: boolean | null
          metadata: Json | null
          mime_type: string | null
          processed_variants: Json | null
          processing_status: string | null
          project_id: string | null
          storage_backend: string | null
          storage_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["kutz_asset_type"] | null
          bucket_name?: string | null
          cdn_url?: string | null
          created_at?: string | null
          description?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          is_processed?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          processed_variants?: Json | null
          processing_status?: string | null
          project_id?: string | null
          storage_backend?: string | null
          storage_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["kutz_asset_type"] | null
          bucket_name?: string | null
          cdn_url?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          is_processed?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          processed_variants?: Json | null
          processing_status?: string | null
          project_id?: string | null
          storage_backend?: string | null
          storage_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kutz_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "kutz_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kutz_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "kutz_users"
            referencedColumns: ["id"]
          },
        ]
      }
      kutz_audit_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_type: string
          id: number
          ip_address: unknown | null
          request_method: string | null
          request_path: string | null
          severity: Database["public"]["Enums"]["kutz_severity_level"] | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_type: string
          id?: number
          ip_address?: unknown | null
          request_method?: string | null
          request_path?: string | null
          severity?: Database["public"]["Enums"]["kutz_severity_level"] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_type?: string
          id?: number
          ip_address?: unknown | null
          request_method?: string | null
          request_path?: string | null
          severity?: Database["public"]["Enums"]["kutz_severity_level"] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kutz_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "kutz_users"
            referencedColumns: ["id"]
          },
        ]
      }
      kutz_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      kutz_payment_logs: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          error_message: string | null
          id: number
          invoice_id: string | null
          paid_at: string | null
          payment_intent_id: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["kutz_payment_status"] | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: number
          invoice_id?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["kutz_payment_status"] | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: number
          invoice_id?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["kutz_payment_status"] | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kutz_payment_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "kutz_users"
            referencedColumns: ["id"]
          },
        ]
      }
      kutz_projects: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          error_count: number | null
          error_message: string | null
          file_size_mb: number | null
          id: string
          output_url: string | null
          phase: string | null
          platform: string | null
          progress: number | null
          script_content: string
          started_at: string | null
          state_id: string | null
          status: Database["public"]["Enums"]["kutz_project_status"] | null
          template: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          error_count?: number | null
          error_message?: string | null
          file_size_mb?: number | null
          id?: string
          output_url?: string | null
          phase?: string | null
          platform?: string | null
          progress?: number | null
          script_content: string
          started_at?: string | null
          state_id?: string | null
          status?: Database["public"]["Enums"]["kutz_project_status"] | null
          template?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          error_count?: number | null
          error_message?: string | null
          file_size_mb?: number | null
          id?: string
          output_url?: string | null
          phase?: string | null
          platform?: string | null
          progress?: number | null
          script_content?: string
          started_at?: string | null
          state_id?: string | null
          status?: Database["public"]["Enums"]["kutz_project_status"] | null
          template?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kutz_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "kutz_users"
            referencedColumns: ["id"]
          },
        ]
      }
      kutz_realtime_events: {
        Row: {
          channel: string
          created_at: string | null
          event: string
          id: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          event: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          event?: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kutz_realtime_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "kutz_users"
            referencedColumns: ["id"]
          },
        ]
      }
      kutz_tasks: {
        Row: {
          agent_role: string | null
          completed_at: string | null
          created_at: string | null
          critical: boolean | null
          dependencies: Json | null
          description: string | null
          duration_seconds: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          max_retries: number | null
          name: string
          parameters: Json | null
          project_id: string
          result_data: Json | null
          retry_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["kutz_task_status"] | null
          task_type: string | null
          updated_at: string | null
        }
        Insert: {
          agent_role?: string | null
          completed_at?: string | null
          created_at?: string | null
          critical?: boolean | null
          dependencies?: Json | null
          description?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id: string
          max_retries?: number | null
          name: string
          parameters?: Json | null
          project_id: string
          result_data?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["kutz_task_status"] | null
          task_type?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_role?: string | null
          completed_at?: string | null
          created_at?: string | null
          critical?: boolean | null
          dependencies?: Json | null
          description?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          name?: string
          parameters?: Json | null
          project_id?: string
          result_data?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["kutz_task_status"] | null
          task_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kutz_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "kutz_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kutz_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          is_premium: boolean | null
          last_login: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_premium?: boolean | null
          last_login?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_premium?: boolean | null
          last_login?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      kutz_webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          headers: Json | null
          id: number
          payload: Json | null
          processed_at: string | null
          processing_time_ms: number | null
          source: string
          status: Database["public"]["Enums"]["kutz_webhook_status"] | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          headers?: Json | null
          id?: number
          payload?: Json | null
          processed_at?: string | null
          processing_time_ms?: number | null
          source: string
          status?: Database["public"]["Enums"]["kutz_webhook_status"] | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          headers?: Json | null
          id?: number
          payload?: Json | null
          processed_at?: string | null
          processing_time_ms?: number | null
          source?: string
          status?: Database["public"]["Enums"]["kutz_webhook_status"] | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          cedula: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          erpnext_customer_id: string | null
          erpnext_last_sync: string | null
          erpnext_sync_status: string | null
          full_name: string | null
          id: string
          phone: string | null
          rnc: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          cedula?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          erpnext_customer_id?: string | null
          erpnext_last_sync?: string | null
          erpnext_sync_status?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          rnc?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          cedula?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          erpnext_customer_id?: string | null
          erpnext_last_sync?: string | null
          erpnext_sync_status?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          rnc?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          configuration: Json
          created_at: string
          deployment_url: string | null
          description: string | null
          estimated_price: number | null
          estimated_users: number | null
          features: string[] | null
          id: string
          industry: string
          name: string
          pricing_model: string | null
          repo_url: string | null
          stack: Json
          status: string | null
          tagline: string
          target_market: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          configuration: Json
          created_at?: string
          deployment_url?: string | null
          description?: string | null
          estimated_price?: number | null
          estimated_users?: number | null
          features?: string[] | null
          id?: string
          industry: string
          name: string
          pricing_model?: string | null
          repo_url?: string | null
          stack: Json
          status?: string | null
          tagline: string
          target_market: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string
          deployment_url?: string | null
          description?: string | null
          estimated_price?: number | null
          estimated_users?: number | null
          features?: string[] | null
          id?: string
          industry?: string
          name?: string
          pricing_model?: string | null
          repo_url?: string | null
          stack?: Json
          status?: string | null
          tagline?: string
          target_market?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      quick_bookmarks: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon_alt_text: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon_alt_text?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon_alt_text?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          additional_data: Json | null
          created_at: string | null
          event_description: string
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string | null
          event_description: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          created_at?: string | null
          event_description?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      smc_posts: {
        Row: {
          created_at: string
          full_raw_text: string | null
          id: number
          platform: string
          post_id: string
          post_owner: string
          scraped_at: string
          source_id: number
          source_name: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_raw_text?: string | null
          id?: number
          platform?: string
          post_id: string
          post_owner: string
          scraped_at?: string
          source_id: number
          source_name: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_raw_text?: string | null
          id?: number
          platform?: string
          post_id?: string
          post_owner?: string
          scraped_at?: string
          source_id?: number
          source_name?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smc_posts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "smc_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      smc_searches: {
        Row: {
          created_at: string
          executed_at: string
          execution_time_ms: number | null
          id: number
          query: string
          results_count: number
          updated_at: string
          user_ip: string | null
        }
        Insert: {
          created_at?: string
          executed_at?: string
          execution_time_ms?: number | null
          id?: number
          query: string
          results_count?: number
          updated_at?: string
          user_ip?: string | null
        }
        Update: {
          created_at?: string
          executed_at?: string
          execution_time_ms?: number | null
          id?: number
          query?: string
          results_count?: number
          updated_at?: string
          user_ip?: string | null
        }
        Relationships: []
      }
      smc_sources: {
        Row: {
          active: boolean
          created_at: string
          id: number
          last_scraped: string | null
          name: string
          platform: string
          updated_at: string
          url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          last_scraped?: string | null
          name: string
          platform?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          last_scraped?: string | null
          name?: string
          platform?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      stk_api_keys: {
        Row: {
          created_at: string
          encrypted_value: string
          id: string
          is_active: boolean | null
          key_name: string
          last_used: string | null
          project_id: string
          provider: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          encrypted_value: string
          id?: string
          is_active?: boolean | null
          key_name: string
          last_used?: string | null
          project_id: string
          provider: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          encrypted_value?: string
          id?: string
          is_active?: boolean | null
          key_name?: string
          last_used?: string | null
          project_id?: string
          provider?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stk_api_keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "stk_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stk_deployments: {
        Row: {
          build_logs: string | null
          created_at: string
          deployment_url: string | null
          environment: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          project_id: string
          provider: string
          status: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          build_logs?: string | null
          created_at?: string
          deployment_url?: string | null
          environment?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          provider: string
          status?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          build_logs?: string | null
          created_at?: string
          deployment_url?: string | null
          environment?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          provider?: string
          status?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stk_deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "stk_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stk_projects: {
        Row: {
          configuration: Json
          created_at: string
          deployment_url: string | null
          description: string | null
          estimated_price: number | null
          estimated_users: number | null
          features: string[] | null
          id: string
          industry: string
          name: string
          pricing_model: string | null
          repo_url: string | null
          stack: Json
          status: string | null
          tagline: string
          target_market: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          configuration: Json
          created_at?: string
          deployment_url?: string | null
          description?: string | null
          estimated_price?: number | null
          estimated_users?: number | null
          features?: string[] | null
          id?: string
          industry: string
          name: string
          pricing_model?: string | null
          repo_url?: string | null
          stack: Json
          status?: string | null
          tagline: string
          target_market: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string
          deployment_url?: string | null
          description?: string | null
          estimated_price?: number | null
          estimated_users?: number | null
          features?: string[] | null
          id?: string
          industry?: string
          name?: string
          pricing_model?: string | null
          repo_url?: string | null
          stack?: Json
          status?: string | null
          tagline?: string
          target_market?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stk_templates: {
        Row: {
          category: string | null
          config: Json
          created_at: string
          description: string
          downloads: number | null
          features: string[] | null
          framework: string
          github_url: string | null
          id: string
          is_public: boolean | null
          name: string
          preview_url: string | null
          rating: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          config: Json
          created_at?: string
          description: string
          downloads?: number | null
          features?: string[] | null
          framework: string
          github_url?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          preview_url?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          config?: Json
          created_at?: string
          description?: string
          downloads?: number | null
          features?: string[] | null
          framework?: string
          github_url?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          preview_url?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          sort_order: number | null
          subtask_text: string
          todo_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          subtask_text: string
          todo_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          subtask_text?: string
          todo_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_todo_id_fkey"
            columns: ["todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      task_execution_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          output: string | null
          started_at: string | null
          status: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          output?: string | null
          started_at?: string | null
          status: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          output?: string | null
          started_at?: string | null
          status?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_execution_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "automated_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string | null
          config: Json
          created_at: string
          description: string
          downloads: number | null
          features: string[] | null
          framework: string
          github_url: string | null
          id: string
          is_public: boolean | null
          name: string
          preview_url: string | null
          rating: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          config: Json
          created_at?: string
          description: string
          downloads?: number | null
          features?: string[] | null
          framework: string
          github_url?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          preview_url?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          config?: Json
          created_at?: string
          description?: string
          downloads?: number | null
          features?: string[] | null
          framework?: string
          github_url?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          preview_url?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          task_text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          task_text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          task_text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tool_categories: {
        Row: {
          created_at: string
          created_by: string | null
          icon_name: string | null
          id: string
          is_default: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          icon_name?: string | null
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          icon_name?: string | null
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          position: number | null
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          name: string
          position?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          position?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          service_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          service_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          service_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_dashboard_tools: {
        Row: {
          category_name: string
          created_at: string | null
          definition_updated_at: string | null
          description: string | null
          icon_alt_text: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          name: string
          sort_order: number | null
          tool_id: string
          updated_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string | null
          definition_updated_at?: string | null
          description?: string | null
          icon_alt_text?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          name: string
          sort_order?: number | null
          tool_id: string
          updated_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string | null
          definition_updated_at?: string | null
          description?: string | null
          icon_alt_text?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sort_order?: number | null
          tool_id?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cinet_documents_expiring: {
        Args: { p_days?: number }
        Returns: {
          created_at: string | null
          expiry_date: string | null
          file_url: string
          id: string
          profile_id: string | null
          type: string | null
        }[]
      }
      get_current_app_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_decrypted_api_key: {
        Args: { service_name_param: string; user_id_param: string }
        Returns: string
      }
      kutz_clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      kutz_create_audit_log: {
        Args: {
          p_details: Json
          p_event_type: string
          p_severity: Database["public"]["Enums"]["kutz_severity_level"]
          p_user_id: string
        }
        Returns: undefined
      }
      log_erpnext_sync: {
        Args: {
          p_erpnext_docname?: string
          p_erpnext_doctype?: string
          p_error_message?: string
          p_record_id: string
          p_response_data?: Json
          p_sync_direction: string
          p_sync_payload?: Json
          p_sync_status: string
          p_sync_type: string
          p_table_name: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_additional_data?: Json
          p_event_description: string
          p_event_type: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      smc_get_posts_by_source: {
        Args: { source_name_param: string }
        Returns: Json
      }
      smc_insert_scraped_posts: {
        Args: { posts_data: Json; source_name_param: string }
        Returns: number
      }
      store_encrypted_api_key: {
        Args: {
          api_key_param: string
          service_name_param: string
          user_id_param: string
        }
        Returns: string
      }
    }
    Enums: {
      kutz_asset_type: "image" | "video" | "audio" | "document" | "other"
      kutz_payment_status: "pending" | "succeeded" | "failed" | "refunded"
      kutz_project_status:
        | "draft"
        | "queued"
        | "executing"
        | "completed"
        | "failed"
        | "cancelled"
      kutz_severity_level: "INFO" | "WARNING" | "ERROR" | "CRITICAL"
      kutz_task_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "skipped"
      kutz_webhook_status: "received" | "processed" | "failed" | "ignored"
      user_role_type: "admin" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      kutz_asset_type: ["image", "video", "audio", "document", "other"],
      kutz_payment_status: ["pending", "succeeded", "failed", "refunded"],
      kutz_project_status: [
        "draft",
        "queued",
        "executing",
        "completed",
        "failed",
        "cancelled",
      ],
      kutz_severity_level: ["INFO", "WARNING", "ERROR", "CRITICAL"],
      kutz_task_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "skipped",
      ],
      kutz_webhook_status: ["received", "processed", "failed", "ignored"],
      user_role_type: ["admin", "employee"],
    },
  },
} as const
