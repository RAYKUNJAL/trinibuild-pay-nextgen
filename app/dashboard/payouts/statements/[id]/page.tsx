import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Separator } from '@/components/ui/separator';
import { formatTTD, formatDateTime } from '@/lib/utils';
import { PrintButton } from './print-button';
import type { Database } from '@/lib/database.types';

export const metadata = { title: 'Remittance Statement — WeFetePass' };

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PromoterRow = Database['public']['Tables']['promoter_profiles']['Row'];

type LineItemRow = {
  id: string;
  order_id: string;
  gross_cents: number;
  fee_cents: number;
  net_cents: number;
  description: string | null;
  created_at: string;
};

type EventJoin = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  venue: string;
  city: string;
};

type BatchRow = {
  id: string;
  organizer_id: string;
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
  initiated_at: string | null;
  completed_at: string | null;
  events: EventJoin | null;
};

export default async function StatementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/sign-in?next=/dashboard/payouts/statements/${id}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: batchRaw, error: batchErr } = await (supabase as any)
    .from('payout_batches')
    .select(
      `
      id,
      organizer_id,
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
      initiated_at,
      completed_at,
      events ( id, title, starts_at, ends_at, venue, city )
      `,
    )
    .eq('id', id)
    .maybeSingle();

  if (batchErr || !batchRaw) {
    notFound();
  }

  const batch = batchRaw as BatchRow;

  // Verify ownership
  if (batch.organizer_id !== user.id) {
    notFound();
  }

  // Fetch line items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lineItemsRaw } = await (supabase as any)
    .from('payout_line_items')
    .select('id, order_id, gross_cents, fee_cents, net_cents, description, created_at')
    .eq('batch_id', id)
    .order('created_at', { ascending: true });

  const lineItems = (lineItemsRaw ?? []) as LineItemRow[];

  // Fetch organizer info
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileRaw as Pick<ProfileRow, 'full_name'> | null;

  const { data: promoterRaw } = await supabase
    .from('promoter_profiles')
    .select('brand_name')
    .eq('profile_id', user.id)
    .maybeSingle();
  const promoter = promoterRaw as Pick<PromoterRow, 'brand_name'> | null;

  const organizerName = promoter?.brand_name ?? profile?.full_name ?? user.email ?? 'Organizer';
  const statementNumber = `WFP-${batch.id.slice(0, 8).toUpperCase()}`;
  const payoutDate = batch.completed_at ?? batch.scheduled_for;

  const feePercent =
    batch.gross_amount_cents > 0
      ? ((batch.platform_fee_cents / batch.gross_amount_cents) * 100).toFixed(1)
      : '7.5';

  return (
    <div className="min-h-screen bg-white">
      {/* Screen-only nav bar */}
      <div className="print:hidden flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3">
        <Link
          href="/dashboard/payouts/statements"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Statements
        </Link>
        <PrintButton />
      </div>

      {/* Statement body */}
      <div className="mx-auto max-w-3xl px-8 py-10 print:py-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-[#E40C2B] flex items-center justify-center">
                <span className="text-white font-bold text-xs">WF</span>
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-gray-900">
                WeFetePass
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Trinidad &amp; Tobago Carnival Ticketing
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">Remittance Statement</p>
            <p className="text-sm text-gray-500">#{statementNumber}</p>
            <p className="text-sm text-gray-500">{formatDateTime(payoutDate)}</p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Two-column info */}
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Payee</p>
            <p className="font-semibold text-gray-900">{organizerName}</p>
            <p className="text-gray-500">
              Organizer ID: {user.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Bank Account</p>
            {batch.bank_name ? (
              <>
                <p className="font-semibold text-gray-900">{batch.bank_name}</p>
                {batch.bank_account_last4 ? (
                  <p className="text-gray-500">Account ending ···{batch.bank_account_last4}</p>
                ) : null}
              </>
            ) : (
              <p className="text-gray-400">—</p>
            )}
            {batch.bank_reference ? (
              <p className="text-gray-500 mt-0.5">Ref: {batch.bank_reference}</p>
            ) : null}
          </div>
        </div>

        {/* Event info */}
        {batch.events ? (
          <div className="mt-6 rounded-lg bg-gray-50 border border-gray-100 p-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Event</p>
            <p className="font-semibold text-gray-900">{batch.events.title}</p>
            <p className="text-gray-500">
              {formatDateTime(batch.events.starts_at)}
              {batch.events.ends_at
                ? ` — ${formatDateTime(batch.events.ends_at)}`
                : ''}
            </p>
            <p className="text-gray-500">
              {batch.events.venue}, {batch.events.city}
            </p>
          </div>
        ) : null}

        {/* Line items table */}
        {lineItems.length > 0 ? (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
              Order Line Items ({lineItems.length})
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left font-semibold text-gray-700">Description</th>
                  <th className="py-2 text-right font-semibold text-gray-700">Gross</th>
                  <th className="py-2 text-right font-semibold text-gray-700">Fee</th>
                  <th className="py-2 text-right font-semibold text-gray-700">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lineItems.map((item) => (
                  <tr key={item.id} className="text-gray-700">
                    <td className="py-2">
                      {item.description ??
                        `Order ${item.order_id.slice(0, 8).toUpperCase()}`}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {formatTTD(item.gross_cents)}
                    </td>
                    <td className="py-2 text-right font-mono text-gray-400">
                      -{formatTTD(item.fee_cents)}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {formatTTD(item.net_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Totals */}
        <div className="mt-8 ml-auto max-w-xs">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Gross Revenue</span>
              <span className="font-mono">{formatTTD(batch.gross_amount_cents)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Platform Fee ({feePercent}%)</span>
              <span className="font-mono">-{formatTTD(batch.platform_fee_cents)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Chargeback Reserve (5%)</span>
              <span className="font-mono">
                -{formatTTD(batch.chargeback_reserve_cents)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-gray-900">
              <span>Net Payout</span>
              <span className="font-mono text-lg">
                {formatTTD(batch.net_amount_cents)}
              </span>
            </div>
          </div>
        </div>

        <Separator className="mt-10 mb-6" />

        {/* Footer */}
        <div className="flex flex-col gap-1 text-xs text-gray-400 sm:flex-row sm:justify-between">
          <div>
            <p>WeFetePass Ltd. · Port of Spain, Trinidad and Tobago</p>
            <p>
              Questions? Contact{' '}
              <span className="text-[#E40C2B]">payouts@wefetepass.com</span>
            </p>
          </div>
          <div className="text-right">
            <p>
              Statement generated:{' '}
              {new Date().toLocaleDateString('en-TT', {
                timeZone: 'America/Port_of_Spain',
              })}
            </p>
            <p>Currency: {batch.currency}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
