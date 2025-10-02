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
          eta_days: number
          headhunter_id: string
          id: string
          job_id: string
          proposed_fee_model: string
          proposed_fee_value: number
          status: string
          updated_at: string
        }
        Insert: {
          cover_note?: string | null
          created_at?: string
          eta_days: number
          headhunter_id: string
          id?: string
          job_id: string
          proposed_fee_model: string
          proposed_fee_value: number
          status?: string
          updated_at?: string
        }
        Update: {
          cover_note?: string | null
          created_at?: string
          eta_days?: number
          headhunter_id?: string
          id?: string
          job_id?: string
          proposed_fee_model?: string
          proposed_fee_value?: number
          status?: string
          updated_at?: string
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
        }
        Insert: {
          created_at?: string
          employer_id: string
          headhunter_id: string
          id?: string
          job_id: string
          message?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          employer_id?: string
          headhunter_id?: string
          id?: string
          job_id?: string
          message?: string | null
          status?: string
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
          benefits: string[] | null
          budget_currency: string | null
          budget_max: number | null
          budget_min: number | null
          company_name: string | null
          created_at: string
          created_by: string
          description: string
          employment_type: string | null
          id: string
          industry: string | null
          location: string | null
          remote_policy: string | null
          required_skills: string[] | null
          salary_range: string | null
          seniority: string | null
          skills_must: string[] | null
          skills_nice: string[] | null
          status: string
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          benefits?: string[] | null
          budget_currency?: string | null
          budget_max?: number | null
          budget_min?: number | null
          company_name?: string | null
          created_at?: string
          created_by: string
          description: string
          employment_type?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          remote_policy?: string | null
          required_skills?: string[] | null
          salary_range?: string | null
          seniority?: string | null
          skills_must?: string[] | null
          skills_nice?: string[] | null
          status?: string
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          benefits?: string[] | null
          budget_currency?: string | null
          budget_max?: number | null
          budget_min?: number | null
          company_name?: string | null
          created_at?: string
          created_by?: string
          description?: string
          employment_type?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          remote_policy?: string | null
          required_skills?: string[] | null
          salary_range?: string | null
          seniority?: string | null
          skills_must?: string[] | null
          skills_nice?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          from_user: string
          id: string
          is_read: boolean
          job_id: string | null
          to_user: string
        }
        Insert: {
          body: string
          created_at?: string
          from_user: string
          id?: string
          is_read?: boolean
          job_id?: string | null
          to_user: string
        }
        Update: {
          body?: string
          created_at?: string
          from_user?: string
          id?: string
          is_read?: boolean
          job_id?: string | null
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
          is_read: boolean
          message: string
          payload: Json | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          payload?: Json | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          payload?: Json | null
          related_id?: string | null
          title?: string
          type?: string
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
          account_status: string | null
          active_searches: number | null
          availability: string | null
          avatar_url: string | null
          avg_time_to_fill_days: number | null
          bio: string | null
          certifications: string[] | null
          company: string | null
          company_benefits: string[] | null
          company_culture: string | null
          company_hq: string | null
          company_mission: string | null
          company_name: string | null
          company_sector: string | null
          company_size: string | null
          cover_image_url: string | null
          created_at: string
          email: string
          email_verified: boolean | null
          expertise: string[] | null
          first_reminder_sent_at: string | null
          founded_year: number | null
          hourly_rate: number | null
          id: string
          industries: string[] | null
          languages: string[] | null
          linkedin: string | null
          location: string | null
          name: string | null
          onboarding_completed: boolean | null
          open_positions: number | null
          placement_fee_percent: number | null
          placements_count: number | null
          portfolio_links: string[] | null
          rating_avg: number | null
          regions: string[] | null
          response_time: string | null
          response_time_hours: number | null
          role: string
          second_reminder_sent_at: string | null
          skills: string[] | null
          specializations: string[] | null
          success_rate: number | null
          team_size: number | null
          updated_at: string
          verification_sent_at: string | null
          verified: boolean | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          account_status?: string | null
          active_searches?: number | null
          availability?: string | null
          avatar_url?: string | null
          avg_time_to_fill_days?: number | null
          bio?: string | null
          certifications?: string[] | null
          company?: string | null
          company_benefits?: string[] | null
          company_culture?: string | null
          company_hq?: string | null
          company_mission?: string | null
          company_name?: string | null
          company_sector?: string | null
          company_size?: string | null
          cover_image_url?: string | null
          created_at?: string
          email: string
          email_verified?: boolean | null
          expertise?: string[] | null
          first_reminder_sent_at?: string | null
          founded_year?: number | null
          hourly_rate?: number | null
          id: string
          industries?: string[] | null
          languages?: string[] | null
          linkedin?: string | null
          location?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          open_positions?: number | null
          placement_fee_percent?: number | null
          placements_count?: number | null
          portfolio_links?: string[] | null
          rating_avg?: number | null
          regions?: string[] | null
          response_time?: string | null
          response_time_hours?: number | null
          role: string
          second_reminder_sent_at?: string | null
          skills?: string[] | null
          specializations?: string[] | null
          success_rate?: number | null
          team_size?: number | null
          updated_at?: string
          verification_sent_at?: string | null
          verified?: boolean | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          account_status?: string | null
          active_searches?: number | null
          availability?: string | null
          avatar_url?: string | null
          avg_time_to_fill_days?: number | null
          bio?: string | null
          certifications?: string[] | null
          company?: string | null
          company_benefits?: string[] | null
          company_culture?: string | null
          company_hq?: string | null
          company_mission?: string | null
          company_name?: string | null
          company_sector?: string | null
          company_size?: string | null
          cover_image_url?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean | null
          expertise?: string[] | null
          first_reminder_sent_at?: string | null
          founded_year?: number | null
          hourly_rate?: number | null
          id?: string
          industries?: string[] | null
          languages?: string[] | null
          linkedin?: string | null
          location?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          open_positions?: number | null
          placement_fee_percent?: number | null
          placements_count?: number | null
          portfolio_links?: string[] | null
          rating_avg?: number | null
          regions?: string[] | null
          response_time?: string | null
          response_time_hours?: number | null
          role?: string
          second_reminder_sent_at?: string | null
          skills?: string[] | null
          specializations?: string[] | null
          success_rate?: number | null
          team_size?: number | null
          updated_at?: string
          verification_sent_at?: string | null
          verified?: boolean | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          active_searches: number
          avatar_url: string
          bio: string
          certifications: string[]
          company: string
          company_benefits: string[]
          company_culture: string
          company_mission: string
          company_name: string
          company_sector: string
          company_size: string
          cover_image_url: string
          created_at: string
          email: string
          expertise: string[]
          founded_year: number
          hourly_rate: number
          id: string
          industries: string[]
          languages: string[]
          linkedin: string
          location: string
          name: string
          open_positions: number
          placement_fee_percent: number
          placements_count: number
          rating_avg: number
          response_time: string
          role: string
          skills: string[]
          specializations: string[]
          success_rate: number
          team_size: number
          verified: boolean
          website: string
          years_experience: number
        }[]
      }
      get_public_profiles: {
        Args: { profile_role?: string }
        Returns: {
          active_searches: number
          avatar_url: string
          bio: string
          certifications: string[]
          company: string
          company_benefits: string[]
          company_culture: string
          company_mission: string
          company_name: string
          company_sector: string
          company_size: string
          cover_image_url: string
          created_at: string
          email: string
          expertise: string[]
          founded_year: number
          hourly_rate: number
          id: string
          industries: string[]
          languages: string[]
          linkedin: string
          location: string
          name: string
          open_positions: number
          placement_fee_percent: number
          placements_count: number
          rating_avg: number
          response_time: string
          role: string
          skills: string[]
          specializations: string[]
          success_rate: number
          team_size: number
          verified: boolean
          website: string
          years_experience: number
        }[]
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
