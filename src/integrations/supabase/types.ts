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
      attendance: {
        Row: {
          classes_attended: number
          created_at: string | null
          date: string
          enrollment_number: string
          id: string
          status: string | null
          student_id: string
          subject: string
          total_classes: number
        }
        Insert: {
          classes_attended?: number
          created_at?: string | null
          date: string
          enrollment_number: string
          id?: string
          status?: string | null
          student_id: string
          subject: string
          total_classes?: number
        }
        Update: {
          classes_attended?: number
          created_at?: string | null
          date?: string
          enrollment_number?: string
          id?: string
          status?: string | null
          student_id?: string
          subject?: string
          total_classes?: number
        }
        Relationships: []
      }
      candidates: {
        Row: {
          course_name: string | null
          created_at: string | null
          election_id: string | null
          enrollment_number: string
          id: string
          manifesto: string | null
          name: string
          photo_url: string | null
          position: Database["public"]["Enums"]["candidate_position"]
          section: string | null
          student_id: string
          vote_count: number | null
          year: number | null
        }
        Insert: {
          course_name?: string | null
          created_at?: string | null
          election_id?: string | null
          enrollment_number: string
          id?: string
          manifesto?: string | null
          name: string
          photo_url?: string | null
          position: Database["public"]["Enums"]["candidate_position"]
          section?: string | null
          student_id: string
          vote_count?: number | null
          year?: number | null
        }
        Update: {
          course_name?: string | null
          created_at?: string | null
          election_id?: string | null
          enrollment_number?: string
          id?: string
          manifesto?: string | null
          name?: string
          photo_url?: string | null
          position?: Database["public"]["Enums"]["candidate_position"]
          section?: string | null
          student_id?: string
          vote_count?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      class_representatives: {
        Row: {
          course_name: string
          designated_at: string | null
          enrollment_number: string
          id: string
          name: string
          section: string
          student_id: string
          year: number
        }
        Insert: {
          course_name: string
          designated_at?: string | null
          enrollment_number: string
          id?: string
          name: string
          section: string
          student_id: string
          year: number
        }
        Update: {
          course_name?: string
          designated_at?: string | null
          enrollment_number?: string
          id?: string
          name?: string
          section?: string
          student_id?: string
          year?: number
        }
        Relationships: []
      }
      elections: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["election_status"] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["election_status"] | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["election_status"] | null
          title?: string
        }
        Relationships: []
      }
      faculty_notifications: {
        Row: {
          created_at: string | null
          faculty_id: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_notifications_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_profiles: {
        Row: {
          assigned_course: string | null
          assigned_section: string | null
          assigned_year: number | null
          created_at: string | null
          department: string | null
          email: string
          faculty_id: string
          id: string
          name: string
          phone: string | null
          position: string | null
          updated_at: string | null
          verify: boolean | null
        }
        Insert: {
          assigned_course?: string | null
          assigned_section?: string | null
          assigned_year?: number | null
          created_at?: string | null
          department?: string | null
          email: string
          faculty_id: string
          id: string
          name: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          verify?: boolean | null
        }
        Update: {
          assigned_course?: string | null
          assigned_section?: string | null
          assigned_year?: number | null
          created_at?: string | null
          department?: string | null
          email?: string
          faculty_id?: string
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          verify?: boolean | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          comment: string | null
          created_at: string | null
          faculty_id: string | null
          id: string
          rating: number | null
          student_enrollment: string
          student_id: string
        }
        Insert: {
          category: string
          comment?: string | null
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          rating?: number | null
          student_enrollment: string
          student_id: string
        }
        Update: {
          category?: string
          comment?: string | null
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          rating?: number | null
          student_enrollment?: string
          student_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          message: string
          target_course: string | null
          target_section: string | null
          target_year: number | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message: string
          target_course?: string | null
          target_section?: string | null
          target_year?: number | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message?: string
          target_course?: string | null
          target_section?: string | null
          target_year?: number | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      performance_reports: {
        Row: {
          created_at: string | null
          enrollment_number: string
          generated_by: string | null
          id: string
          report_data: Json
          student_id: string
          term: string
        }
        Insert: {
          created_at?: string | null
          enrollment_number: string
          generated_by?: string | null
          id?: string
          report_data: Json
          student_id: string
          term: string
        }
        Update: {
          created_at?: string | null
          enrollment_number?: string
          generated_by?: string | null
          id?: string
          report_data?: Json
          student_id?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "faculty_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_applications: {
        Row: {
          applied_at: string | null
          enrollment_number: string
          id: string
          placement_id: string | null
          student_id: string
        }
        Insert: {
          applied_at?: string | null
          enrollment_number: string
          id?: string
          placement_id?: string | null
          student_id: string
        }
        Update: {
          applied_at?: string | null
          enrollment_number?: string
          id?: string
          placement_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_applications_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "placements"
            referencedColumns: ["id"]
          },
        ]
      }
      placements: {
        Row: {
          company_name: string
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          id: string
          link: string | null
          status: string | null
          title: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          link?: string | null
          status?: string | null
          title: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          link?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          course_name: string
          created_at: string | null
          email: string
          enrollment_number: string
          id: string
          name: string
          phone: string | null
          section: string
          student_id: string
          updated_at: string | null
          verify: boolean | null
          year: number
        }
        Insert: {
          course_name: string
          created_at?: string | null
          email: string
          enrollment_number: string
          id: string
          name: string
          phone?: string | null
          section: string
          student_id: string
          updated_at?: string | null
          verify?: boolean | null
          year: number
        }
        Update: {
          course_name?: string
          created_at?: string | null
          email?: string
          enrollment_number?: string
          id?: string
          name?: string
          phone?: string | null
          section?: string
          student_id?: string
          updated_at?: string | null
          verify?: boolean | null
          year?: number
        }
        Relationships: []
      }
      student_marks: {
        Row: {
          created_at: string | null
          credits: number | null
          enrollment_number: string
          external_marks: number | null
          grade: string | null
          id: string
          internal_marks: number | null
          student_id: string
          subject: string
          term: string
          total_marks: number | null
        }
        Insert: {
          created_at?: string | null
          credits?: number | null
          enrollment_number: string
          external_marks?: number | null
          grade?: string | null
          id?: string
          internal_marks?: number | null
          student_id: string
          subject: string
          term: string
          total_marks?: number | null
        }
        Update: {
          created_at?: string | null
          credits?: number | null
          enrollment_number?: string
          external_marks?: number | null
          grade?: string | null
          id?: string
          internal_marks?: number | null
          student_id?: string
          subject?: string
          term?: string
          total_marks?: number | null
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          course_name: string
          created_at: string | null
          description: string | null
          file_type: string | null
          file_url: string
          id: string
          section: string | null
          subject: string
          title: string
          updated_at: string | null
          uploaded_by: string | null
          year: number
        }
        Insert: {
          course_name: string
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          section?: string | null
          subject: string
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
          year: number
        }
        Update: {
          course_name?: string
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          section?: string | null
          subject?: string
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "faculty_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          course_name: string
          created_at: string | null
          created_by: string | null
          day_of_week: string
          end_time: string
          faculty_name: string | null
          id: string
          room_number: string | null
          section: string
          start_time: string
          subject: string
          updated_at: string | null
          year: number
        }
        Insert: {
          course_name: string
          created_at?: string | null
          created_by?: string | null
          day_of_week: string
          end_time: string
          faculty_name?: string | null
          id?: string
          room_number?: string | null
          section: string
          start_time: string
          subject: string
          updated_at?: string | null
          year: number
        }
        Update: {
          course_name?: string
          created_at?: string | null
          created_by?: string | null
          day_of_week?: string
          end_time?: string
          faculty_name?: string | null
          id?: string
          room_number?: string | null
          section?: string
          start_time?: string
          subject?: string
          updated_at?: string | null
          year?: number
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
      votes: {
        Row: {
          candidate_id: string | null
          election_id: string | null
          id: string
          voted_at: string | null
          voter_enrollment: string
        }
        Insert: {
          candidate_id?: string | null
          election_id?: string | null
          id?: string
          voted_at?: string | null
          voter_enrollment: string
        }
        Update: {
          candidate_id?: string | null
          election_id?: string | null
          id?: string
          voted_at?: string | null
          voter_enrollment?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_enrollment: { Args: never; Returns: string }
      get_current_user_student_id: { Args: never; Returns: string }
      has_elevated_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "director"
        | "chairman"
        | "vice_principal"
        | "hod"
        | "class_coordinator"
        | "associate_professor"
        | "assistant_professor"
        | "placement_coordinator"
      candidate_position:
        | "president"
        | "vice_president"
        | "secretary"
        | "class_representative"
      election_status: "active" | "completed" | "cancelled"
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
        "admin",
        "director",
        "chairman",
        "vice_principal",
        "hod",
        "class_coordinator",
        "associate_professor",
        "assistant_professor",
        "placement_coordinator",
      ],
      candidate_position: [
        "president",
        "vice_president",
        "secretary",
        "class_representative",
      ],
      election_status: ["active", "completed", "cancelled"],
    },
  },
} as const
