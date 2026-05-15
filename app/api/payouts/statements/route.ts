import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type StatementRaw = {
  id: string;
  event_id: string | null;
  gross_amount_cents: number;
  platform_fee_cents: number;
  chargeback_reserve_cents: number;
  net_amount_cents: number;
  currency: string;
  status: string;
  bank_account_last4: string | null;
  bank_name: string | null;
  bank_reference: string | null;
  scheduled_for: string;
  completed_at: string | null;
  created_at: string;
  events: { id: string; title: string; starts_at: string } | null;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: statementsRaw, error } = await (supabase as any)
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
        bank_account_last4,
        bank_name,
        bank_reference,
        scheduled_for,
        completed_at,
        created_at,
        events ( id, title, starts_at )
        `,
      )
      .eq('organizer_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ statements: (statementsRaw ?? []) as StatementRaw[] });
  } catch (err) {
    console.error('[GET /api/payouts/statements]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
