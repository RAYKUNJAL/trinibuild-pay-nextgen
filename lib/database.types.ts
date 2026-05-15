export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: "attendee" | "organizer" | "admin";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
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
          status: "draft" | "published" | "soldout" | "cancelled";
          gate_open_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["events"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
      };
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
        };
        Insert: Omit<Database["public"]["Tables"]["ticket_tiers"]["Row"], "id" | "quantity_sold"> & {
          id?: string;
          quantity_sold?: number;
        };
        Update: Partial<Database["public"]["Tables"]["ticket_tiers"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          event_id: string;
          subtotal_cents: number;
          fee_cents: number;
          total_cents: number;
          currency: string;
          status: "pending" | "paid" | "refunded" | "cancelled";
          payment_provider: "stripe" | "paypal" | "mock";
          payment_ref: string | null;
          buyer_email: string | null;
          buyer_phone: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
      passes: {
        Row: {
          id: string;
          order_id: string;
          event_id: string;
          tier_id: string;
          holder_name: string | null;
          code: string;
          status: "valid" | "used" | "voided";
          used_at: string | null;
          used_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["passes"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["passes"]["Row"]>;
      };
      scan_events: {
        Row: {
          id: string;
          pass_id: string | null;
          scanner_id: string;
          event_id: string;
          result: "valid" | "duplicate" | "invalid" | "wrong_event";
          scanned_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["scan_events"]["Row"], "id" | "scanned_at"> & {
          id?: string;
          scanned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scan_events"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
