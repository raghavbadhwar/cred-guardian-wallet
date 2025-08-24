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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string | null
          id: string
          size_bytes: number | null
          storage_path: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          size_bytes?: number | null
          storage_path: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      credentials: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          folder_id: string | null
          hash: string | null
          id: string
          issued_date: string
          issuer: string
          issuer_domain: string
          issuer_name: string | null
          payload: Json | null
          status: string
          subject: string
          tags: string[] | null
          title: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          folder_id?: string | null
          hash?: string | null
          id?: string
          issued_date: string
          issuer: string
          issuer_domain: string
          issuer_name?: string | null
          payload?: Json | null
          status: string
          subject: string
          tags?: string[] | null
          title?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          folder_id?: string | null
          hash?: string | null
          id?: string
          issued_date?: string
          issuer?: string
          issuer_domain?: string
          issuer_name?: string | null
          payload?: Json | null
          status?: string
          subject?: string
          tags?: string[] | null
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      digilocker_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          last_sync_at: string | null
          refresh_token: string | null
          scope: string | null
          subject_id: string | null
          token_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          subject_id?: string | null
          token_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          subject_id?: string | null
          token_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      digilocker_imports: {
        Row: {
          created_at: string
          doc_id: string
          doc_type: string | null
          id: string
          issued_at: string | null
          issuer: string | null
          raw_metadata: Json
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_id: string
          doc_type?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          raw_metadata?: Json
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          doc_id?: string
          doc_type?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          raw_metadata?: Json
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      imports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          source: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          source: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_share: Json | null
          display_name: string | null
          id: string
          language: string | null
          recovery_email: string | null
          security_preferences: Json | null
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_share?: Json | null
          display_name?: string | null
          id?: string
          language?: string | null
          recovery_email?: string | null
          security_preferences?: Json | null
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_share?: Json | null
          display_name?: string | null
          id?: string
          language?: string | null
          recovery_email?: string | null
          security_preferences?: Json | null
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          id: string
          ip_hash: string | null
          last_seen: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          last_seen?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          last_seen?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      share_analytics: {
        Row: {
          id: string
          location_data: Json | null
          share_id: string | null
          verification_result: Json | null
          viewed_at: string | null
          viewer_ip_hash: string | null
          viewer_user_agent: string | null
        }
        Insert: {
          id?: string
          location_data?: Json | null
          share_id?: string | null
          verification_result?: Json | null
          viewed_at?: string | null
          viewer_ip_hash?: string | null
          viewer_user_agent?: string | null
        }
        Update: {
          id?: string
          location_data?: Json | null
          share_id?: string | null
          verification_result?: Json | null
          viewed_at?: string | null
          viewer_ip_hash?: string | null
          viewer_user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_analytics_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "shares"
            referencedColumns: ["id"]
          },
        ]
      }
      share_views: {
        Row: {
          access_code_attempt: boolean | null
          city: string | null
          country: string | null
          id: number
          ip_hash: string | null
          ok: boolean | null
          referrer_domain: string | null
          share_id: string | null
          ua_hash: string | null
          viewed_at: string | null
        }
        Insert: {
          access_code_attempt?: boolean | null
          city?: string | null
          country?: string | null
          id?: number
          ip_hash?: string | null
          ok?: boolean | null
          referrer_domain?: string | null
          share_id?: string | null
          ua_hash?: string | null
          viewed_at?: string | null
        }
        Update: {
          access_code_attempt?: boolean | null
          city?: string | null
          country?: string | null
          id?: number
          ip_hash?: string | null
          ok?: boolean | null
          referrer_domain?: string | null
          share_id?: string | null
          ua_hash?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_views_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "shares"
            referencedColumns: ["id"]
          },
        ]
      }
      shares: {
        Row: {
          access_code: string | null
          created_at: string | null
          cred_id: string | null
          expires_at: string
          geographic_restrictions: Json | null
          id: string
          max_views: number | null
          policy: Json
          revoked: boolean | null
          updated_at: string | null
          usage_analytics: Json | null
          user_id: string
          views: number | null
        }
        Insert: {
          access_code?: string | null
          created_at?: string | null
          cred_id?: string | null
          expires_at: string
          geographic_restrictions?: Json | null
          id?: string
          max_views?: number | null
          policy?: Json
          revoked?: boolean | null
          updated_at?: string | null
          usage_analytics?: Json | null
          user_id: string
          views?: number | null
        }
        Update: {
          access_code?: string | null
          created_at?: string | null
          cred_id?: string | null
          expires_at?: string
          geographic_restrictions?: Json | null
          id?: string
          max_views?: number | null
          policy?: Json
          revoked?: boolean | null
          updated_at?: string | null
          usage_analytics?: Json | null
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shares_cred_id_fkey"
            columns: ["cred_id"]
            isOneToOne: false
            referencedRelation: "credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          created_at: string | null
          credential_id: string | null
          id: string
          share_id: string | null
          verification_data: Json | null
          verification_status: string | null
          verifier_ip_hash: string | null
        }
        Insert: {
          created_at?: string | null
          credential_id?: string | null
          id?: string
          share_id?: string | null
          verification_data?: Json | null
          verification_status?: string | null
          verifier_ip_hash?: string | null
        }
        Update: {
          created_at?: string | null
          credential_id?: string | null
          id?: string
          share_id?: string | null
          verification_data?: Json | null
          verification_status?: string | null
          verifier_ip_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "shares"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      log_user_action: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      update_share_analytics: {
        Args: { p_analytics_data: Json; p_share_id: string }
        Returns: undefined
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
