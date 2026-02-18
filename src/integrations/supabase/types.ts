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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      baskets: {
        Row: {
          agentic_state: Json | null
          cart_items: Json
          created_at: string
          id: string
          last_activity: string
          messages: Json
          selected_address_id: string | null
          shipping_selections: Json | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          agentic_state?: Json | null
          cart_items?: Json
          created_at?: string
          id?: string
          last_activity?: string
          messages?: Json
          selected_address_id?: string | null
          shipping_selections?: Json | null
          status?: string
          title?: string
          user_id: string
        }
        Update: {
          agentic_state?: Json | null
          cart_items?: Json
          created_at?: string
          id?: string
          last_activity?: string
          messages?: Json
          selected_address_id?: string | null
          shipping_selections?: Json | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: Json | null
          id: string
          items: Json
          merchant_groups: Json | null
          order_number: string
          payment_method: string | null
          status: string
          subtotal: number
          total: number
          total_discount: number
          total_shipping: number
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address?: Json | null
          id?: string
          items?: Json
          merchant_groups?: Json | null
          order_number: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          total?: number
          total_discount?: number
          total_shipping?: number
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: Json | null
          id?: string
          items?: Json
          merchant_groups?: Json | null
          order_number?: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          total?: number
          total_discount?: number
          total_shipping?: number
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          used?: boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category: string
          created_at: string
          description: string | null
          fast_delivery: boolean
          id: string
          image_url: string
          image_urls: string[] | null
          in_stock: boolean
          merchant_id: string
          name: string
          original_price: number | null
          price: number
          rating: number
          return_guarantee: boolean
          review_count: number
          reviews_summary: string | null
          search_vector: unknown
          source_url: string | null
          specs: Json | null
          subcategory: string | null
          tags: string[] | null
        }
        Insert: {
          brand?: string | null
          category?: string
          created_at?: string
          description?: string | null
          fast_delivery?: boolean
          id?: string
          image_url?: string
          image_urls?: string[] | null
          in_stock?: boolean
          merchant_id?: string
          name: string
          original_price?: number | null
          price: number
          rating?: number
          return_guarantee?: boolean
          review_count?: number
          reviews_summary?: string | null
          search_vector?: unknown
          source_url?: string | null
          specs?: Json | null
          subcategory?: string | null
          tags?: string[] | null
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string
          description?: string | null
          fast_delivery?: boolean
          id?: string
          image_url?: string
          image_urls?: string[] | null
          in_stock?: boolean
          merchant_id?: string
          name?: string
          original_price?: number | null
          price?: number
          rating?: number
          return_guarantee?: boolean
          review_count?: number
          reviews_summary?: string | null
          search_vector?: unknown
          source_url?: string | null
          specs?: Json | null
          subcategory?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          created_at: string
          full_address: string
          id: string
          is_default: boolean
          phone: string
          recipient_name: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_address?: string
          id?: string
          is_default?: boolean
          phone?: string
          recipient_name?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_address?: string
          id?: string
          is_default?: boolean
          phone?: string
          recipient_name?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
