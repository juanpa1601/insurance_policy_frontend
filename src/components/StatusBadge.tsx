import type { PolicyStatus } from '../types';

const statusConfig: Record<PolicyStatus, { label: string; className: string }> = {
  QUOTED:    { label: 'Cotizada',   className: 'bg-gray-100 text-gray-700' },
  ISSUED:    { label: 'Emitida',    className: 'bg-blue-100 text-blue-700' },
  ACTIVE:    { label: 'Activa',     className: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: 'Suspendida', className: 'bg-yellow-100 text-yellow-700' },
  CANCELLED: { label: 'Cancelada',  className: 'bg-red-100 text-red-700' },
};

interface Props {
  status: PolicyStatus;
}

export function StatusBadge({ status }: Props) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
