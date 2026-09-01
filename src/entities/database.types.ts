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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_control: {
        Row: {
          created_at: string
          page: string
          roles: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          page: string
          roles?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          page?: string
          roles?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          role: string
          username: string
        }
        Insert: {
          role: string
          username: string
        }
        Update: {
          role?: string
          username?: string
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          label: string
          last_used_at: string | null
          token_hash: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          last_used_at?: string | null
          token_hash: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          last_used_at?: string | null
          token_hash?: string
        }
        Relationships: []
      }
      apply_mail: {
        Row: {
          content: string | null
          created_at: string
          id: string
          login_id: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          login_id?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          login_id?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      characters: {
        Row: {
          default_stats: Json | null
          id: string
          name: string
          name_e: string | null
          order_num: number | null
        }
        Insert: {
          default_stats?: Json | null
          id: string
          name: string
          name_e?: string | null
          order_num?: number | null
        }
        Update: {
          default_stats?: Json | null
          id?: string
          name?: string
          name_e?: string | null
          order_num?: number | null
        }
        Relationships: []
      }
      costumes: {
        Row: {
          character_id: string | null
          dashboard_shown: boolean | null
          id: string
          image_name: string | null
          is_new: boolean | null
          name: string
          name_e: string | null
          order_num: number | null
        }
        Insert: {
          character_id?: string | null
          dashboard_shown?: boolean | null
          id: string
          image_name?: string | null
          is_new?: boolean | null
          name: string
          name_e?: string | null
          order_num?: number | null
        }
        Update: {
          character_id?: string | null
          dashboard_shown?: boolean | null
          id?: string
          image_name?: string | null
          is_new?: boolean | null
          name?: string
          name_e?: string | null
          order_num?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "costumes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      fiend_hunter_bosses: {
        Row: {
          created_at: string | null
          difficulty: number
          hp: number
          id: string
          season: number
        }
        Insert: {
          created_at?: string | null
          difficulty: number
          hp: number
          id?: string
          season: number
        }
        Update: {
          created_at?: string | null
          difficulty?: number
          hp?: number
          id?: string
          season?: number
        }
        Relationships: []
      }
      fiend_hunter_seasons: {
        Row: {
          created_at: string | null
          days: number
          id: string
          name: string
          season: number
        }
        Insert: {
          created_at?: string | null
          days: number
          id?: string
          name: string
          season: number
        }
        Update: {
          created_at?: string | null
          days?: number
          id?: string
          name?: string
          season?: number
        }
        Relationships: []
      }
      ghost_records: {
        Row: {
          created_at: string
          member_id: string
          season_number: number | null
          uid: string
        }
        Insert: {
          created_at?: string
          member_id: string
          season_number?: number | null
          uid?: string
        }
        Update: {
          created_at?: string
          member_id?: string
          season_number?: number | null
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "ghost_record_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_raid_records: {
        Row: {
          guild_id: string | null
          id: string
          member_score_median: number | null
          note: string | null
          overkill: number | null
          rank: string | null
          score: number | null
          season_id: number | null
          updated_at: string | null
        }
        Insert: {
          guild_id?: string | null
          id?: string
          member_score_median?: number | null
          note?: string | null
          overkill?: number | null
          rank?: string | null
          score?: number | null
          season_id?: number | null
          updated_at?: string | null
        }
        Update: {
          guild_id?: string | null
          id?: string
          member_score_median?: number | null
          note?: string | null
          overkill?: number | null
          rank?: string | null
          score?: number | null
          season_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guild_raid_records_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_raid_records_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "raid_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          id: string
          is_display: boolean | null
          name: string
          order_num: number | null
          percent_shown: number | null
          serial: number | null
          tier: number | null
          username: string | null
        }
        Insert: {
          id: string
          is_display?: boolean | null
          name: string
          order_num?: number | null
          percent_shown?: number | null
          serial?: number | null
          tier?: number | null
          username?: string | null
        }
        Update: {
          id?: string
          is_display?: boolean | null
          name?: string
          order_num?: number | null
          percent_shown?: number | null
          serial?: number | null
          tier?: number | null
          username?: string | null
        }
        Relationships: []
      }
      lb_bchelindishes: {
        Row: {
          character_used: string | null
          created_at: string | null
          difficulty: string
          id: string
          player_name: string
          score: number
          user_id: string
        }
        Insert: {
          character_used?: string | null
          created_at?: string | null
          difficulty: string
          id?: string
          player_name: string
          score: number
          user_id?: string
        }
        Update: {
          character_used?: string | null
          created_at?: string | null
          difficulty?: string
          id?: string
          player_name?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      lb_speedrefining: {
        Row: {
          created_at: string
          id: string
          player_name: string
          total_time: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          player_name: string
          total_time: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          player_name?: string
          total_time?: number
          user_id?: string | null
        }
        Relationships: []
      }
      member_notes: {
        Row: {
          archive_remark: string | null
          created_at: string
          friend_group: string | null
          is_reserved: boolean | null
          member_id: string
          note: string | null
          uid: string
          updated_at: string
        }
        Insert: {
          archive_remark?: string | null
          created_at?: string
          friend_group?: string | null
          is_reserved?: boolean | null
          member_id: string
          note?: string | null
          uid?: string
          updated_at?: string
        }
        Update: {
          archive_remark?: string | null
          created_at?: string
          friend_group?: string | null
          is_reserved?: boolean | null
          member_id?: string
          note?: string | null
          uid?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_raid_records: {
        Row: {
          created_at: string
          id: string
          member_id: string
          overkill: number | null
          score: number
          season_guild: string | null
          season_id: number
          season_note: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          overkill?: number | null
          score?: number
          season_guild?: string | null
          season_id: number
          season_note?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          overkill?: number | null
          score?: number
          season_guild?: string | null
          season_id?: number
          season_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_raid_records_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_raid_records_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "raid_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          archive_remark: string | null
          color: string | null
          created_at: string | null
          discord_id: number | null
          exclusive_weapons: Json | null
          guild_id: string | null
          id: string
          "is-reserved": boolean | null
          name: string
          note: string | null
          records: Json | null
          role: string | null
          status: string | null
          total_score: number | null
          updated_at: number | null
        }
        Insert: {
          archive_remark?: string | null
          color?: string | null
          created_at?: string | null
          discord_id?: number | null
          exclusive_weapons?: Json | null
          guild_id?: string | null
          id: string
          "is-reserved"?: boolean | null
          name: string
          note?: string | null
          records?: Json | null
          role?: string | null
          status?: string | null
          total_score?: number | null
          updated_at?: number | null
        }
        Update: {
          archive_remark?: string | null
          color?: string | null
          created_at?: string | null
          discord_id?: number | null
          exclusive_weapons?: Json | null
          guild_id?: string | null
          id?: string
          "is-reserved"?: boolean | null
          name?: string
          note?: string | null
          records?: Json | null
          role?: string | null
          status?: string | null
          total_score?: number | null
          updated_at?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      members_archive_history: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          from_guild_id: string | null
          id: string
          member_id: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          from_guild_id?: string | null
          id?: string
          member_id?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          from_guild_id?: string | null
          id?: string
          member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_archive_history_from_guild_id_fkey"
            columns: ["from_guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_archive_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          created_at: string
          discord_id: string
          discord_username: string | null
          display_name: string | null
          id: string | null
          user_guilds: string | null
          user_role: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          discord_id: string
          discord_username?: string | null
          display_name?: string | null
          id?: string | null
          user_guilds?: string | null
          user_role?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          discord_id?: string
          discord_username?: string | null
          display_name?: string | null
          id?: string | null
          user_guilds?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      raid_seasons: {
        Row: {
          created_at: string | null
          description: string | null
          even_rounds: boolean | null
          id: number
          is_archived: boolean | null
          period_text: string
          score_threshold: number | null
          season_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          even_rounds?: boolean | null
          id?: number
          is_archived?: boolean | null
          period_text: string
          score_threshold?: number | null
          season_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          even_rounds?: boolean | null
          id?: number
          is_archived?: boolean | null
          period_text?: string
          score_threshold?: number | null
          season_number?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          application_pending_count: number | null
          bgm_default_volume: number | null
          bgm_url: string | null
          fiend_days: number | null
          id: number
          index_message: string | null
          index_percent_type: string | null
          is_debug_mode: boolean | null
        }
        Insert: {
          application_pending_count?: number | null
          bgm_default_volume?: number | null
          bgm_url?: string | null
          fiend_days?: number | null
          id?: number
          index_message?: string | null
          index_percent_type?: string | null
          is_debug_mode?: boolean | null
        }
        Update: {
          application_pending_count?: number | null
          bgm_default_volume?: number | null
          bgm_url?: string | null
          fiend_days?: number | null
          id?: number
          index_message?: string | null
          index_percent_type?: string | null
          is_debug_mode?: boolean | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          discord_id: string | null
          id: string
          level: string
          message: string
          source: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          discord_id?: string | null
          id?: string
          level: string
          message: string
          source: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          discord_id?: string | null
          id?: string
          level?: string
          message?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_members_bulk: { Args: { payload: Json }; Returns: undefined }
      get_admin_role: { Args: never; Returns: string }
      get_user_id_by_email: { Args: { target_email: string }; Returns: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
