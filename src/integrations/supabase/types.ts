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
          color_options: string[] | null
          created_at: string
          description: string | null
          embedding: string | null
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
          color_options?: string[] | null
          created_at?: string
          description?: string | null
          embedding?: string | null
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
          color_options?: string[] | null
          created_at?: string
          description?: string | null
          embedding?: string | null
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
      shift_carts: {
        Row: {
          created_at: string
          id: string
          items: Json
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shift_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_orders: {
        Row: {
          address: Json
          created_at: string
          id: string
          items: Json
          payment_method: string | null
          shipping_cost: number
          shipping_method: string | null
          status: string
          store_id: string
          subtotal: number
          total: number
          user_id: string
        }
        Insert: {
          address?: Json
          created_at?: string
          id?: string
          items?: Json
          payment_method?: string | null
          shipping_cost?: number
          shipping_method?: string | null
          status?: string
          store_id: string
          subtotal?: number
          total?: number
          user_id: string
        }
        Update: {
          address?: Json
          created_at?: string
          id?: string
          items?: Json
          payment_method?: string | null
          shipping_cost?: number
          shipping_method?: string | null
          status?: string
          store_id?: string
          subtotal?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shift_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_products: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          description_fa: string | null
          embedding: string | null
          external_id: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          in_stock: boolean
          name_fa: string
          original_price: number | null
          price: number
          rating: number | null
          review_count: number
          search_vector: unknown
          species: string | null
          specs: Json
          stock_qty: number
          store_id: string
          subcategory: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          description_fa?: string | null
          embedding?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          in_stock?: boolean
          name_fa: string
          original_price?: number | null
          price?: number
          rating?: number | null
          review_count?: number
          search_vector?: unknown
          species?: string | null
          specs?: Json
          stock_qty?: number
          store_id: string
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          description_fa?: string | null
          embedding?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          in_stock?: boolean
          name_fa?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          review_count?: number
          search_vector?: unknown
          species?: string | null
          specs?: Json
          stock_qty?: number
          store_id?: string
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shift_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_store_content: {
        Row: {
          content_key: string
          content_type: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          sort_order: number
          store_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          content_key: string
          content_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          sort_order?: number
          store_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          content_key?: string
          content_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          sort_order?: number
          store_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_store_content_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shift_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_stores: {
        Row: {
          created_at: string
          currency: string
          hero_image_url: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name_fa: string
          slug: string
          suggested_prompts: Json
          tagline_fa: string | null
          theme_accent: string
          theme_primary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name_fa: string
          slug: string
          suggested_prompts?: Json
          tagline_fa?: string | null
          theme_accent?: string
          theme_primary?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name_fa?: string
          slug?: string
          suggested_prompts?: Json
          tagline_fa?: string | null
          theme_accent?: string
          theme_primary?: string
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
      hybrid_product_search: {
        Args: {
          p_brand?: string
          p_embedding?: string
          p_in_stock?: boolean
          p_max_price?: number
          p_min_price?: number
          p_min_rating?: number
          p_query: string
          p_subcategory?: string
        }
        Returns: {
          brand: string
          category: string
          description: string
          fast_delivery: boolean
          final_score: number
          id: string
          image_url: string
          image_urls: string[]
          in_stock: boolean
          merchant_id: string
          name: string
          original_price: number
          price: number
          rating: number
          return_guarantee: boolean
          review_count: number
          reviews_summary: string
          source_url: string
          specs: Json
          subcategory: string
          tags: string[]
        }[]
      }
      normalize_persian: { Args: { input: string }; Returns: string }
      shift_hybrid_search: {
        Args: {
          p_category?: string
          p_embedding?: string
          p_in_stock?: boolean
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_query: string
          p_species?: string
          p_store_id: string
          p_subcategory?: string
        }
        Returns: {
          brand: string
          category: string
          description_fa: string
          final_score: number
          id: string
          image_url: string
          image_urls: string[]
          in_stock: boolean
          name_fa: string
          original_price: number
          price: number
          rating: number
          review_count: number
          species: string
          specs: Json
          stock_qty: number
          subcategory: string
          tags: string[]
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
