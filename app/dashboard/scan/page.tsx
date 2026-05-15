import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";
import { getCurrentPromoter, listPromoterEvents } from "../_lib/queries";
import { ScanClient, type ScanEventOption } from "./scan-client";

export const metadata = { title: "Scanner — WeFetePass" };

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventParam } = await searchParams;
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;
  const events = await listPromoterEvents(promoter.user.id);
  const supabase = await createClient();

  const eventIds = events.map((e) => e.id);
  const eventOptions: ScanEventOption[] = [];
  for (const e of events) {
    let issued = 0;
    let scanned = 0;
    const { count: passCount } = await supabase
      .from("passes")
      .select("id", { count: "exact", head: true })
      .eq("event_id", e.id);
    issued = passCount ?? 0;
    const { count: scanCount } = await supabase
      .from("scan_events")
      .select("id", { count: "exact", head: true })
      .eq("event_id", e.id)
      .eq("result", "valid");
    scanned = scanCount ?? 0;
    eventOptions.push({
      id: e.id,
      title: e.title,
      issued,
      scanned,
    });
  }

  const initialEventId =
    eventParam && eventIds.includes(eventParam)
      ? eventParam
      : eventOptions[0]?.id ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scanner"
        description="Scan QR tickets at the gate. Online or offline buffer-ready."
      />
      <ScanClient events={eventOptions} initialEventId={initialEventId} />
    </div>
  );
}
