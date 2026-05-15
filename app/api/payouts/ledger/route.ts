import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const offset = (page - 1) * PAGE_SIZE;

    // Build payout_batches query with optional filters
    let query = supabase
      .from('payout_batches')
      .select(
        `
        id,
        event_id,
        gross_amount_cents,
        platform_fee_cents,
        chargeback_reserve_cents,
        net_amount_cents,
        currency,
        status,
        hold_reason,
        hold_until,
        bank_reference,
        bank_account_last4,
        bank_name,
        scheduled_for,
        initiated_at,
        completed_at,
        failed_reason,
        created_at,
        updated_at,
        events ( id, title, starts_at, ends_at )
        `,
        { count: 'exact' },
      )
      .eq('organizer_id', user.id)
      .order('scheduled_for', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    if (status) {
      // status is a comma-separated list or single value
      const statuses = status.split(',').map((s) => s.trim());
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0]);
      } else {
        query = query.in('status', statuses);
      }
    }

    const { data: batchesRaw, error: batchErr, count } = await query;

    if (batchErr) {
      return NextResponse.json({ error: batchErr.message }, { status: 500 });
    }

    const batches = batchesRaw ?? [];

    // Compute pending balance: paid orders for organizer's events not yet in a payout batch
    const { data: eventsData } = await supabase
      .from('events')
      .select('id')
      .eq('organizer_id', user.id);

    const eventIds = (eventsData ?? []).map((e: { id: string }) => e.id);

    let pendingBalanceCents = 0;
    if (eventIds.length > 0) {
      // Find all order IDs already assigned to a payout line item
      const { data: lineItemOrders } = await supabase
        .from('payout_line_items')
        .select('order_id, payout_batches!inner(organizer_id)')
        .eq('payout_batches.organizer_id', user.id);

      const coveredOrderIds = new Set(
        (lineItemOrders ?? []).map((li: { order_id: string }) => li.order_id),
      );

      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id, subtotal_cents, fee_cents')
        .in('event_id', eventIds)
        .eq('status', 'paid');

      for (const order of pendingOrders ?? []) {
        if (!coveredOrderIds.has(order.id)) {
          // Pending balance = subtotal minus platform fee minus 5% chargeback reserve
          const gross = order.subtotal_cents ?? 0;
          const platformFee = order.fee_cents ?? 0;
          const chargebackReserve = Math.ceil(gross * 0.05);
          pendingBalanceCents += gross - platformFee - chargebackReserve;
        }
      }
    }

    // Compute total paid out (sum of net_amount_cents for completed batches)
    const { data: completedSum } = await supabase
      .from('payout_batches')
      .select('net_amount_cents')
      .eq('organizer_id', user.id)
      .eq('status', 'completed');

    const totalPaidOutCents = (completedSum ?? []).reduce(
      (sum: number, b: { net_amount_cents: number }) => sum + (b.net_amount_cents ?? 0),
      0,
    );

    return NextResponse.json({
      batches,
      pendingBalanceCents,
      totalPaidOutCents,
      page,
      total: count ?? 0,
    });
  } catch (err) {
    console.error('[GET /api/payouts/ledger]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
