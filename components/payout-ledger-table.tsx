import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PayoutStatusChip, type PayoutStatus } from '@/components/payout-status-chip';
import { formatTTD, formatDateTime } from '@/lib/utils';

export type PayoutBatch = {
  id: string;
  event_id: string | null;
  gross_amount_cents: number;
  platform_fee_cents: number;
  chargeback_reserve_cents: number;
  net_amount_cents: number;
  currency: string;
  status: PayoutStatus;
  hold_reason: string | null;
  scheduled_for: string;
  completed_at: string | null;
  bank_account_last4: string | null;
  bank_name: string | null;
  events?: { id: string; title: string; starts_at: string } | null;
};

interface PayoutLedgerTableProps {
  batches: PayoutBatch[];
  emptyMessage?: string;
}

export function PayoutLedgerTable({
  batches,
  emptyMessage = 'No payouts found.',
}: PayoutLedgerTableProps) {
  if (batches.length === 0) {
    return (
      <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Card className="border-border/60">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Gross</th>
                  <th className="px-4 py-3 text-right font-medium">Fee</th>
                  <th className="px-4 py-3 text-right font-medium">Reserve</th>
                  <th className="px-4 py-3 text-right font-medium">Net</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium leading-tight">
                        {batch.events?.title ?? '—'}
                      </p>
                      {batch.bank_name && batch.bank_account_last4 ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {batch.bank_name} ···{batch.bank_account_last4}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(batch.scheduled_for)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatTTD(batch.gross_amount_cents)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      -{formatTTD(batch.platform_fee_cents)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">
                      -{formatTTD(batch.chargeback_reserve_cents)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatTTD(batch.net_amount_cents)}
                    </td>
                    <td className="px-4 py-3">
                      <PayoutStatusChip status={batch.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {batch.status === 'completed' ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/payouts/statements/${batch.id}`}>
                            <FileText className="mr-1.5 h-4 w-4" aria-hidden />
                            Statement
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {batch.status === 'on_hold' && batch.hold_reason
                            ? holdReasonLabel(batch.hold_reason)
                            : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {batches.map((batch) => (
          <Card key={batch.id} className="border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{batch.events?.title ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTime(batch.scheduled_for)}
                  </p>
                </div>
                <PayoutStatusChip status={batch.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/30 p-3 text-xs">
                <div>
                  <p className="text-muted-foreground uppercase tracking-wide">Gross</p>
                  <p className="font-mono font-medium mt-0.5">
                    {formatTTD(batch.gross_amount_cents)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wide">Fee+Res</p>
                  <p className="font-mono font-medium mt-0.5 text-muted-foreground">
                    -{formatTTD(batch.platform_fee_cents + batch.chargeback_reserve_cents)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wide">Net</p>
                  <p className="font-mono font-semibold mt-0.5">
                    {formatTTD(batch.net_amount_cents)}
                  </p>
                </div>
              </div>

              {batch.bank_name && batch.bank_account_last4 ? (
                <p className="text-xs text-muted-foreground">
                  {batch.bank_name} ···{batch.bank_account_last4}
                </p>
              ) : null}

              {batch.status === 'completed' ? (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/dashboard/payouts/statements/${batch.id}`}>
                    <FileText className="mr-1.5 h-4 w-4" aria-hidden />
                    View Statement
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function holdReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    chargeback_reserve: 'Reserve held',
    dispute_pending: 'Dispute pending',
    verification_required: 'Verification needed',
    compliance_review: 'Compliance review',
    insufficient_balance: 'Insufficient balance',
    bank_validation_failed: 'Bank validation failed',
  };
  return labels[reason] ?? reason;
}
