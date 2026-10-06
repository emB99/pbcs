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
      enrolment_status_events: {
        Row: {
          changed_at: string
          changed_by: string | null
          enrolment_id: string
          from_status: Database["public"]["Enums"]["enrolment_status"] | null
          id: string
          to_status: Database["public"]["Enums"]["enrolment_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          enrolment_id: string
          from_status?: Database["public"]["Enums"]["enrolment_status"] | null
          id?: string
          to_status: Database["public"]["Enums"]["enrolment_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          enrolment_id?: string
          from_status?: Database["public"]["Enums"]["enrolment_status"] | null
          id?: string
          to_status?: Database["public"]["Enums"]["enrolment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "enrolment_status_events_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: false
            referencedRelation: "enrolments"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_scale_bands: {
        Row: {
          description: string | null
          grade: string
          id: string
          is_pass: boolean
          min_mark: number
        }
        Insert: {
          description?: string | null
          grade: string
          id?: string
          is_pass?: boolean
          min_mark: number
        }
        Update: {
          description?: string | null
          grade?: string
          id?: string
          is_pass?: boolean
          min_mark?: number
        }
        Relationships: []
      }
      grades: {
        Row: {
          comment: string | null
          created_at: string
          enrolment_id: string
          entered_by: string | null
          grade: string | null
          id: string
          intake_subject_id: string
          mark: number | null
          term_id: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          enrolment_id: string
          entered_by?: string | null
          grade?: string | null
          id?: string
          intake_subject_id: string
          mark?: number | null
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          enrolment_id?: string
          entered_by?: string | null
          grade?: string | null
          id?: string
          intake_subject_id?: string
          mark?: number | null
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: false
            referencedRelation: "enrolments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_intake_subject_id_fkey"
            columns: ["intake_subject_id"]
            isOneToOne: false
            referencedRelation: "intake_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          notes: string | null
          phone: string | null
          relationship: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          content_type: string | null
          created_at: string
          id: string
          name: string
          size_bytes: number | null
          storage_path: string
          student_id: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          id?: string
          name: string
          size_bytes?: number | null
          storage_path: string
          student_id: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          id?: string
          name?: string
          size_bytes?: number | null
          storage_path?: string
          student_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
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
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          user_id?: string | null
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
      intake_subjects: {
        Row: {
          created_at: string
          id: string
          instructor_id: string | null
          intake_id: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id?: string | null
          intake_id: string
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string | null
          intake_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_subjects_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_subjects_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      report_comments: {
        Row: {
          class_teacher_comment: string | null
          enrolment_id: string
          head_comment: string | null
          id: string
          term_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          class_teacher_comment?: string | null
          enrolment_id: string
          head_comment?: string | null
          id?: string
          term_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          class_teacher_comment?: string | null
          enrolment_id?: string
          head_comment?: string | null
          id?: string
          term_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_comments_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: false
            referencedRelation: "enrolments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_comments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: boolean
          logo_path: string | null
          name: string
          next_student_number: number
          phone: string | null
          school_type: Database["public"]["Enums"]["school_type"]
          student_number_prefix: string
          terminology: Json
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: boolean
          logo_path?: string | null
          name: string
          next_student_number?: number
          phone?: string | null
          school_type?: Database["public"]["Enums"]["school_type"]
          student_number_prefix?: string
          terminology?: Json
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: boolean
          logo_path?: string | null
          name?: string
          next_student_number?: number
          phone?: string | null
          school_type?: Database["public"]["Enums"]["school_type"]
          student_number_prefix?: string
          terminology?: Json
        }
        Relationships: []
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
          phone: string | null
          date_of_birth: string | null
          gender: string | null
          photo_path: string | null
          status: Database["public"]["Enums"]["student_status"]
          student_number: string
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
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          photo_path?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          student_number?: string
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
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          photo_path?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          student_number?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          archived_at: string | null
          code: string | null
          course_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          course_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          course_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          academic_year: string
          created_at: string
          end_date: string
          id: string
          name: string
          results_locked: boolean
          start_date: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          end_date: string
          id?: string
          name: string
          results_locked?: boolean
          start_date: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          results_locked?: boolean
          start_date?: string
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
      intake_roster: {
        Args: { p_intake_id: string }
        Returns: {
          enrolment_id: string
          student_id: string
          student_number: string
          full_name: string
        }[]
      }
      my_form_classes: {
        Args: Record<PropertyKey, never>
        Returns: {
          intake_id: string
          intake_label: string | null
          start_date: string
          end_date: string | null
          course_name: string
          student_count: number
        }[]
      }
      save_report_comments: {
        Args: { p_rows: Json; p_term_id: string | null }
        Returns: number
      }
      reset_grade_scale: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      save_grade_scale: {
        Args: { p_bands: Json }
        Returns: undefined
      }
      save_grades: {
        Args: { p_intake_subject_id: string; p_rows: Json; p_term_id: string | null }
        Returns: number
      }
      class_roster: {
        Args: { p_intake_subject_id: string }
        Returns: {
          enrolment_id: string
          student_id: string
          student_number: string
          full_name: string
          gender: string | null
          student_status: Database["public"]["Enums"]["student_status"]
          guardian_name: string | null
          guardian_phone: string | null
        }[]
      }
      grant_teacher_access: {
        Args: { p_instructor_id: string }
        Returns: string
      }
      my_classes: {
        Args: Record<PropertyKey, never>
        Returns: {
          intake_subject_id: string
          subject_name: string
          subject_code: string | null
          intake_id: string
          intake_label: string | null
          start_date: string
          end_date: string | null
          course_name: string
          student_count: number
        }[]
      }
      revoke_teacher_access: {
        Args: { p_instructor_id: string }
        Returns: undefined
      }
      claim_school: {
        Args: {
          p_name: string
          p_prefix: string
          p_type: Database["public"]["Enums"]["school_type"]
        }
        Returns: undefined
      }
      school_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "staff" | "teacher"
      course_kind: "short_course" | "programme"
      enrolment_status: "enrolled" | "completed" | "withdrawn"
      school_type: "college" | "k12"
      student_status: "active" | "graduated" | "withdrawn" | "suspended"
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
      app_role: ["owner", "admin", "staff", "teacher"],
      course_kind: ["short_course", "programme"],
      enrolment_status: ["enrolled", "completed", "withdrawn"],
      school_type: ["college", "k12"],
      student_status: ["active", "graduated", "withdrawn", "suspended"],
      txn_kind: ["charge", "payment", "adjustment"],
    },
  },
} as const
