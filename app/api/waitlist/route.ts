import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type WaitlistInsert = Database["public"]["Tables"]["waitlist_entries"]["Insert"];

interface WaitlistBody {
  phone: string;
  name?: string;
  eventId?: string;
  city?: string;
}

export async function POST(request: Request) {
  try {
    const body: WaitlistBody = await request.json();
    const { phone, name, eventId, city } = body;

    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s+/g, "");
    if (!/^\+?\d{7,15}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    const service = await createServiceClient();

    const entry: WaitlistInsert = {
      phone: cleanPhone,
      name: name ?? null,
      event_id: eventId ?? null,
      city: city ?? null,
    };

    const { error } = await service.from("waitlist_entries").upsert(entry, {
      onConflict: eventId ? "phone,event_id" : undefined,
      ignoreDuplicates: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ joined: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/waitlist]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
