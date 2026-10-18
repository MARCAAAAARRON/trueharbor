import type { OrderStatus } from '../types/api';

interface StatusChipProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  pending: { label: 'Awaiting payment', dot: 'bg-slate', bg: 'bg-fog/60', text: 'text-tide' },
  paid: { label: 'Paid', dot: 'bg-harbor', bg: 'bg-wash', text: 'text-tide' },
  shipped: { label: 'Shipped', dot: 'bg-harbor', bg: 'bg-wash', text: 'text-tide' },
  delivered: { label: 'Delivered', dot: 'bg-sea', bg: 'bg-sea-tint', text: 'text-tide' },
  cancelled: { label: 'Cancelled', dot: 'bg-buoy', bg: 'bg-buoy-tint', text: 'text-tide' },
  expired: { label: 'Expired', dot: 'bg-slate', bg: 'bg-fog/60', text: 'text-tide' },
};

export default function StatusChip({ status, className = '' }: StatusChipProps) {
  const conf = statusConfig[status] ?? statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium ${conf.bg} ${conf.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} flex-shrink-0`} aria-hidden="true" />
      {conf.label}
    </span>
  );
}
