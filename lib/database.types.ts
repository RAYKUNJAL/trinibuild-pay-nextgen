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
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["promoter_profiles"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          social_links?: Json;
          avg_trust_score?: number;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["promoter_profiles"]["Row"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["events"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          status?: EventStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["ticket_tiers"]["Row"],
          "id" | "quantity_sold" | "created_at" | "updated_at"
        > & {
          id?: string;
          quantity_sold?: number;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ticket_tiers"]["Row"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["orders"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          status?: OrderStatus;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
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
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["passes"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          status?: PassStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["passes"]["Row"]>;
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
        Insert: Omit<Database["public"]["Tables"]["scan_events"]["Row"], "id" | "scanned_at"> & {
          id?: string;
          scanned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scan_events"]["Row"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["bank_receipts"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          status?: "pending" | "approved" | "rejected";
          fraud_level?: ReceiptFraudLevel;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bank_receipts"]["Row"]>;
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
        Insert: Omit<Database["public"]["Tables"]["waitlist_entries"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["waitlist_entries"]["Row"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["group_orders"]["Row"],
          "id" | "share_token" | "created_at" | "updated_at"
        > & {
          id?: string;
          share_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_orders"]["Row"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["group_members"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          paid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_members"]["Row"]>;
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
        Insert: Omit<Database["public"]["Tables"]["event_readiness_checks"]["Row"], "id" | "updated_at"> & {
          id?: string;
          done?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_readiness_checks"]["Row"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["whatsapp_delivery_log"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          status?: "queued" | "sent" | "failed" | "delivered";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["whatsapp_delivery_log"]["Row"]>;
      };
    };

    Views: Record<string, never>;

    Functions: {
      increment_tier_quantity_sold: {
        Args: { tier_id: string; qty: number };
        Returns: void;
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
