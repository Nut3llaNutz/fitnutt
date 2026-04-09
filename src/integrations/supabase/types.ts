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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_logs: {
        Row: {
          created_at: string
          creatine_taken: boolean
          date: string
          id: string
          supplements_taken: Json | null
          updated_at: string
          user_id: string
          whey_taken: boolean
        }
        Insert: {
          created_at?: string
          creatine_taken?: boolean
          date?: string
          id?: string
          supplements_taken?: Json | null
          updated_at?: string
          user_id: string
          whey_taken?: boolean
        }
        Update: {
          created_at?: string
          creatine_taken?: boolean
          date?: string
          id?: string
          supplements_taken?: Json | null
          updated_at?: string
          user_id?: string
          whey_taken?: boolean
        }
        Relationships: []
      }
      foods: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fats: number
          id: string
          name: string
          protein: number
          serving_size: number
          serving_unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          fats?: number
          id?: string
          name: string
          protein?: number
          serving_size?: number
          serving_unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fats?: number
          id?: string
          name?: string
          protein?: number
          serving_size?: number
          serving_unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          created_at: string
          daily_log_id: string
          food_id: string | null
          id: string
          meal_type: string
          quantity: number
          food_name: string
          calories: number
          protein: number
          carbs: number
          fats: number
          serving_size: number
          serving_unit: string
        }
        Insert: {
          created_at?: string
          daily_log_id: string
          food_id?: string | null
          id?: string
          meal_type: string
          quantity?: number
          food_name: string
          calories?: number
          protein?: number
          carbs?: number
          fats?: number
          serving_size?: number
          serving_unit?: string
        }
        Update: {
          created_at?: string
          daily_log_id?: string
          food_id?: string | null
          id?: string
          meal_type?: string
          quantity?: number
          food_name?: string
          calories?: number
          protein?: number
          carbs?: number
          fats?: number
          serving_size?: number
          serving_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_entries_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          calorie_target: number
          carb_target: number
          created_at: string
          fat_target: number
          id: string
          notification_time: string
          protein_target: number
          nut3lla_tips_enabled: boolean | null
          tutorial_completed: boolean | null
          supplements: Json | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calorie_target?: number
          carb_target?: number
          created_at?: string
          fat_target?: number
          id?: string
          notification_time?: string
          protein_target?: number
          nut3lla_tips_enabled?: boolean | null
          tutorial_completed?: boolean | null
          supplements?: Json | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calorie_target?: number
          carb_target?: number
          created_at?: string
          fat_target?: number
          id?: string
          notification_time?: string
          protein_target?: number
          nut3lla_tips_enabled?: boolean | null
          tutorial_completed?: boolean | null
          supplements?: Json | null
          theme?: string
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
      get_admin_detailed_stats: {
        Args: {
          p_timeframe?: string
        }
        Returns: {
          summary: {
            total_users: number
            total_logs_all_time: number
            total_logs_today: number
            total_calories_all_time: number
            total_calories_today: number
            active_residents_today: number
            active_guests_today: number
            total_guests_ever: number
          }
          trends: {
            date: string
            users: number
            logs: number
          }[]
          ranks: {
            rank: string
            count: number
          }[]
          top_items: {
            name: string
            count: number
          }[]
        }
      }
      track_guest_session: {
        Args: {
          p_fingerprint: string
        }
        Returns: void
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
