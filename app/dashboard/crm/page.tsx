import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatTTD } from "@/lib/utils";
import { PageHeader } from "../_components/page-header";
import { getCurrentPromoter, listPromoterEvents } from "../_lib/queries";
import { CrmTable, type CrmRow } from "./crm-table";

export const metadata = { title: "CRM — WeFetePass" };

const segments = [
  { key: "all", label: "All" },
  { key: "vip", label: "VIPs (3+)" },
  { key: "first", label: "First-timers" },
  { key: "loyal", label: "Loyal (5+)" },
  { key: "lapsed", label: "Lapsed" },
] as const;

type Segment = (typeof segments)[number]["key"];

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: Segment }>;
}) {
  const { segment } = await searchParams;
  const seg: Segment = segment ?? "all";

  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;
  const events = await listPromoterEvents(promoter.user.id);
  const eventMap = new Map(events.map((e) => [e.id, e]));
  const eventIds = events.map((e) => e.id);
  const supabase = await createClient();

  const sixMoAgo = new Date();
  sixMoAgo.setMonth(sixMoAgo.getMonth() - 6);

  let rows: CrmRow[] = [];
  if (eventIds.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("buyer_id, buyer_phone, event_id, total_cents, created_at, status")
      .in("event_id", eventIds)
      .eq("status", "paid");

    const byBuyer = new Map<
      string,
      {
        buyer_id: string;
        last_event_id: string;
        last_event_at: string;
        total_cents: number;
        ticket_count: number;
        phone: string | null;
      }
    >();
    for (const o of orders ?? []) {
      const key = o.buyer_id ?? `phone:${o.buyer_phone ?? "unknown"}`;
      const cur = byBuyer.get(key);
      const t = new Date(o.created_at).getTime();
      if (!cur) {
        byBuyer.set(key, {
          buyer_id: o.buyer_id,
          last_event_id: o.event_id,
          last_event_at: o.created_at,
          total_cents: o.total_cents ?? 0,
          ticket_count: 1,
          phone: o.buyer_phone ?? null,
        });
      } else {
        cur.total_cents += o.total_cents ?? 0;
        cur.ticket_count += 1;
        if (t > new Date(cur.last_event_at).getTime()) {
          cur.last_event_at = o.created_at;
          cur.last_event_id = o.event_id;
        }
      }
    }

    const buyerIds = Array.from(byBuyer.values())
      .map((b) => b.buyer_id)
      .filter(Boolean);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", buyerIds.length > 0 ? buyerIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    rows = Array.from(byBuyer.entries()).map(([key, b]) => {
      const profile = profileMap.get(b.buyer_id);
      const lastEvent = eventMap.get(b.last_event_id);
      return {
        key,
        name: profile?.full_name ?? "Unknown buyer",
        phone: profile?.phone ?? b.phone ?? null,
        last_event_title: lastEvent?.title ?? "—",
        last_event_at: b.last_event_at,
        total_cents: b.total_cents,
        ticket_count: b.ticket_count,
      };
    });
  }

  const filtered = rows.filter((r) => {
    if (seg === "vip") return r.ticket_count >= 3;
    if (seg === "loyal") return r.ticket_count >= 5;
    if (seg === "first") return r.ticket_count === 1;
    if (seg === "lapsed")
      return new Date(r.last_event_at).getTime() < sixMoAgo.getTime();
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Your crowd, owned by you. Message buyers directly on WhatsApp."
      />

      <div className="flex flex-wrap gap-2">
        {segments.map((s) => {
          const active = seg === s.key;
          return (
            <a
              key={s.key}
              href={s.key === "all" ? "/dashboard/crm" : `/dashboard/crm?segment=${s.key}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-border/60 bg-background hover:bg-muted"
              }`}
            >
              {s.label}
            </a>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" aria-hidden />}
          title="No buyers in this segment yet"
          description="Once tickets start selling, buyers will show up here automatically."
        />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <CrmTable rows={filtered} />
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Total buyers in segment: {filtered.length} · Combined spend{" "}
        {formatTTD(filtered.reduce((s, r) => s + r.total_cents, 0))}
      </p>
    </div>
  );
}
