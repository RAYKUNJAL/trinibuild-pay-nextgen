import {
  ArrowRight,
  Clock,
  Building2,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Ban,
  XCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/app/dashboard/_components/page-header';

export const metadata = { title: 'Payout Schedule — WeFetePass' };

const HOLD_REASONS = [
  {
    reason: 'Chargeback Reserve',
    icon: ShieldAlert,
    description:
      'A 5% reserve is automatically held for 14 days after your event ends. This protects against buyers initiating disputes with their card issuer.',
    resolution: 'No action required. Funds are automatically released after 14 days and credited to your next payout cycle.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  {
    reason: 'Dispute Pending',
    icon: AlertCircle,
    description:
      'A buyer has opened a formal dispute with their payment provider. The associated funds are frozen until the dispute is resolved.',
    resolution:
      'Respond to dispute evidence requests via your dashboard within 7 days. WeFetePass support can assist with documentation.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  {
    reason: 'Verification Required',
    icon: Info,
    description:
      'Additional identity or business verification is needed before payouts can be processed to your account.',
    resolution:
      'Complete your promoter verification under Settings → Verification. Typically resolved within 1–2 business days.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  {
    reason: 'Compliance Review',
    icon: CheckCircle2,
    description:
      'Your payout is being reviewed for compliance with T&T financial regulations. This is routine for new accounts or large first payouts.',
    resolution:
      'Contact payouts@wefetepass.com with your business registration details. Reviews typically complete within 3 business days.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  {
    reason: 'Insufficient Balance',
    icon: XCircle,
    description:
      'The net payout amount after deducting platform fees and chargeback reserve is below the minimum transfer threshold (TTD 100).',
    resolution:
      'Balances accumulate across your events. Once your total net balance exceeds TTD 100, the payout will be processed automatically.',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
  {
    reason: 'Bank Validation Failed',
    icon: Ban,
    description:
      'The bank account details on file could not be verified with the receiving bank, preventing the wire transfer.',
    resolution:
      'Update your bank details in Settings → Payouts. Double-check your account number and routing information with your bank.',
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-50 border-zinc-200',
  },
];

const SUPPORTED_BANKS = [
  { name: 'Republic Bank', code: 'RBNKTTPS' },
  { name: 'First Citizens Bank', code: 'FCIBTTPS' },
  { name: 'Scotiabank Trinidad', code: 'NOSCTTPS' },
  { name: 'RBC Royal Bank', code: 'ROYCTTTX' },
  { name: 'JMMB Bank', code: 'JMMBTTPS' },
];

type TimelineStep = {
  label: string;
  detail: string;
  icon: React.ElementType;
  active?: boolean;
};

const TIMELINE_STEPS: TimelineStep[] = [
  {
    label: 'Ticket sale',
    detail: 'Buyer pays. Funds are held securely in escrow.',
    icon: CheckCircle2,
    active: true,
  },
  {
    label: 'Event day',
    detail: 'Your event runs. Passes are scanned.',
    icon: Clock,
    active: true,
  },
  {
    label: '+48 hours',
    detail: 'Payout processing window opens after your event ends.',
    icon: Clock,
    active: true,
  },
  {
    label: 'Payout initiated',
    detail: 'WeFetePass sends the wire to your bank minus fees and 5% reserve.',
    icon: Building2,
    active: true,
  },
  {
    label: '1–3 business days',
    detail: 'Your bank credits the funds. Local T&T banks typically settle within 1 day.',
    icon: CheckCircle2,
    active: true,
  },
  {
    label: '+14 days',
    detail: 'Chargeback reserve released and credited to your next payout cycle.',
    icon: ShieldAlert,
    active: false,
  },
];

export default function PayoutSchedulePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="How Payouts Work"
        description="Clear, transparent timelines — no surprises, no hidden holds."
      />

      {/* Timeline */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Payout Timeline</h2>
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="relative">
              {TIMELINE_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isLast = i === TIMELINE_STEPS.length - 1;
                return (
                  <div key={step.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                          step.active
                            ? 'border-brand-red bg-brand-red/10 text-brand-red'
                            : 'border-border bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      {!isLast ? (
                        <div className="my-1 w-px flex-1 bg-border/60" />
                      ) : null}
                    </div>
                    <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                      <p className="font-semibold text-sm leading-tight">{step.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Reserve policy */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Reserve &amp; Fee Policy</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/60">
            <CardContent className="p-5 space-y-2">
              <p className="font-semibold text-sm">Platform Fee</p>
              <p className="font-display text-3xl font-bold text-brand-red">7.5%</p>
              <p className="text-sm text-muted-foreground">
                Deducted from gross revenue. Covers payment processing, platform maintenance,
                fraud protection, and buyer support.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-5 space-y-2">
              <p className="font-semibold text-sm">Chargeback Reserve</p>
              <p className="font-display text-3xl font-bold text-amber-600">5%</p>
              <p className="text-sm text-muted-foreground">
                Held for 14 days after each event. Released automatically. Protects against
                post-event card disputes which are common in T&T.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 rounded-lg border border-border/60 p-4">
          <p className="text-sm font-semibold mb-2">Example: TTD 10,000 gross event</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross revenue</span>
              <span className="font-mono">TTD 10,000.00</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform fee (7.5%)</span>
              <span className="font-mono text-red-600">-TTD 750.00</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Chargeback reserve (5%, held 14 days)</span>
              <span className="font-mono text-amber-600">-TTD 500.00</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold">
              <span>Net payout (day 1)</span>
              <span className="font-mono text-emerald-700">TTD 8,750.00</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Reserve released (day 14)</span>
              <span className="font-mono text-emerald-600">+TTD 500.00</span>
            </div>
          </div>
        </div>
      </section>

      {/* Supported banks */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Supported Banks</h2>
        <p className="text-sm text-muted-foreground mb-4">
          All payouts are in TTD via local wire transfer. We support the following
          Trinidad &amp; Tobago banks:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORTED_BANKS.map((bank) => (
            <Card key={bank.code} className="border-border/60">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-9 w-9 shrink-0 rounded-md bg-muted/50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-sm">{bank.name}</p>
                  <p className="text-xs text-muted-foreground">{bank.code}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Using another bank? Select &quot;Other&quot; when adding your bank account.
          Transfers may take an additional 1–2 days.
        </p>
      </section>

      {/* Hold reasons */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">
          What Puts a Payout On Hold?
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Payouts can be held for the following reasons. Each one has a clear resolution path.
        </p>
        <div className="space-y-4">
          {HOLD_REASONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.reason}
                className={`flex gap-4 rounded-lg border p-4 ${item.bgColor}`}
              >
                <div className={`mt-0.5 shrink-0 ${item.color}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="space-y-1.5">
                  <p className={`font-semibold text-sm ${item.color}`}>{item.reason}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-start gap-2 pt-1">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/60" aria-hidden />
                    <p className="text-sm font-medium">{item.resolution}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section>
        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-6 text-center space-y-2">
            <p className="font-semibold">Still have questions about your payout?</p>
            <p className="text-sm text-muted-foreground">
              Our payout team is available Monday–Friday, 9am–5pm AST.
            </p>
            <a
              href="mailto:payouts@wefetepass.com"
              className="inline-block text-brand-red font-medium text-sm hover:underline"
            >
              payouts@wefetepass.com
            </a>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
