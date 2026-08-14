// Hand-written stand-in for `supabase gen types typescript --project-id <ref>`.
// Regenerate this file from the real project once it exists; the shape below
// mirrors what that command produces so no other code needs to change.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          national_id: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          national_id?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
        Relationships: [];
      };
      instructors: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["instructors"]["Insert"]>;
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          name: string;
          kind: Database["public"]["Enums"]["course_kind"];
          default_price: string;
          default_weeks: number | null;
          description: string | null;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          kind: Database["public"]["Enums"]["course_kind"];
          default_price?: string;
          default_weeks?: number | null;
          description?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [];
      };
      intakes: {
        Row: {
          id: string;
          course_id: string;
          label: string | null;
          start_date: string;
          end_date: string | null;
          instructor_id: string | null;
          capacity: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          label?: string | null;
          start_date: string;
          end_date?: string | null;
          instructor_id?: string | null;
          capacity?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["intakes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "intakes_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "intakes_instructor_id_fkey";
            columns: ["instructor_id"];
            referencedRelation: "instructors";
            referencedColumns: ["id"];
          },
        ];
      };
      enrolments: {
        Row: {
          id: string;
          student_id: string;
          intake_id: string;
          agreed_price: string;
          price_note: string | null;
          status: Database["public"]["Enums"]["enrolment_status"];
          enrolled_on: string;
          ended_on: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          intake_id: string;
          agreed_price: string;
          price_note?: string | null;
          status?: Database["public"]["Enums"]["enrolment_status"];
          enrolled_on?: string;
          ended_on?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["enrolments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "enrolments_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrolments_intake_id_fkey";
            columns: ["intake_id"];
            referencedRelation: "intakes";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          enrolment_id: string;
          kind: Database["public"]["Enums"]["txn_kind"];
          amount: string;
          currency: string;
          rate_to_usd: string;
          amount_usd: string;
          occurred_on: string;
          method: string | null;
          reference: string | null;
          note: string | null;
          reverses_id: string | null;
          reversal_reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          enrolment_id: string;
          kind: Database["public"]["Enums"]["txn_kind"];
          amount: string;
          currency?: string;
          rate_to_usd?: string;
          occurred_on?: string;
          method?: string | null;
          reference?: string | null;
          note?: string | null;
          reverses_id?: string | null;
          reversal_reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "transactions_enrolment_id_fkey";
            columns: ["enrolment_id"];
            referencedRelation: "enrolments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_reverses_id_fkey";
            columns: ["reverses_id"];
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      enrolment_balances: {
        Row: {
          enrolment_id: string;
          student_id: string;
          intake_id: string;
          agreed_price: string;
          status: Database["public"]["Enums"]["enrolment_status"];
          charged: string;
          paid: string;
          adjustments: string;
          balance: string;
          last_payment_on: string | null;
        };
        Relationships: [];
      };
      student_balances: {
        Row: {
          student_id: string;
          full_name: string;
          phone: string;
          balance: string;
          last_payment_on: string | null;
        };
        Relationships: [];
      };
      intake_summary: {
        Row: {
          intake_id: string;
          active_students: number;
          outstanding: string;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      course_kind: "short_course" | "programme";
      enrolment_status: "enrolled" | "completed" | "withdrawn";
      txn_kind: "charge" | "payment" | "adjustment";
    };
    CompositeTypes: Record<string, never>;
  };
}
