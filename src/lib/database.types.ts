// Generated via the Supabase MCP `generate_typescript_types` tool against
// the live `pbcs` project. Regenerate with:
//   npx supabase gen types typescript --project-id twtmsdiavfktpqoixtgo > src/lib/database.types.ts
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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      courses: {
        Row: {
          archived_at: string | null
          created_at: string
          default_price: number
          default_weeks: number | null
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["course_kind"]
          name: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          default_price?: number
          default_weeks?: number | null
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["course_kind"]
          name: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          default_price?: number
          default_weeks?: number | null
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["course_kind"]
          name?: string
        }
        Relationships: []
      }
      enrolments: {
        Row: {
          agreed_price: number
          created_at: string
          ended_on: string | null
          enrolled_on: string
          id: string
          intake_id: string
          price_note: string | null
          status: Database["public"]["Enums"]["enrolment_status"]
          student_id: string
        }
        Insert: {
          agreed_price: number
          created_at?: string
          ended_on?: string | null
          enrolled_on?: string
          id?: string
          intake_id: string
          price_note?: string | null
          status?: Database["public"]["Enums"]["enrolment_status"]
          student_id: string
        }
        Update: {
          agreed_price?: number
          created_at?: string
          ended_on?: string | null
          enrolled_on?: string
          id?: string
          intake_id?: string
          price_note?: string | null
          status?: Database["public"]["Enums"]["enrolment_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrolments_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intake_summary"
            referencedColumns: ["intake_id"]
          },
          {
            foreignKeyName: "enrolments_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrolments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_balances"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrolments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          archived_at: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      intakes: {
        Row: {
          capacity: number | null
          course_id: string
          created_at: string
          end_date: string | null
          id: string
          instructor_id: string | null
          label: string | null
          start_date: string
        }
        Insert: {
          capacity?: number | null
          course_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          instructor_id?: string | null
          label?: string | null
          start_date: string
        }
        Update: {
          capacity?: number | null
          course_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          instructor_id?: string | null
          label?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "intakes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intakes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          archived_at: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          national_id: string | null
          notes: string | null
          phone: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          national_id?: string | null
          notes?: string | null
          phone: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          national_id?: string | null
          notes?: string | null
          phone?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          amount_usd: number | null
          created_at: string
          created_by: string | null
          currency: string
          enrolment_id: string
          id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          method: string | null
          note: string | null
          occurred_on: string
          rate_to_usd: number
          reference: string | null
          reversal_reason: string | null
          reverses_id: string | null
        }
        Insert: {
          amount: number
          amount_usd?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          enrolment_id: string
          id?: string
          kind: Database["public"]["Enums"]["txn_kind"]
          method?: string | null
          note?: string | null
          occurred_on?: string
          rate_to_usd?: number
          reference?: string | null
          reversal_reason?: string | null
          reverses_id?: string | null
        }
        Update: {
          amount?: number
          amount_usd?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          enrolment_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["txn_kind"]
          method?: string | null
          note?: string | null
          occurred_on?: string
          rate_to_usd?: number
          reference?: string | null
          reversal_reason?: string | null
          reverses_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: false
            referencedRelation: "enrolment_balances"
            referencedColumns: ["enrolment_id"]
          },
          {
            foreignKeyName: "transactions_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: false
            referencedRelation: "enrolments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_reverses_id_fkey"
            columns: ["reverses_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      enrolment_balances: {
        Row: {
          adjustments: number | null
          agreed_price: number | null
          balance: number | null
          charged: number | null
          enrolment_id: string | null
          intake_id: string | null
          last_payment_on: string | null
          paid: number | null
          status: Database["public"]["Enums"]["enrolment_status"] | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrolments_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intake_summary"
            referencedColumns: ["intake_id"]
          },
          {
            foreignKeyName: "enrolments_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrolments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_balances"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrolments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_summary: {
        Row: {
          active_students: number | null
          intake_id: string | null
          outstanding: number | null
        }
        Relationships: []
      }
      student_balances: {
        Row: {
          balance: number | null
          full_name: string | null
          last_payment_on: string | null
          phone: string | null
          student_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      course_kind: "short_course" | "programme"
      enrolment_status: "enrolled" | "completed" | "withdrawn"
      txn_kind: "charge" | "payment" | "adjustment"
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
      course_kind: ["short_course", "programme"],
      enrolment_status: ["enrolled", "completed", "withdrawn"],
      txn_kind: ["charge", "payment", "adjustment"],
    },
  },
} as const
