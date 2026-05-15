import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Cast helper — used for tables not yet in database.types.ts (added in migration 0006)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

interface CheckinBody {
  name?: string;
  phone?: string;
  guestListId?: string;
  passCode?: string;
}

type CheckinResult = "checked_in" | "not_found" | "already_in";
type EntryType = "pass" | "guest_list" | "manual";

interface ResponseBody {
  result: CheckinResult;
  entryType: EntryType;
  holderName?: string | null;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify organizer owns this event
    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", eventId)
      .eq("organizer_id", user.id)
      .maybeSingle();

    if (!event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
    }

    const body = (await request.json()) as CheckinBody;
    const { name, phone, guestListId, passCode } = body;

    const service = await createServiceClient();

    // --- Path 1: passCode provided ---
    if (passCode) {
      const { data: pass } = await service
        .from("passes")
        .select("id, status, holder_name, code")
        .eq("event_id", eventId)
        .eq("code", passCode.trim().toUpperCase())
        .maybeSingle();

      if (!pass) {
        return NextResponse.json<ResponseBody>({ result: "not_found", entryType: "pass" });
      }

      const p = pass as { id: string; status: string; holder_name: string | null };

      if (p.status === "used") {
        return NextResponse.json<ResponseBody>({ result: "already_in", entryType: "pass" });
      }
      if (p.status === "voided") {
        return NextResponse.json<ResponseBody>({ result: "not_found", entryType: "pass" });
      }

      await service
        .from("passes")
        .update({ status: "used", used_at: new Date().toISOString(), used_by: user.id })
        .eq("id", p.id);

      await service.from("scan_events").insert({
        pass_id: p.id,
        scanner_id: user.id,
        event_id: eventId,
        result: "valid",
      });

      return NextResponse.json<ResponseBody>({
        result: "checked_in",
        entryType: "pass",
        holderName: p.holder_name,
      });
    }

    // --- Path 2: guestListId provided ---
    if (guestListId) {
      const { data: entry } = await raw(service)
        .from("guest_list_entries")
        .select("id, checked_in, name")
        .eq("id", guestListId)
        .eq("event_id", eventId)
        .maybeSingle();

      if (!entry) {
        return NextResponse.json<ResponseBody>({ result: "not_found", entryType: "guest_list" });
      }

      const ge = entry as { id: string; checked_in: boolean; name: string };

      if (ge.checked_in) {
        return NextResponse.json<ResponseBody>({
          result: "already_in",
          entryType: "guest_list",
          holderName: ge.name,
        });
      }

      await raw(service)
        .from("guest_list_entries")
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
          checked_in_by: user.id,
        })
        .eq("id", guestListId);

      return NextResponse.json<ResponseBody>({
        result: "checked_in",
        entryType: "guest_list",
        holderName: ge.name,
      });
    }

    // --- Path 3: manual name/phone lookup ---
    if (name || phone) {
      if (phone) {
        const { data: order } = await service
          .from("orders")
          .select("id")
          .eq("event_id", eventId)
          .eq("status", "paid")
          .eq("buyer_phone", phone)
          .maybeSingle();

        if (order) {
          const o = order as { id: string };
          const { data: passes } = await service
            .from("passes")
            .select("id, status, holder_name, code")
            .eq("event_id", eventId)
            .eq("order_id", o.id)
            .eq("status", "valid")
            .limit(1);

          const pass = (passes as { id: string; status: string; holder_name: string | null }[] | null)?.[0];
          if (pass) {
            await service
              .from("passes")
              .update({ status: "used", used_at: new Date().toISOString(), used_by: user.id })
              .eq("id", pass.id);

            await service.from("scan_events").insert({
              pass_id: pass.id,
              scanner_id: user.id,
              event_id: eventId,
              result: "valid",
            });

            return NextResponse.json<ResponseBody>({
              result: "checked_in",
              entryType: "pass",
              holderName: pass.holder_name,
            });
          }
        }
      }

      // Try guest list
      let guestQuery = raw(service)
        .from("guest_list_entries")
        .select("id, checked_in, name")
        .eq("event_id", eventId);

      if (phone) {
        guestQuery = guestQuery.eq("phone", phone);
      } else if (name) {
        guestQuery = guestQuery.ilike("name", `%${name}%`);
      }

      const { data: guestEntries } = await guestQuery.limit(1);
      const guestEntry = (guestEntries as { id: string; checked_in: boolean; name: string }[] | null)?.[0];

      if (guestEntry) {
        if (guestEntry.checked_in) {
          return NextResponse.json<ResponseBody>({
            result: "already_in",
            entryType: "guest_list",
            holderName: guestEntry.name,
          });
        }
        await raw(service)
          .from("guest_list_entries")
          .update({
            checked_in: true,
            checked_in_at: new Date().toISOString(),
            checked_in_by: user.id,
          })
          .eq("id", guestEntry.id);

        return NextResponse.json<ResponseBody>({
          result: "checked_in",
          entryType: "guest_list",
          holderName: guestEntry.name,
        });
      }

      return NextResponse.json<ResponseBody>({ result: "not_found", entryType: "manual" });
    }

    return NextResponse.json({ error: "Provide passCode, guestListId, name, or phone" }, { status: 422 });
  } catch (err) {
    console.error("[POST /api/door/[eventId]/checkin]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
