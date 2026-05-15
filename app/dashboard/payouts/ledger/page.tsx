'use client';

import { useEffect, useState, useCallback } from 'react';
import { Info, Wallet, TrendingUp, ShieldAlert, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PayoutLedgerTable, type PayoutBatch } from '@/components/payout-ledger-table';
import { formatTTD } from '@/lib/utils';
import { toast } from 'sonner';

interface LedgerResponse {
  batches: PayoutBatch[];
  pendingBalanceCents: number;
  totalPaidOutCents: number;
  page: number;
  total: number;
}

interface EventOption {
  id: string;
  title: string;
  status: string;
}

interface BankAccountOption {
  id: string;
  bank_name: string;
  account_last4: string;
  validated: boolean;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`rounded-lg p-2 ${accent ?? 'bg-muted'}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PayoutLedgerPage() {
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payouts/ledger');
      if (!res.ok) throw new Error('Failed to load ledger');
      const json: LedgerResponse = await res.json();
      setData(json);
    } catch {
      toast.error('Could not load payout data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLedger();
  }, [fetchLedger]);

  async function openRequestDialog() {
    // Fetch organizer's events and bank accounts for the modal
    const [evRes, baRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/payouts/bank'),
    ]);

    if (evRes.ok) {
      const evJson = await evRes.json();
      // Accept both {events:[]} and array shapes
      setEvents(Array.isArray(evJson) ? evJson : (evJson.events ?? []));
    }
    if (baRes.ok) {
      const baJson = await baRes.json();
      setBankAccounts(Array.isArray(baJson) ? baJson : (baJson.accounts ?? []));
    }

    setRequestDialogOpen(true);
  }

  async function handleRequestPayout() {
    if (!selectedEventId || !selectedBankId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEventId, bankAccountId: selectedBankId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Payout request failed');
        return;
      }
      toast.success(
        `Payout of ${formatTTD(json.netAmountCents)} scheduled`,
        {
          description: `Funds will be sent on ${new Date(json.scheduledFor).toLocaleDateString('en-TT')}.`,
        },
      );
      setRequestDialogOpen(false);
      setSelectedEventId('');
      setSelectedBankId('');
      void fetchLedger();
    } finally {
      setSubmitting(false);
    }
  }

  const allBatches = data?.batches ?? [];
  const pendingBatches = allBatches.filter((b) =>
    ['scheduled', 'processing'].includes(b.status),
  );
  const onHoldBatches = allBatches.filter((b) => b.status === 'on_hold');

  const reserveHeldCents = allBatches
    .filter((b) => ['scheduled', 'processing', 'on_hold'].includes(b.status))
    .reduce((sum, b) => sum + b.chargeback_reserve_cents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Payout Ledger
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track every cent from ticket sales to your bank account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/payouts/schedule">How payouts work</Link>
          </Button>
          <Button
            size="sm"
            className="bg-brand-red text-white hover:bg-brand-red/90"
            onClick={openRequestDialog}
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Pending Balance"
            value={formatTTD(data?.pendingBalanceCents ?? 0)}
            icon={Wallet}
            accent="bg-blue-100 text-blue-700"
          />
          <SummaryCard
            label="Total Paid Out"
            value={formatTTD(data?.totalPaidOutCents ?? 0)}
            icon={TrendingUp}
            accent="bg-emerald-100 text-emerald-700"
          />
          <SummaryCard
            label="Reserve Held"
            value={formatTTD(reserveHeldCents)}
            icon={ShieldAlert}
            accent="bg-amber-100 text-amber-700"
          />
        </div>
      )}

      {/* Reserve policy notice */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
        <p className="text-blue-800">
          <strong>Chargeback reserve:</strong> A 5% reserve is held for 14 days after each
          event to cover any chargebacks. Reserved funds are automatically released to your
          next payout cycle once the hold period expires.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All Payouts
            {allBatches.length > 0 ? (
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {allBatches.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pendingBatches.length > 0 ? (
              <span className="ml-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                {pendingBatches.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="on_hold">
            On Hold
            {onHoldBatches.length > 0 ? (
              <span className="ml-2 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                {onHoldBatches.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <PayoutLedgerTable
              batches={allBatches}
              emptyMessage="No payouts yet. Request your first payout above."
            />
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <PayoutLedgerTable
              batches={pendingBatches}
              emptyMessage="No pending payouts right now."
            />
          )}
        </TabsContent>

        <TabsContent value="on_hold" className="mt-4">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <PayoutLedgerTable
              batches={onHoldBatches}
              emptyMessage="No payouts currently on hold."
            />
          )}
          {!loading && onHoldBatches.length > 0 ? (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" aria-hidden />
              <p className="text-orange-800">
                Payouts on hold require action. Visit{' '}
                <Link
                  href="/dashboard/payouts/schedule"
                  className="underline underline-offset-2"
                >
                  the payout schedule page
                </Link>{' '}
                for guidance on resolving each hold reason.
              </p>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Request Payout Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Select the event and bank account for your payout. Net amount is calculated
              after platform fee (7.5%) and 5% chargeback reserve.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="event-select">Event</Label>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No eligible events found.{' '}
                  <Link href="/dashboard/events" className="text-brand-red underline">
                    Manage events
                  </Link>
                </p>
              ) : (
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger id="event-select">
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-select">Bank Account</Label>
              {bankAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No validated bank accounts.{' '}
                  <Link href="/dashboard/payouts" className="text-brand-red underline">
                    Add bank account
                  </Link>
                </p>
              ) : (
                <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                  <SelectTrigger id="bank-select">
                    <SelectValue placeholder="Choose a bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((ba) => (
                      <SelectItem key={ba.id} value={ba.id} disabled={!ba.validated}>
                        {ba.bank_name} ···{ba.account_last4}
                        {!ba.validated ? ' (not validated)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p>Platform fee: 7.5% of gross revenue</p>
              <p>Chargeback reserve: 5% held for 14 days post-event</p>
              <p>Payout window: 48 hours after event ends</p>
              <p>Bank processing: 1–3 business days after initiation</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRequestDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-red text-white hover:bg-brand-red/90"
              onClick={handleRequestPayout}
              disabled={!selectedEventId || !selectedBankId || submitting}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Request Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
