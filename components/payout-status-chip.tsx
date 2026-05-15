import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PayoutStatus =
  | 'scheduled'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'on_hold'
  | 'cancelled';

type ChipConfig = {
  label: string;
  icon: React.ElementType;
  className: string;
};

const STATUS_MAP: Record<PayoutStatus, ChipConfig> = {
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  on_hold: {
    label: 'On Hold',
    icon: AlertCircle,
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  cancelled: {
    label: 'Cancelled',
    icon: Ban,
    className: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  },
};

export function PayoutStatusChip({ status }: { status: PayoutStatus }) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.scheduled;
  const Icon = config.icon;
  const isSpinning = status === 'processing';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        config.className,
      )}
    >
      <Icon
        className={cn('h-3.5 w-3.5', isSpinning && 'animate-spin')}
        aria-hidden
      />
      {config.label}
    </span>
  );
}
