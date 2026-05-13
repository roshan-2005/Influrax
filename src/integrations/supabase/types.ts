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
      brands: {
        Row: {
          bio: string | null
          brand_name: string
          created_at: string
          id: string
          industry: string | null
          instagram_handle: string | null
          logo_url: string | null
          target_age_max: number | null
          target_age_min: number | null
          target_cities: string[] | null
          target_gender: string | null
          updated_at: string
          user_id: string
          website: string | null
          youtube_channel: string | null
        }
        Insert: {
          bio?: string | null
          brand_name: string
          created_at?: string
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          logo_url?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_cities?: string[] | null
          target_gender?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          youtube_channel?: string | null
        }
        Update: {
          bio?: string | null
          brand_name?: string
          created_at?: string
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          logo_url?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_cities?: string[] | null
          target_gender?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          youtube_channel?: string | null
        }
        Relationships: []
      }
      campaign_influencers: {
        Row: {
          authenticity_score: number | null
          campaign_id: string
          created_at: string
          engagement_rate: number | null
          followers: number | null
          id: string
          influencer_avatar: string | null
          influencer_handle: string | null
          influencer_id: string
          influencer_name: string
          location: string | null
          niche: string | null
          platform: string
          status: Database["public"]["Enums"]["outreach_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          authenticity_score?: number | null
          campaign_id: string
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          id?: string
          influencer_avatar?: string | null
          influencer_handle?: string | null
          influencer_id: string
          influencer_name: string
          location?: string | null
          niche?: string | null
          platform: string
          status?: Database["public"]["Enums"]["outreach_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          authenticity_score?: number | null
          campaign_id?: string
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          id?: string
          influencer_avatar?: string | null
          influencer_handle?: string | null
          influencer_id?: string
          influencer_name?: string
          location?: string | null
          niche?: string | null
          platform?: string
          status?: Database["public"]["Enums"]["outreach_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_influencers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_requests: {
        Row: {
          brand_user_id: string
          campaign_id: string
          created_at: string
          id: string
          influencer_id: string
          pitch_message: string
          platforms: string[] | null
          portfolio_links: string[] | null
          proposed_rate: number | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          brand_user_id: string
          campaign_id: string
          created_at?: string
          id?: string
          influencer_id: string
          pitch_message: string
          platforms?: string[] | null
          portfolio_links?: string[] | null
          proposed_rate?: number | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          brand_user_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
          influencer_id?: string
          pitch_message?: string
          platforms?: string[] | null
          portfolio_links?: string[] | null
          proposed_rate?: number | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          created_at: string
          deadline: string | null
          deliverables: string | null
          description: string | null
          id: string
          is_published: boolean | null
          min_followers: number | null
          name: string
          niche: string | null
          platforms: string[] | null
          product_image: string | null
          product_name: string | null
          product_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          deadline?: string | null
          deliverables?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          min_followers?: number | null
          name: string
          niche?: string | null
          platforms?: string[] | null
          product_image?: string | null
          product_name?: string | null
          product_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          deadline?: string | null
          deliverables?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          min_followers?: number | null
          name?: string
          niche?: string | null
          platforms?: string[] | null
          product_image?: string | null
          product_name?: string | null
          product_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      influencer_profiles: {
        Row: {
          authenticity_score: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          engagement_rate: number | null
          id: string
          instagram_followers: number | null
          instagram_handle: string | null
          is_verified: boolean | null
          niches: string[] | null
          payout_details_json: Json | null
          rates_json: Json | null
          total_campaigns_completed: number | null
          updated_at: string
          user_id: string
          x_followers: number | null
          x_handle: string | null
          youtube_channel_url: string | null
          youtube_subscribers: number | null
        }
        Insert: {
          authenticity_score?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          engagement_rate?: number | null
          id?: string
          instagram_followers?: number | null
          instagram_handle?: string | null
          is_verified?: boolean | null
          niches?: string[] | null
          payout_details_json?: Json | null
          rates_json?: Json | null
          total_campaigns_completed?: number | null
          updated_at?: string
          user_id: string
          x_followers?: number | null
          x_handle?: string | null
          youtube_channel_url?: string | null
          youtube_subscribers?: number | null
        }
        Update: {
          authenticity_score?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          engagement_rate?: number | null
          id?: string
          instagram_followers?: number | null
          instagram_handle?: string | null
          is_verified?: boolean | null
          niches?: string[] | null
          payout_details_json?: Json | null
          rates_json?: Json | null
          total_campaigns_completed?: number | null
          updated_at?: string
          user_id?: string
          x_followers?: number | null
          x_handle?: string | null
          youtube_channel_url?: string | null
          youtube_subscribers?: number | null
        }
        Relationships: []
      }
      outreach_drafts: {
        Row: {
          body: string
          campaign_influencer_id: string
          channel: string
          created_at: string
          id: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          campaign_influencer_id: string
          channel?: string
          created_at?: string
          id?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          campaign_influencer_id?: string
          channel?: string
          created_at?: string
          id?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_drafts_campaign_influencer_id_fkey"
            columns: ["campaign_influencer_id"]
            isOneToOne: false
            referencedRelation: "campaign_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          plan_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_usage: {
        Row: {
          created_at: string
          day: string
          id: string
          search_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          search_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          search_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          onboarded: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          onboarded?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          onboarded?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_search_count: { Args: { p_daily_cap: number }; Returns: number }
    }
    Enums: {
      app_role: "brand" | "influencer"
      outreach_status: "saved" | "contacted" | "replied"
      request_status:
        | "pending"
        | "reviewing"
        | "accepted"
        | "rejected"
        | "contracted"
        | "withdrawn"
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
      app_role: ["brand", "influencer"],
      outreach_status: ["saved", "contacted", "replied"],
      request_status: [
        "pending",
        "reviewing",
        "accepted",
        "rejected",
        "contracted",
        "withdrawn",
      ],
    },
  },
} as const
