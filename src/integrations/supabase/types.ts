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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_sessions: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          messages: Json | null
          module_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          messages?: Json | null
          module_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          messages?: Json | null
          module_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_recipients: {
        Row: {
          added_by: string
          created_at: string
          email: string
          id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_name: string
          contract_info: Json | null
          created_at: string
          energy_supply_info: Json | null
          id: string
          industry: string | null
          ruc: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          contract_info?: Json | null
          created_at?: string
          energy_supply_info?: Json | null
          id?: string
          industry?: string | null
          ruc?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          contract_info?: Json | null
          created_at?: string
          energy_supply_info?: Json | null
          id?: string
          industry?: string | null
          ruc?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coes_demand_data: {
        Row: {
          created_at: string | null
          daily_forecast: number | null
          date: string
          executed_power: number | null
          id: string
          weekly_forecast: number | null
        }
        Insert: {
          created_at?: string | null
          daily_forecast?: number | null
          date: string
          executed_power?: number | null
          id?: string
          weekly_forecast?: number | null
        }
        Update: {
          created_at?: string | null
          daily_forecast?: number | null
          date?: string
          executed_power?: number | null
          id?: string
          weekly_forecast?: number | null
        }
        Relationships: []
      }
      coes_forecast: {
        Row: {
          created_at: string | null
          ejecutado: number | null
          fecha: string
          id: string
          pronostico: number | null
          rango_inferior: number | null
          rango_superior: number | null
          reprogramado: number | null
        }
        Insert: {
          created_at?: string | null
          ejecutado?: number | null
          fecha: string
          id?: string
          pronostico?: number | null
          rango_inferior?: number | null
          rango_superior?: number | null
          reprogramado?: number | null
        }
        Update: {
          created_at?: string | null
          ejecutado?: number | null
          fecha?: string
          id?: string
          pronostico?: number | null
          rango_inferior?: number | null
          rango_superior?: number | null
          reprogramado?: number | null
        }
        Relationships: []
      }
      coes_historical: {
        Row: {
          created_at: string | null
          ejecutado: number
          fecha: string
          id: string
        }
        Insert: {
          created_at?: string | null
          ejecutado: number
          fecha: string
          id?: string
        }
        Update: {
          created_at?: string | null
          ejecutado?: number
          fecha?: string
          id?: string
        }
        Relationships: []
      }
      company_modules: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          company_id: string
          enabled: boolean
          id: string
          module_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          company_id: string
          enabled?: boolean
          id?: string
          module_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          company_id?: string
          enabled?: boolean
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          deleted: boolean
          document_type: string
          file_path: string
          filename: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted?: boolean
          document_type?: string
          file_path: string
          filename: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted?: boolean
          document_type?: string
          file_path?: string
          filename?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      forecast_settings: {
        Row: {
          id: string
          last_update: string | null
          modulation_time: string | null
          risk_level: string | null
        }
        Insert: {
          id?: string
          last_update?: string | null
          modulation_time?: string | null
          risk_level?: string | null
        }
        Update: {
          id?: string
          last_update?: string | null
          modulation_time?: string | null
          risk_level?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          demand_kw: number | null
          energy_kwh: number | null
          id: string
          invoice_data: Json | null
          invoice_number: string | null
          period_end: string | null
          period_start: string | null
          total_amount: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          demand_kw?: number | null
          energy_kwh?: number | null
          id?: string
          invoice_data?: Json | null
          invoice_number?: string | null
          period_end?: string | null
          period_start?: string | null
          total_amount?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          demand_kw?: number | null
          energy_kwh?: number | null
          id?: string
          invoice_data?: Json | null
          invoice_number?: string | null
          period_end?: string | null
          period_start?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_data: {
        Row: {
          client_id: string
          created_at: string
          current_a: number | null
          demand_kw: number | null
          energy_kwh: number | null
          id: string
          metadata: Json | null
          meter_id: string | null
          power_factor: number | null
          timestamp: string
          voltage: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          current_a?: number | null
          demand_kw?: number | null
          energy_kwh?: number | null
          id?: string
          metadata?: Json | null
          meter_id?: string | null
          power_factor?: number | null
          timestamp: string
          voltage?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          current_a?: number | null
          demand_kw?: number | null
          energy_kwh?: number | null
          id?: string
          metadata?: Json | null
          meter_id?: string | null
          power_factor?: number | null
          timestamp?: string
          voltage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meter_data_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      modulation_days: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_modulated: boolean | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_modulated?: boolean | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_modulated?: boolean | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      plan_inquiries: {
        Row: {
          company_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          plan_selected: string
          position: string | null
          status: string
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          plan_selected: string
          position?: string | null
          status?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          plan_selected?: string
          position?: string | null
          status?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          ai_explanation: string | null
          client_id: string | null
          created_at: string
          id: string
          prediction_date: string
          price_data: Json | null
          risk_level: string | null
        }
        Insert: {
          ai_explanation?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          prediction_date: string
          price_data?: Json | null
          risk_level?: string | null
        }
        Update: {
          ai_explanation?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          prediction_date?: string
          price_data?: Json | null
          risk_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          role: string
          telegram_chat_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          telegram_chat_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          client_id: string
          content: Json | null
          created_at: string
          created_by: string | null
          id: string
          module_slug: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          module_slug: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          module_slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          plan: string
          start_date: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          plan: string
          start_date: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_authorized_chats: {
        Row: {
          chat_id: number
          created_at: string
          id: string
          label: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string
          id?: string
          label?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string
          id?: string
          label?: string | null
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          alerta_enviada_hoy: boolean
          bcc_emails: Json
          chat_id: number
          estado_conversacion: string
          id: string
          last_interaction: string
          rango_actual: string | null
          riesgo_actual: string | null
          update_offset: number
          updated_at: string
        }
        Insert: {
          alerta_enviada_hoy?: boolean
          bcc_emails?: Json
          chat_id: number
          estado_conversacion?: string
          id?: string
          last_interaction?: string
          rango_actual?: string | null
          riesgo_actual?: string | null
          update_offset?: number
          updated_at?: string
        }
        Update: {
          alerta_enviada_hoy?: boolean
          bcc_emails?: Json
          chat_id?: number
          estado_conversacion?: string
          id?: string
          last_interaction?: string
          rango_actual?: string | null
          riesgo_actual?: string | null
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_modules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_client_ids: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "client_user" | "technical_user"
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
      app_role: ["super_admin", "admin", "client_user", "technical_user"],
    },
  },
} as const
