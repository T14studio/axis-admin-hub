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
      admin_users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          client_type: string | null
          cpf: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_type?: string | null
          cpf: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_type?: string | null
          cpf?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contract_files: {
        Row: {
          contract_id: string
          created_at: string
          file_name: string
          file_url: string
          id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          file_name: string
          file_url: string
          id?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_files_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_cpf: string
          client_id: string
          contract_number: string
          contract_type: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          pdf_url: string | null
          property_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
          value: number | null
        }
        Insert: {
          client_cpf: string
          client_id: string
          contract_number: string
          contract_type: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          property_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          value?: number | null
        }
        Update: {
          client_cpf?: string
          client_id?: string
          contract_number?: string
          contract_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          property_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          initial_message: string | null
          interest: string | null
          interest_type: string | null
          name: string
          notes: string | null
          origin: string | null
          phone: string | null
          related_property_id: string | null
          responsible: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          initial_message?: string | null
          interest?: string | null
          interest_type?: string | null
          name: string
          notes?: string | null
          origin?: string | null
          phone?: string | null
          related_property_id?: string | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          initial_message?: string | null
          interest?: string | null
          interest_type?: string | null
          name?: string
          notes?: string | null
          origin?: string | null
          phone?: string | null
          related_property_id?: string | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_property"
            columns: ["related_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          additional_features: string | null
          address: string | null
          bathrooms: number | null
          bedrooms: number | null
          built_area: number | null
          city: string | null
          condo_fee: number | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          iptu: number | null
          land_area: number | null
          neighborhood: string | null
          parking_spots: number | null
          price: number | null
          property_type: string
          published: boolean
          purpose: string
          reference_code: string | null
          responsible: string | null
          state: string | null
          status: Database["public"]["Enums"]["property_status"]
          suites: number | null
          title: string
          updated_at: string
        }
        Insert: {
          additional_features?: string | null
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          built_area?: number | null
          city?: string | null
          condo_fee?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          iptu?: number | null
          land_area?: number | null
          neighborhood?: string | null
          parking_spots?: number | null
          price?: number | null
          property_type?: string
          published?: boolean
          purpose?: string
          reference_code?: string | null
          responsible?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          suites?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          additional_features?: string | null
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          built_area?: number | null
          city?: string | null
          condo_fee?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          iptu?: number | null
          land_area?: number | null
          neighborhood?: string | null
          parking_spots?: number | null
          price?: number | null
          property_type?: string
          published?: boolean
          purpose?: string
          reference_code?: string | null
          responsible?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          suites?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_main: boolean
          property_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_main?: boolean
          property_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_main?: boolean
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_admin_access: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin_master"
        | "admin_operacional"
        | "comercial"
        | "administrativo"
        | "financeiro"
      contract_status:
        | "ativo"
        | "pendente"
        | "encerrado"
        | "vencendo"
        | "vencido"
      lead_status:
        | "novo"
        | "em_atendimento"
        | "qualificado"
        | "visita_agendada"
        | "proposta"
        | "convertido"
        | "perdido"
      property_status: "ativo" | "inativo" | "rascunho"
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
      app_role: [
        "admin_master",
        "admin_operacional",
        "comercial",
        "administrativo",
        "financeiro",
      ],
      contract_status: [
        "ativo",
        "pendente",
        "encerrado",
        "vencendo",
        "vencido",
      ],
      lead_status: [
        "novo",
        "em_atendimento",
        "qualificado",
        "visita_agendada",
        "proposta",
        "convertido",
        "perdido",
      ],
      property_status: ["ativo", "inativo", "rascunho"],
    },
  },
} as const
