import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type BankAccountRaw = {
  id: string;
  bank_name: string;
  account_last4: string;
  validated: boolean;
};

type ExistingBatchRaw = {
  id: string;
  status: string;
};

type LineItemInsert = {
  batch_id: string;
  order_id: string;
  gross_cents: number;
  fee_cents: number;
  net_cents: number;
  description: string;
};

const PLATFORM_FEE_RATE = 0.075; // 7.5%
const CHARGEBACK_RESERVE_RATE = 0.05; // 5%
const PAYOUT_DELAY_HOURS = 48;

interface RequestPayoutBody {
  eventId: string;
  bankAccountId: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify organizer role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const profile = profileData as Pick<ProfileRow, 'role'> | null;
    if (!profile || !['organizer', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: organizer role required' }, { status: 403 });
    }

    const body: RequestPayoutBody = await request.json();
    const { eventId, bankAccountId } = body;

    if (!eventId || !bankAccountId) {
      return NextResponse.json(
        { error: 'eventId and bankAccountId are required' },
        { status: 400 },
      );
    }

    // Fetch the event and verify ownership
    const { data: eventData } = await supabase
      .from('events')
      .select('id, title, organizer_id, status, ends_at, starts_at')
      .eq('id', eventId)
      .maybeSingle();

    const event = eventData as Pick<EventRow, 'id' | 'title' | 'organizer_id' | 'status' | 'ends_at' | 'starts_at'> | null;

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check event is published or has started
    const eventStarted = new Date(event.starts_at) <= new Date();
    const isPublished = event.status === 'published';
    const isSoldOut = event.status === 'soldout';
    if (!isPublished && !isSoldOut && !eventStarted) {
      return NextResponse.json(
        { error: 'Payouts are only available for published events or events that have started' },
        { status: 400 },
      );
    }

    // Check there is no active payout batch for this event already
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingBatchData } = await (supabase as any)
      .from('payout_batches')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('organizer_id', user.id)
      .not('status', 'in', '("cancelled","failed")')
      .maybeSingle();

    const existingBatch = existingBatchData as ExistingBatchRaw | null;

    if (existingBatch) {
      return NextResponse.json(
        {
          error: 'A payout for this event is already in progress',
          batchId: existingBatch.id,
          status: existingBatch.status,
        },
        { status: 409 },
      );
    }

    // Check organizer has a validated bank account with the given ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bankAccountData } = await (supabase as any)
      .from('bank_accounts')
      .select('id, bank_name, account_last4, validated')
      .eq('id', bankAccountId)
      .eq('organizer_id', user.id)
      .maybeSingle();

    const bankAccount = bankAccountData as BankAccountRaw | null;

    if (!bankAccount) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }
    if (!bankAccount.validated) {
      return NextResponse.json(
        { error: 'Bank account must be validated before requesting a payout' },
        { status: 400 },
      );
    }

    // Find all paid orders for this event not already in a payout batch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lineItemOrders } = await (supabase as any)
      .from('payout_line_items')
      .select('order_id, payout_batches!inner(organizer_id)')
      .eq('payout_batches.organizer_id', user.id);

    const coveredOrderIds = new Set(
      ((lineItemOrders ?? []) as { order_id: string }[]).map((li) => li.order_id),
    );

    const { data: paidOrdersData } = await supabase
      .from('orders')
      .select('id, subtotal_cents, fee_cents')
      .eq('event_id', eventId)
      .eq('status', 'paid');

    const paidOrders = (paidOrdersData ?? []) as Pick<OrderRow, 'id' | 'subtotal_cents' | 'fee_cents'>[];
    const uncoveredOrders = paidOrders.filter((o) => !coveredOrderIds.has(o.id));

    if (uncoveredOrders.length === 0) {
      return NextResponse.json(
        { error: 'No paid orders available for payout on this event' },
        { status: 400 },
      );
    }

    // Compute totals
    let grossAmountCents = 0;
    let summedFeeCents = 0;
    for (const order of uncoveredOrders) {
      grossAmountCents += order.subtotal_cents ?? 0;
      summedFeeCents += order.fee_cents ?? 0;
    }

    const computedPlatformFee = Math.ceil(grossAmountCents * PLATFORM_FEE_RATE);
    const effectivePlatformFee = Math.max(summedFeeCents, computedPlatformFee);
    const chargebackReserveCents = Math.ceil(grossAmountCents * CHARGEBACK_RESERVE_RATE);
    const netAmountCents = grossAmountCents - effectivePlatformFee - chargebackReserveCents;

    if (netAmountCents <= 0) {
      return NextResponse.json(
        { error: 'Net payout amount is too low after fees and reserve deductions' },
        { status: 400 },
      );
    }

    // scheduled_for = event.ends_at + 48h (fall back to starts_at if ends_at is null)
    const eventEndBase = event.ends_at ?? event.starts_at;
    const scheduledFor = new Date(eventEndBase);
    scheduledFor.setHours(scheduledFor.getHours() + PAYOUT_DELAY_HOURS);

    const holdUntil = new Date(scheduledFor);
    holdUntil.setDate(holdUntil.getDate() + 14);

    const service = await createServiceClient();

    // Create the payout batch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batchData, error: batchErr } = await (service as any)
      .from('payout_batches')
      .insert({
        organizer_id: user.id,
        event_id: eventId,
        gross_amount_cents: grossAmountCents,
        platform_fee_cents: effectivePlatformFee,
        chargeback_reserve_cents: chargebackReserveCents,
        net_amount_cents: netAmountCents,
        currency: 'TTD',
        status: 'scheduled',
        bank_account_last4: bankAccount.account_last4,
        bank_name: bankAccount.bank_name,
        scheduled_for: scheduledFor.toISOString(),
        hold_until: holdUntil.toISOString(),
      })
      .select('id')
      .single();

    if (batchErr || !batchData) {
      return NextResponse.json(
        { error: batchErr?.message ?? 'Failed to create payout batch' },
        { status: 500 },
      );
    }

    const batchId = (batchData as { id: string }).id;

    // Create line items for each order
    const lineItems: LineItemInsert[] = uncoveredOrders.map((order) => {
      const gross = order.subtotal_cents ?? 0;
      const fee = Math.ceil(gross * PLATFORM_FEE_RATE);
      const reserve = Math.ceil(gross * CHARGEBACK_RESERVE_RATE);
      return {
        batch_id: batchId,
        order_id: order.id,
        gross_cents: gross,
        fee_cents: fee,
        net_cents: gross - fee - reserve,
        description: `Order ${order.id.slice(0, 8).toUpperCase()}`,
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: lineErr } = await (service as any)
      .from('payout_line_items')
      .insert(lineItems);
    if (lineErr) {
      console.error('[POST /api/payouts/request] line items error', lineErr);
    }

    return NextResponse.json(
      {
        batchId,
        netAmountCents,
        grossAmountCents,
        platformFeeCents: effectivePlatformFee,
        chargebackReserveCents,
        scheduledFor: scheduledFor.toISOString(),
        holdAmount: chargebackReserveCents,
        holdUntil: holdUntil.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/payouts/request]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
