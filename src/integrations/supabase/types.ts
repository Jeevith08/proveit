export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          log_date: string;
          user_id: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          log_date: string;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          log_date?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      college_checkins: {
        Row: {
          attended: boolean;
          created_at: string;
          id: string;
          log_date: string;
          reason: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attended: boolean;
          created_at?: string;
          id?: string;
          log_date?: string;
          reason?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          attended?: boolean;
          created_at?: string;
          id?: string;
          log_date?: string;
          reason?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      daily_tasks: {
        Row: {
          created_at: string;
          id: string;
          log_date: string;
          reason: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          log_date?: string;
          reason?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          log_date?: string;
          reason?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          applied_on: string;
          company: string;
          created_at: string;
          id: string;
          job_type?: string | null;
          reason?: string | null;
          referrals_asked?: number | null;
          rejection_reason?: string | null;
          role: string;
          round?: string | null;
          stage: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          applied_on?: string;
          company: string;
          created_at?: string;
          id?: string;
          job_type?: string | null;
          reason?: string | null;
          referrals_asked?: number | null;
          rejection_reason?: string | null;
          role: string;
          round?: string | null;
          stage?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          applied_on?: string;
          company?: string;
          created_at?: string;
          id?: string;
          job_type?: string | null;
          reason?: string | null;
          referrals_asked?: number | null;
          rejection_reason?: string | null;
          role?: string;
          round?: string | null;
          stage?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      learning_sessions: {
        Row: {
          created_at: string;
          hours: number;
          id: string;
          log_date: string;
          topic: string;
          track: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          hours: number;
          id?: string;
          log_date?: string;
          topic: string;
          track: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          hours?: number;
          id?: string;
          log_date?: string;
          topic?: string;
          track?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      monthly_goals: {
        Row: {
          created_at: string;
          id: string;
          month: string;
          progress: number;
          target: number;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          month?: string;
          progress?: number;
          target: number;
          title: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          month?: string;
          progress?: number;
          target?: number;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          college: string | null;
          created_at: string;
          date_of_birth: string | null;
          dream: string | null;
          goal: string | null;
          name: string | null;
          passion: string | null;
          passout_year: number | null;
          resume_path: string | null;
          tagline: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          college?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          dream?: string | null;
          goal?: string | null;
          name?: string | null;
          passion?: string | null;
          passout_year?: number | null;
          resume_path?: string | null;
          tagline?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          college?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          dream?: string | null;
          goal?: string | null;
          name?: string | null;
          passion?: string | null;
          passout_year?: number | null;
          resume_path?: string | null;
          tagline?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          link: string | null;
          name: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          link?: string | null;
          name: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          link?: string | null;
          name?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
