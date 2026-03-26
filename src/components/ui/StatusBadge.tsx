import { PaymentStatus } from '@/types';

interface StatusBadgeProps {
  status: PaymentStatus | string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  paid: {
    label: 'Paid',
    classes: 'bg-green-50 text-green-700 ring-green-600/20',
  },
  partially_paid: {
    label: 'Partially Paid',
    classes: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  },
  unpaid: {
    label: 'Unpaid',
    classes: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  },
  overdue: {
    label: 'Overdue',
    classes: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  advance: {
    label: 'Advance',
    classes: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    classes: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
