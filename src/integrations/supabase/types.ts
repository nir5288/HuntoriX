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
      applications: {
        Row: {
          cover_note: string | null
          created_at: string
          eta_days: number | null
          headhunter_id: string
          id: string
          job_id: string
          proposed_fee_model:
            | Database["public"]["Enums"]["pricing_model"]
            | null
          proposed_fee_value: number | null
          status: Database["public"]["Enums"]["application_status"] | null
        }
        Insert: {
          cover_note?: string | null
          created_at?: string
          eta_days?: number | null
          headhunter_id: string
          id?: string
          job_id: string
          proposed_fee_model?:
            | Database["public"]["Enums"]["pricing_model"]
            | null
          proposed_fee_value?: number | null
          status?: Database["public"]["Enums"]["application_status"] | null
        }
        Update: {
          cover_note?: string | null
          created_at?: string
          eta_days?: number | null
          headhunter_id?: string
          id?: string
          job_id?: string
          proposed_fee_model?:
            | Database["public"]["Enums"]["pricing_model"]
            | null
          proposed_fee_value?: number | null
          status?: Database["public"]["Enums"]["application_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_headhunter_id_fkey"
            columns: ["headhunter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_invitations: {
        Row: {
          created_at: string
          employer_id: string
          headhunter_id: string
          id: string
          job_id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employer_id: string
          headhunter_id: string
          id?: string
          job_id: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employer_id?: string
          headhunter_id?: string
          id?: string
          job_id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_invitations_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invitations_headhunter_id_fkey"
            columns: ["headhunter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invitations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          budget_currency: string | null
          budget_max: number | null
          budget_min: number | null
          candidate_quota: number | null
          created_at: string
          created_by: string
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          fee_model: Database["public"]["Enums"]["pricing_model"] | null
          fee_value: number | null
          id: string
          industry: string | null
          location: string | null
          selected_headhunter: string | null
          seniority: Database["public"]["Enums"]["seniority_level"] | null
          skills_must: string[] | null
          skills_nice: string[] | null
          sla_days: number | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string
          visibility: Database["public"]["Enums"]["job_visibility"] | null
        }
        Insert: {
          budget_currency?: string | null
          budget_max?: number | null
          budget_min?: number | null
          candidate_quota?: number | null
          created_at?: string
          created_by: string
          description: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          fee_model?: Database["public"]["Enums"]["pricing_model"] | null
          fee_value?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          selected_headhunter?: string | null
          seniority?: Database["public"]["Enums"]["seniority_level"] | null
          skills_must?: string[] | null
          skills_nice?: string[] | null
          sla_days?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title: string
          visibility?: Database["public"]["Enums"]["job_visibility"] | null
        }
        Update: {
          budget_currency?: string | null
          budget_max?: number | null
          budget_min?: number | null
          candidate_quota?: number | null
          created_at?: string
          created_by?: string
          description?: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          fee_model?: Database["public"]["Enums"]["pricing_model"] | null
          fee_value?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          selected_headhunter?: string | null
          seniority?: Database["public"]["Enums"]["seniority_level"] | null
          skills_must?: string[] | null
          skills_nice?: string[] | null
          sla_days?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string
          visibility?: Database["public"]["Enums"]["job_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_selected_headhunter_fkey"
            columns: ["selected_headhunter"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          body: string
          created_at: string
          from_user: string
          id: string
          job_id: string
          to_user: string
        }
        Insert: {
          attachments?: string[] | null
          body: string
          created_at?: string
          from_user: string
          id?: string
          job_id: string
          to_user: string
        }
        Update: {
          attachments?: string[] | null
          body?: string
          created_at?: string
          from_user?: string
          id?: string
          job_id?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          payload: Json | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          payload?: Json | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          payload?: Json | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: boolean | null
          avatar_url: string | null
          avg_time_to_fill_days: number | null
          bio: string | null
          company_culture: string | null
          company_hq: string | null
          company_mission: string | null
          company_name: string | null
          company_sector: string | null
          company_size: string | null
          contact_person: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string
          email: string
          expertise: string[] | null
          hourly_rate: number | null
          id: string
          industries: string[] | null
          languages: string[] | null
          name: string | null
          placement_fee_percent: number | null
          placements_count: number | null
          portfolio_links: string[] | null
          pricing_model: Database["public"]["Enums"]["pricing_model"] | null
          rating_avg: number | null
          regions: string[] | null
          response_time_hours: number | null
          role: Database["public"]["Enums"]["app_role"]
          skills: string[] | null
          status: Database["public"]["Enums"]["user_status"] | null
          success_rate: number | null
          team_members: Json | null
          verified: boolean | null
          years_experience: number | null
        }
        Insert: {
          availability?: boolean | null
          avatar_url?: string | null
          avg_time_to_fill_days?: number | null
          bio?: string | null
          company_culture?: string | null
          company_hq?: string | null
          company_mission?: string | null
          company_name?: string | null
          company_sector?: string | null
          company_size?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          email: string
          expertise?: string[] | null
          hourly_rate?: number | null
          id: string
          industries?: string[] | null
          languages?: string[] | null
          name?: string | null
          placement_fee_percent?: number | null
          placements_count?: number | null
          portfolio_links?: string[] | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          rating_avg?: number | null
          regions?: string[] | null
          response_time_hours?: number | null
          role: Database["public"]["Enums"]["app_role"]
          skills?: string[] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          success_rate?: number | null
          team_members?: Json | null
          verified?: boolean | null
          years_experience?: number | null
        }
        Update: {
          availability?: boolean | null
          avatar_url?: string | null
          avg_time_to_fill_days?: number | null
          bio?: string | null
          company_culture?: string | null
          company_hq?: string | null
          company_mission?: string | null
          company_name?: string | null
          company_sector?: string | null
          company_size?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          email?: string
          expertise?: string[] | null
          hourly_rate?: number | null
          id?: string
          industries?: string[] | null
          languages?: string[] | null
          name?: string | null
          placement_fee_percent?: number | null
          placements_count?: number | null
          portfolio_links?: string[] | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          rating_avg?: number | null
          regions?: string[] | null
          response_time_hours?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          success_rate?: number | null
          team_members?: Json | null
          verified?: boolean | null
          years_experience?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          about_user_id: string
          by_user_id: string
          comment: string | null
          created_at: string
          id: string
          job_id: string | null
          rating: number
        }
        Insert: {
          about_user_id: string
          by_user_id: string
          comment?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          rating: number
        }
        Update: {
          about_user_id?: string
          by_user_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_about_user_id_fkey"
            columns: ["about_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_by_user_id_fkey"
            columns: ["by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_own_contact_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          contact_person: string
          contact_phone: string
          email: string
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          availability: boolean
          avatar_url: string
          avg_time_to_fill_days: number
          bio: string
          company_culture: string
          company_hq: string
          company_mission: string
          company_name: string
          company_sector: string
          company_size: string
          cover_image_url: string
          created_at: string
          expertise: string[]
          hourly_rate: number
          id: string
          industries: string[]
          languages: string[]
          name: string
          placement_fee_percent: number
          placements_count: number
          portfolio_links: string[]
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          rating_avg: number
          regions: string[]
          response_time_hours: number
          role: Database["public"]["Enums"]["app_role"]
          skills: string[]
          status: Database["public"]["Enums"]["user_status"]
          success_rate: number
          team_members: Json
          verified: boolean
          years_experience: number
        }[]
      }
      get_public_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability: boolean
          avatar_url: string
          avg_time_to_fill_days: number
          bio: string
          company_culture: string
          company_hq: string
          company_mission: string
          company_name: string
          company_sector: string
          company_size: string
          cover_image_url: string
          created_at: string
          expertise: string[]
          hourly_rate: number
          id: string
          industries: string[]
          languages: string[]
          name: string
          placement_fee_percent: number
          placements_count: number
          portfolio_links: string[]
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          rating_avg: number
          regions: string[]
          response_time_hours: number
          role: Database["public"]["Enums"]["app_role"]
          skills: string[]
          status: Database["public"]["Enums"]["user_status"]
          success_rate: number
          team_members: Json
          verified: boolean
          years_experience: number
        }[]
      }
    }
    Enums: {
      app_role: "employer" | "headhunter" | "admin"
      application_status:
        | "submitted"
        | "shortlisted"
        | "rejected"
        | "withdrawn"
        | "selected"
      employment_type: "full_time" | "contract" | "temp"
      job_status: "open" | "shortlisted" | "awarded" | "closed" | "on_hold"
      job_visibility: "public" | "invite_only"
      notification_type:
        | "new_message"
        | "new_application"
        | "status_change"
        | "admin_notice"
        | "job_invitation"
      pricing_model: "percent_fee" | "flat" | "hourly"
      seniority_level: "junior" | "mid" | "senior" | "lead" | "exec"
      user_status: "active" | "suspended" | "pending"
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
      app_role: ["employer", "headhunter", "admin"],
      application_status: [
        "submitted",
        "shortlisted",
        "rejected",
        "withdrawn",
        "selected",
      ],
      employment_type: ["full_time", "contract", "temp"],
      job_status: ["open", "shortlisted", "awarded", "closed", "on_hold"],
      job_visibility: ["public", "invite_only"],
      notification_type: [
        "new_message",
        "new_application",
        "status_change",
        "admin_notice",
        "job_invitation",
      ],
      pricing_model: ["percent_fee", "flat", "hourly"],
      seniority_level: ["junior", "mid", "senior", "lead", "exec"],
      user_status: ["active", "suspended", "pending"],
    },
  },
} as const
