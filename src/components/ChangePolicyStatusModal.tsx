import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Policy, PolicyStatus } from '../types';
import { changePolicyStatus } from '../api/policies.api';
import { StatusBadge } from './StatusBadge';

// Debe reflejar la máquina de estados del backend (insurance_policy_api),
// que es quien valida: QUOTED también puede cancelarse directamente.
const VALID_TRANSITIONS: Record<PolicyStatus, PolicyStatus[]> = {
  QUOTED:    ['ISSUED', 'CANCELLED'],
  ISSUED:    ['ACTIVE', 'CANCELLED'],
  ACTIVE:    ['SUSPENDED', 'CANCELLED'],
  SUSPENDED: ['ACTIVE', 'CANCELLED'],
  CANCELLED: [],
};

interface Props {
  policy: Policy;
  isOpen: boolean;
  onClose: () => void;
  extraQueryKeys?: unknown[][];
}

export function ChangePolicyStatusModal({ policy, isOpen, onClose, extraQueryKeys = [] }: Props) {
  const [selected, setSelected] = useState<PolicyStatus | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (targetStatus: PolicyStatus) => changePolicyStatus(policy.id, targetStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      for (const key of extraQueryKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      setSelected(null);
      onClose();
    },
  });

  if (!isOpen) return null;

  const options = VALID_TRANSITIONS[policy.status];

  const handleClose = () => {
    if (mutation.isPending) return;
    mutation.reset();
    setSelected(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Cambiar estado de poliza</h2>
        <p className="text-sm text-gray-500 font-mono">{policy.policyNumber}</p>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Estado actual:</span>
          <StatusBadge status={policy.status} />
        </div>

        {options.length === 0 ? (
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
            Esta poliza no admite mas cambios de estado.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Cambiar a:</p>
            <div className="flex flex-wrap gap-2">
              {options.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => setSelected(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                    selected === status
                      ? 'border-blue-600 ring-2 ring-blue-200'
                      : 'border-transparent hover:border-gray-300'
                  } ${statusButtonClass(status)}`}
                >
                  {statusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        )}

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {backendMessage(mutation.error) ?? 'Error al cambiar el estado. Intente nuevamente.'}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          {options.length > 0 && (
            <button
              type="button"
              disabled={!selected || mutation.isPending}
              onClick={() => selected && mutation.mutate(selected)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {mutation.isPending && (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function statusLabel(status: PolicyStatus): string {
  const labels: Record<PolicyStatus, string> = {
    QUOTED:    'Cotizada',
    ISSUED:    'Emitida',
    ACTIVE:    'Activa',
    SUSPENDED: 'Suspendida',
    CANCELLED: 'Cancelada',
  };
  return labels[status];
}

function statusButtonClass(status: PolicyStatus): string {
  const classes: Record<PolicyStatus, string> = {
    QUOTED:    'bg-gray-100 text-gray-700',
    ISSUED:    'bg-blue-100 text-blue-700',
    ACTIVE:    'bg-green-100 text-green-700',
    SUSPENDED: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return classes[status];
}

function backendMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data
  ) {
    return String((error.response.data as { message: unknown }).message);
  }
  return null;
}
