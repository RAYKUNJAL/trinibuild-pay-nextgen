import Link from 'next/link';
import { FileText, Download } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/app/dashboard/_components/page-header';
import { PayoutStatusChip } from '@/components/payout-status-chip';
import { formatTTD, formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Payout Statements — WeFetePass' };

type EventJoin = {
  id: string;
  title: string;
  starts_at: string;
};

type StatementRow = {
  id: string;
  event_id: string | null;
  gross_amount_cents: number;
  platform_fee_cents: number;
  chargeback_reserve_cents: number;
  net_amount_cents: number;
  currency: string;
  status: 'completed';
  bank_account_last4: string | null;
  bank_name: string | null;
  bank_reference: string | null;
  completed_at: string | null;
  scheduled_for: string;
  events: EventJoin | null;
};

export default async function StatementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in?next=/dashboard/payouts/statements');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawData, error } = await (supabase as any)
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
      completed_at,
      scheduled_for,
      events ( id, title, starts_at )
      `,
    )
    .eq('organizer_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('[StatementsPage]', error);
  }

  const statements = (rawData ?? []) as StatementRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout Statements"
        description="Completed payout remittances. Download for accounting and tax records."
      />

      {statements.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium">No completed payouts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Statements appear here once a payout is marked as completed.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/payouts/ledger">View Ledger</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {statements.map((stmt) => (
            <Card key={stmt.id} className="border-border/60 hover:border-border transition-colors">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">
                      {stmt.events?.title ?? 'Unnamed Event'}
                    </p>
                    <PayoutStatusChip status="completed" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Statement #{stmt.id.slice(0, 8).toUpperCase()}
                    {stmt.completed_at
                      ? ` · Paid ${formatDateTime(stmt.completed_at)}`
                      : null}
                    {stmt.bank_name && stmt.bank_account_last4
                      ? ` · ${stmt.bank_name} ···${stmt.bank_account_last4}`
                      : null}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Net Paid</p>
                    <p className="font-display text-lg font-bold">
                      {formatTTD(stmt.net_amount_cents)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of {formatTTD(stmt.gross_amount_cents)} gross
                    </p>
                  </div>

                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/payouts/statements/${stmt.id}`}>
                      <Download className="mr-1.5 h-4 w-4" aria-hidden />
                      Statement
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
