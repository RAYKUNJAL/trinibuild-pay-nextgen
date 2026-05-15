export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];

// ============================================================
// Enum types mirroring the Postgres custom types
// ============================================================

export type UserRole = "attendee" | "organizer" | "admin";
export type EventStatus = "draft" | "published" | "soldout" | "cancelled";
export type OrderStatus = "pending" | "paid" | "refunded" | "cancelled";
export type PaymentProvider = "stripe" | "paypal" | "bank_receipt" | "mock";
export type PassStatus = "valid" | "used" | "voided";
export type ScanResult = "valid" | "duplicate" | "invalid" | "wrong_event";
export type ReceiptFraudLevel = "low" | "medium" | "high" | "auto_reject";

export interface Database {
  public: {
    Tables: {
      // ----------------------------------------------------------
      // profiles
      // ----------------------------------------------------------
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };

      // ----------------------------------------------------------
      // promoter_profiles
      // ----------------------------------------------------------
      promoter_profiles: {
        Row: {
          id: string;
          profile_id: string;
          brand_name: string | null;
          logo_url: string | null;
          social_links: Json;
          avg_trust_score: number;
          verified: boolean;
          payout_info: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          brand_name?: string | null;
          logo_url?: string | null;
          social_links?: Json;
          avg_trust_score?: number;
          verified?: boolean;
          payout_info?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["promoter_profiles"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "promoter_profiles_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // events
      // ----------------------------------------------------------
      events: {
        Row: {
          id: string;
          organizer_id: string;
          slug: string;
          title: string;
          tagline: string | null;
          description: string | null;
          venue: string;
          city: string;
          island: string;
          starts_at: string;
          ends_at: string | null;
          cover_image_url: string | null;
          status: EventStatus;
          gate_open_at: string | null;
          event_type: string | null;
          capacity: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          slug: string;
          title: string;
          tagline?: string | null;
          description?: string | null;
          venue: string;
          city: string;
          island?: string;
          starts_at: string;
          ends_at?: string | null;
          cover_image_url?: string | null;
          status?: EventStatus;
          gate_open_at?: string | null;
          event_type?: string | null;
          capacity?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey";
            columns: ["organizer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // ticket_tiers
      // ----------------------------------------------------------
      ticket_tiers: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string | null;
          price_cents: number;
          quantity: number;
          quantity_sold: number;
          sales_start_at: string | null;
          sales_end_at: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description?: string | null;
          price_cents: number;
          quantity: number;
          quantity_sold?: number;
          sales_start_at?: string | null;
          sales_end_at?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ticket_tiers"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // orders
      // ----------------------------------------------------------
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          event_id: string;
          subtotal_cents: number;
          fee_cents: number;
          total_cents: number;
          currency: string;
          status: OrderStatus;
          payment_provider: PaymentProvider;
          payment_ref: string | null;
          buyer_email: string | null;
          buyer_phone: string | null;
          buyer_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          event_id: string;
          subtotal_cents: number;
          fee_cents: number;
          total_cents: number;
          currency?: string;
          status?: OrderStatus;
          payment_provider?: PaymentProvider;
          payment_ref?: string | null;
          buyer_email?: string | null;
          buyer_phone?: string | null;
          buyer_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey";
            columns: ["buyer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // order_items
      // ----------------------------------------------------------
      order_items: {
        Row: {
          id: string;
          order_id: string;
          tier_id: string;
          quantity: number;
          unit_price_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          tier_id: string;
          quantity: number;
          unit_price_cents: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_tier_id_fkey";
            columns: ["tier_id"];
            referencedRelation: "ticket_tiers";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // passes
      // ----------------------------------------------------------
      passes: {
        Row: {
          id: string;
          order_id: string;
          event_id: string;
          tier_id: string;
          holder_name: string | null;
          code: string;
          status: PassStatus;
          used_at: string | null;
          used_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          event_id: string;
          tier_id: string;
          holder_name?: string | null;
          code: string;
          status?: PassStatus;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["passes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "passes_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "passes_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "passes_tier_id_fkey";
            columns: ["tier_id"];
            referencedRelation: "ticket_tiers";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // scan_events
      // ----------------------------------------------------------
      scan_events: {
        Row: {
          id: string;
          pass_id: string | null;
          scanner_id: string;
          event_id: string;
          result: ScanResult;
          scanned_at: string;
        };
        Insert: {
          id?: string;
          pass_id?: string | null;
          scanner_id: string;
          event_id: string;
          result: ScanResult;
          scanned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scan_events"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "scan_events_pass_id_fkey";
            columns: ["pass_id"];
            referencedRelation: "passes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scan_events_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // bank_receipts
      // ----------------------------------------------------------
      bank_receipts: {
        Row: {
          id: string;
          order_id: string;
          buyer_id: string;
          image_url: string;
          bank_ref: string | null;
          amount_cents: number;
          status: "pending" | "approved" | "rejected";
          fraud_level: ReceiptFraudLevel;
          reviewed_by: string | null;
          reviewed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          buyer_id: string;
          image_url: string;
          bank_ref?: string | null;
          amount_cents: number;
          status?: "pending" | "approved" | "rejected";
          fraud_level?: ReceiptFraudLevel;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bank_receipts"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "bank_receipts_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // waitlist_entries
      // ----------------------------------------------------------
      waitlist_entries: {
        Row: {
          id: string;
          phone: string;
          name: string | null;
          event_id: string | null;
          city: string | null;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          name?: string | null;
          event_id?: string | null;
          city?: string | null;
          notified_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["waitlist_entries"]["Row"]>;
        Relationships: [];
      };

      // ----------------------------------------------------------
      // group_orders
      // ----------------------------------------------------------
      group_orders: {
        Row: {
          id: string;
          order_id: string;
          organizer_buyer_id: string;
          share_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          organizer_buyer_id: string;
          share_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_orders"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "group_orders_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // group_members
      // ----------------------------------------------------------
      group_members: {
        Row: {
          id: string;
          group_id: string;
          buyer_phone: string;
          buyer_name: string | null;
          pass_id: string | null;
          paid: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          buyer_phone: string;
          buyer_name?: string | null;
          pass_id?: string | null;
          paid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_members"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            referencedRelation: "group_orders";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // event_readiness_checks
      // ----------------------------------------------------------
      event_readiness_checks: {
        Row: {
          id: string;
          event_id: string;
          check_key: string;
          done: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          check_key: string;
          done?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_readiness_checks"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "event_readiness_checks_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------
      // whatsapp_delivery_log
      // ----------------------------------------------------------
      whatsapp_delivery_log: {
        Row: {
          id: string;
          pass_id: string;
          phone: string;
          status: "queued" | "sent" | "failed" | "delivered";
          sent_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pass_id: string;
          phone: string;
          status?: "queued" | "sent" | "failed" | "delivered";
          sent_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["whatsapp_delivery_log"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "whatsapp_delivery_log_pass_id_fkey";
            columns: ["pass_id"];
            referencedRelation: "passes";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: Record<string, never>;

    Functions: {
      increment_tier_quantity_sold: {
        Args: { tier_id: string; qty: number };
        Returns: undefined;
      };
      calculate_readiness_score: {
        Args: { p_event_id: string };
        Returns: number;
      };
    };

    Enums: {
      user_role: UserRole;
      event_status: EventStatus;
      order_status: OrderStatus;
      payment_provider: PaymentProvider;
      pass_status: PassStatus;
      scan_result: ScanResult;
      receipt_fraud_level: ReceiptFraudLevel;
    };
  };
}
