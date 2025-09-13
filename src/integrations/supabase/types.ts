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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      ai_prompt_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          language_code: string
          template_content: string
          template_key: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_code: string
          template_content: string
          template_key: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_code?: string
          template_content?: string
          template_key?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_templates_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          stripe_payment_intent: string | null
          transaction_type: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          stripe_payment_intent?: string | null
          transaction_type?: string | null
          type?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          stripe_payment_intent?: string | null
          transaction_type?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      featured_stories: {
        Row: {
          created_at: string | null
          featured_by: string
          featured_until: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          reason: string | null
          story_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          featured_by: string
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          reason?: string | null
          story_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          featured_by?: string
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          reason?: string | null
          story_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          ai_model_config: Json | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          native_name: string
          prompt_templates: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_model_config?: Json | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          native_name: string
          prompt_templates?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_model_config?: Json | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          native_name?: string
          prompt_templates?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          credits: number | null
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          preferred_language: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          credits?: number | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          preferred_language?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          credits?: number | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          preferred_language?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_language_fkey"
            columns: ["preferred_language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      reading_history: {
        Row: {
          created_at: string | null
          id: string
          last_read_at: string | null
          progress: number | null
          story_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          progress?: number | null
          story_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          progress?: number | null
          story_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          age_group: string | null
          audio_generation_status: string | null
          author_id: string | null
          cover_image: string | null
          cover_image_url: string | null
          created_at: string | null
          credits_used: number | null
          description: string | null
          full_story_audio_url: string | null
          genre: string | null
          id: string
          is_complete: boolean | null
          is_completed: boolean | null
          is_public: boolean | null
          language_code: string | null
          metadata: Json | null
          original_language_code: string | null
          prompt: string | null
          selected_voice_id: string | null
          selected_voice_name: string | null
          status: string | null
          story_mode: string | null
          story_type: string | null
          target_age: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          age_group?: string | null
          audio_generation_status?: string | null
          author_id?: string | null
          cover_image?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          credits_used?: number | null
          description?: string | null
          full_story_audio_url?: string | null
          genre?: string | null
          id?: string
          is_complete?: boolean | null
          is_completed?: boolean | null
          is_public?: boolean | null
          language_code?: string | null
          metadata?: Json | null
          original_language_code?: string | null
          prompt?: string | null
          selected_voice_id?: string | null
          selected_voice_name?: string | null
          status?: string | null
          story_mode?: string | null
          story_type?: string | null
          target_age?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          age_group?: string | null
          audio_generation_status?: string | null
          author_id?: string | null
          cover_image?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          credits_used?: number | null
          description?: string | null
          full_story_audio_url?: string | null
          genre?: string | null
          id?: string
          is_complete?: boolean | null
          is_completed?: boolean | null
          is_public?: boolean | null
          language_code?: string | null
          metadata?: Json | null
          original_language_code?: string | null
          prompt?: string | null
          selected_voice_id?: string | null
          selected_voice_name?: string | null
          status?: string | null
          story_mode?: string | null
          story_type?: string | null
          target_age?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stories_original_language_code_fkey"
            columns: ["original_language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      story_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_analytics_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_content_i18n: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_primary: boolean | null
          language_code: string
          story_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean | null
          language_code: string
          story_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean | null
          language_code?: string
          story_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_content_i18n_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "story_content_i18n_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_segments: {
        Row: {
          audio_generation_status: string | null
          audio_url: string | null
          choices: Json | null
          content: string | null
          created_at: string | null
          id: string
          image_generation_status: string | null
          image_prompt: string | null
          image_url: string | null
          is_end: boolean | null
          is_ending: boolean | null
          metadata: Json | null
          segment_number: number
          segment_text: string | null
          story_id: string | null
        }
        Insert: {
          audio_generation_status?: string | null
          audio_url?: string | null
          choices?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_generation_status?: string | null
          image_prompt?: string | null
          image_url?: string | null
          is_end?: boolean | null
          is_ending?: boolean | null
          metadata?: Json | null
          segment_number: number
          segment_text?: string | null
          story_id?: string | null
        }
        Update: {
          audio_generation_status?: string | null
          audio_url?: string | null
          choices?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_generation_status?: string | null
          image_prompt?: string | null
          image_url?: string | null
          is_end?: boolean | null
          is_ending?: boolean | null
          metadata?: Json | null
          segment_number?: number
          segment_text?: string | null
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_segments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_segments_i18n: {
        Row: {
          audio_url: string | null
          choices: Json | null
          content: string | null
          created_at: string | null
          id: string
          language_code: string
          segment_id: string
        }
        Insert: {
          audio_url?: string | null
          choices?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          language_code: string
          segment_id: string
        }
        Update: {
          audio_url?: string | null
          choices?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          language_code?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_segments_i18n_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "story_segments_i18n_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "story_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_limits: {
        Row: {
          created_at: string | null
          credits_per_month: number | null
          id: string
          story_limit: number | null
          tier_name: string
          updated_at: string | null
          voice_minutes_per_month: number | null
        }
        Insert: {
          created_at?: string | null
          credits_per_month?: number | null
          id?: string
          story_limit?: number | null
          tier_name: string
          updated_at?: string | null
          voice_minutes_per_month?: number | null
        }
        Update: {
          created_at?: string | null
          credits_per_month?: number | null
          id?: string
          story_limit?: number | null
          tier_name?: string
          updated_at?: string | null
          voice_minutes_per_month?: number | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string | null
          current_balance: number | null
          id: string
          last_monthly_refresh: string | null
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_balance?: number | null
          id?: string
          last_monthly_refresh?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_balance?: number | null
          id?: string
          last_monthly_refresh?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          rating: number | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          rating?: number | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          rating?: number | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      visibility_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          credits_to_add: number
          description_text: string
          ref_id?: string
          ref_type?: string
          transaction_metadata?: Json
          user_uuid: string
        }
        Returns: boolean
      }
      add_credits_rpc: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_operation_type: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_feature_story: {
        Args: {
          p_featured_until?: string
          p_priority?: number
          p_story_id: string
        }
        Returns: boolean
      }
      admin_get_completed_stories: {
        Args: { limit_count?: number }
        Returns: {
          age_group: string
          author_name: string
          created_at: string
          genre: string
          id: string
          is_featured: boolean
          title: string
        }[]
      }
      admin_get_featured_stories: {
        Args: Record<PropertyKey, never>
        Returns: {
          author_name: string
          created_at: string
          featured_by: string
          featured_until: string
          id: string
          is_active: boolean
          priority: number
          story_id: string
          title: string
        }[]
      }
      admin_unfeature_story: {
        Args: { p_story_id: string }
        Returns: boolean
      }
      admin_update_featured_priority: {
        Args: { p_priority: number; p_story_id: string }
        Returns: boolean
      }
      deduct_credits: {
        Args: { amount: number; user_uuid: string }
        Returns: boolean
      }
      deduct_credits_atomic: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_operation_type: string
          p_user_id: string
        }
        Returns: Json
      }
      get_credit_transactions: {
        Args: { limit_count?: number; user_uuid?: string }
        Returns: {
          amount: number
          created_at: string
          description: string
          id: string
          metadata: Json
          type: string
          user_id: string
        }[]
      }
      get_current_month_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          credits_used: number
          stories_created: number
          voice_minutes_used: number
        }[]
      }
      get_featured_stories: {
        Args: { limit_count?: number }
        Returns: {
          age_group: string
          author_name: string
          cover_image_url: string
          created_at: string
          description: string
          genre: string
          position: number
          story_id: string
          title: string
        }[]
      }
      get_prompt_template: {
        Args: { language_code?: string; template_key: string }
        Returns: string
      }
      get_user_credits: {
        Args: { user_uuid: string }
        Returns: {
          can_refresh: boolean
          current_balance: number
          last_monthly_refresh: string
          total_earned: number
          total_spent: number
        }[]
      }
      get_user_feedback: {
        Args: { p_user_id?: string }
        Returns: {
          created_at: string
          description: string
          id: string
          rating: number
          status: string
          title: string
          type: string
        }[]
      }
      get_user_language: {
        Args: { user_uuid?: string }
        Returns: string
      }
      get_user_transactions: {
        Args: { p_limit?: number }
        Returns: {
          amount: number
          created_at: string
          description: string
          id: string
          type: string
        }[]
      }
      get_visibility_settings: {
        Args: { p_user_id?: string }
        Returns: {
          setting_key: string
          setting_value: Json
        }[]
      }
      has_role: {
        Args: { check_role: string }
        Returns: boolean
      }
      increment_featured_view_count: {
        Args: { p_story_id: string }
        Returns: undefined
      }
      set_visibility_setting: {
        Args: { p_setting_key: string; p_setting_value: Json }
        Returns: boolean
      }
      spend_credits: {
        Args: {
          credits_to_spend: number
          description_text: string
          ref_id?: string
          ref_type?: string
          transaction_metadata?: Json
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
