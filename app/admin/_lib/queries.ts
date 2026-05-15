import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Cast helper — admin tables aren't all enumerated in database.types.ts yet,
// and even the typed tables run into Supabase's `never` narrowing artifacts
// when used through the service client. Treat the service client as untyped
// for admin-only queries.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

const THIRTY_DAYS_AGO = () =>
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

// ---------------------------------------------------------------------------
// Platform metrics
// ---------------------------------------------------------------------------

export interface PlatformMetrics {
  totalRevenue30dCents: number;
  ordersLast30d: number;
  passesIssued30d: number;
  activePromoters: number;
  publishedEvents: number;
  pendingVerifications: number;
  pendingReceipts: number;
  pendingRefunds: number;
  openDisputes: number;
  islandBreakdown: Array<{ island: string; events: number; revenueCents: number }>;
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const svc = await createServiceClient();
  const since = THIRTY_DAYS_AGO();

  const [
    revenueRes,
    ordersCountRes,
    passesCountRes,
    promotersRes,
    eventsRes,
    pendingVerRes,
    pendingReceiptRes,
    pendingRefundsRes,
    openDisputesRes,
    eventsForBreakdownRes,
  ] = await Promise.all([
    raw(svc)
      .from("orders")
      .select("total_cents")
      .eq("status", "paid")
      .gte("created_at", since),
    raw(svc)
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .gte("created_at", since),
    raw(svc)
      .from("passes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    raw(svc)
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "organizer"),
    raw(svc)
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    raw(svc)
      .from("promoter_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    raw(svc)
      .from("bank_receipts")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "flagged"]),
    raw(svc)
      .from("refund_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "escalated"]),
    raw(svc)
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_review"]),
    raw(svc)
      .from("events")
      .select("id, island, status"),
  ]);

  const revenueRows = (revenueRes.data ?? []) as Array<{ total_cents: number | null }>;
  const totalRevenue30dCents = revenueRows.reduce(
    (s, r) => s + (r.total_cents ?? 0),
    0,
  );

  // Island breakdown: count published events per island + 30d revenue per island
  const events = (eventsForBreakdownRes.data ?? []) as Array<{
    id: string;
    island: string | null;
    status: string;
  }>;
  const eventCountByIsland = new Map<string, number>();
  for (const ev of events) {
    if (ev.status !== "published") continue;
    const key = ev.island ?? "unknown";
    eventCountByIsland.set(key, (eventCountByIsland.get(key) ?? 0) + 1);
  }

  // Pull 30d revenue grouped by event island
  const { data: revenueByEvent } = await raw(svc)
    .from("orders")
    .select("total_cents, event_id")
    .eq("status", "paid")
    .gte("created_at", since);

  const eventIslandMap = new Map<string, string>();
  for (const ev of events) eventIslandMap.set(ev.id, ev.island ?? "unknown");

  const revenueByIsland = new Map<string, number>();
  for (const row of (revenueByEvent ?? []) as Array<{
    total_cents: number | null;
    event_id: string | null;
  }>) {
    const island = eventIslandMap.get(row.event_id ?? "") ?? "unknown";
    revenueByIsland.set(island, (revenueByIsland.get(island) ?? 0) + (row.total_cents ?? 0));
  }

  const allIslands = new Set<string>([
    ...eventCountByIsland.keys(),
    ...revenueByIsland.keys(),
  ]);
  const islandBreakdown = Array.from(allIslands)
    .map((island) => ({
      island,
      events: eventCountByIsland.get(island) ?? 0,
      revenueCents: revenueByIsland.get(island) ?? 0,
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);

  return {
    totalRevenue30dCents,
    ordersLast30d: ordersCountRes.count ?? 0,
    passesIssued30d: passesCountRes.count ?? 0,
    activePromoters: promotersRes.count ?? 0,
    publishedEvents: eventsRes.count ?? 0,
    pendingVerifications: pendingVerRes.count ?? 0,
    pendingReceipts: pendingReceiptRes.count ?? 0,
    pendingRefunds: pendingRefundsRes.count ?? 0,
    openDisputes: openDisputesRes.count ?? 0,
    islandBreakdown,
  };
}

/**
 * Counts shown as badges in the admin sidebar.
 */
export async function getSidebarCounts() {
  const svc = await createServiceClient();
  const [v, r, ref, u] = await Promise.all([
    raw(svc)
      .from("promoter_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    raw(svc)
      .from("bank_receipts")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "flagged"]),
    raw(svc)
      .from("refund_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "escalated"]),
    raw(svc)
      .from("profiles")
      .select("id", { count: "exact", head: true }),
  ]);
  return {
    verifications: v.count ?? 0,
    receipts: r.count ?? 0,
    refunds: ref.count ?? 0,
    users: u.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Verifications
// ---------------------------------------------------------------------------

export interface VerificationRow {
  id: string;
  profile_id: string;
  status: string;
  legal_name: string | null;
  business_reg_number: string | null;
  id_document_url: string | null;
  social_proof_urls: string[] | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    phone: string | null;
  } | null;
}

export async function listPendingVerifications(): Promise<VerificationRow[]> {
  const svc = await createServiceClient();
  const { data } = await raw(svc)
    .from("promoter_verifications")
    .select("id, profile_id, status, legal_name, business_reg_number, created_at, updated_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as VerificationRow[];
  if (rows.length === 0) return rows;

  const ids = rows.map((r) => r.profile_id);
  const { data: profiles } = await raw(svc)
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", ids);
  const map = new Map<string, VerificationRow["profile"]>();
  for (const p of (profiles ?? []) as NonNullable<VerificationRow["profile"]>[]) {
    map.set(p.id, p);
  }
  return rows.map((r) => ({ ...r, profile: map.get(r.profile_id) ?? null }));
}

export async function getVerification(id: string): Promise<VerificationRow | null> {
  const svc = await createServiceClient();
  const { data } = await raw(svc)
    .from("promoter_verifications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const row = data as VerificationRow | null;
  if (!row) return null;
  const { data: profile } = await raw(svc)
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", row.profile_id)
    .maybeSingle();
  return { ...row, profile: profile as VerificationRow["profile"] };
}

// ---------------------------------------------------------------------------
// Receipts
// ---------------------------------------------------------------------------

export interface ReceiptRow {
  id: string;
  order_id: string;
  bank_name: string | null;
  reference_number: string | null;
  amount_cents: number | null;
  receipt_url: string | null;
  status: string;
  fraud_level: string | null;
  ai_confidence: number | null;
  ai_notes: string | null;
  created_at: string;
  order?: {
    id: string;
    total_cents: number;
    buyer_id: string;
    event_id: string;
    status: string;
  } | null;
}

export async function listPendingReceipts(): Promise<ReceiptRow[]> {
  const svc = await createServiceClient();
  const { data } = await raw(svc)
    .from("bank_receipts")
    .select(
      "id, order_id, bank_name, reference_number, amount_cents, status, fraud_level, ai_confidence, created_at",
    )
    .in("status", ["pending", "flagged"])
    .order("created_at", { ascending: true });
  return (data ?? []) as ReceiptRow[];
}

export async function getReceipt(id: string): Promise<ReceiptRow | null> {
  const svc = await createServiceClient();
  const { data } = await raw(svc)
    .from("bank_receipts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const row = data as ReceiptRow | null;
  if (!row) return null;
  if (row.order_id) {
    const { data: order } = await raw(svc)
      .from("orders")
      .select("id, total_cents, buyer_id, event_id, status")
      .eq("id", row.order_id)
      .maybeSingle();
    row.order = order as ReceiptRow["order"];
  }
  return row;
}

// ---------------------------------------------------------------------------
// Refunds + Disputes
// ---------------------------------------------------------------------------

export interface RefundRow {
  id: string;
  order_id: string;
  event_id: string;
  buyer_id: string;
  amount_cents: number | null;
  reason: string | null;
  reason_detail: string | null;
  status: string;
  organizer_response: string | null;
  created_at: string;
  kind?: "refund" | "dispute";
}

export interface DisputeRow {
  id: string;
  refund_request_id: string | null;
  order_id: string | null;
  status: string;
  created_at: string;
  kind?: "refund" | "dispute";
}

export async function listRefundsAndDisputes(): Promise<{
  refunds: RefundRow[];
  disputes: DisputeRow[];
}> {
  const svc = await createServiceClient();
  const [refundsRes, disputesRes] = await Promise.all([
    raw(svc)
      .from("refund_requests")
      .select(
        "id, order_id, event_id, buyer_id, amount_cents, reason, status, created_at",
      )
      .in("status", ["pending", "escalated"])
      .order("created_at", { ascending: true }),
    raw(svc)
      .from("disputes")
      .select("id, refund_request_id, order_id, status, created_at")
      .in("status", ["open", "in_review"])
      .order("created_at", { ascending: true }),
  ]);
  return {
    refunds: (refundsRes.data ?? []) as RefundRow[],
    disputes: (disputesRes.data ?? []) as DisputeRow[],
  };
}

export async function getRefund(id: string): Promise<RefundRow | null> {
  const svc = await createServiceClient();
  const { data } = await raw(svc)
    .from("refund_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as RefundRow | null;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

export async function searchUsers(q: string): Promise<UserRow[]> {
  const svc = await createServiceClient();
  const trimmed = q.trim();
  let query = raw(svc)
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (trimmed.length > 0) {
    // Match on full_name OR phone (case-insensitive)
    query = query.or(`full_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`);
  }

  const { data } = await query;
  return (data ?? []) as UserRow[];
}

export async function getUser(id: string): Promise<{
  profile: UserRow | null;
  ordersCount: number;
  passesCount: number;
  eventsCount: number;
}> {
  const svc = await createServiceClient();
  const [profileRes, ordersRes, passesRes, eventsRes] = await Promise.all([
    raw(svc)
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .eq("id", id)
      .maybeSingle(),
    raw(svc)
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", id),
    raw(svc)
      .from("passes")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", id),
    raw(svc)
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", id),
  ]);
  return {
    profile: (profileRes.data ?? null) as UserRow | null,
    ordersCount: ordersRes.count ?? 0,
    passesCount: passesRes.count ?? 0,
    eventsCount: eventsRes.count ?? 0,
  };
}
