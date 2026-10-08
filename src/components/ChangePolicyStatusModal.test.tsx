import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changePolicyStatus } from '../api/policies.api';
import type { Policy, PolicyStatus } from '../types';
import { ChangePolicyStatusModal } from './ChangePolicyStatusModal';

vi.mock('../api/policies.api', () => ({ changePolicyStatus: vi.fn() }));
const changePolicyStatusMock = vi.mocked(changePolicyStatus);

const policy = (status: PolicyStatus): Policy => ({
  id: 'policy-1',
  policyNumber: 'POL-2026-000001',
  customerId: 'customer-1',
  branch: 'AUTO',
  status,
  ratingStrategy: 'STANDARD',
  monthlyPremium: 120000,
  coverage: { coverageAmount: 80000000, termMonths: 12 },
  riskProfile: {},
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

const renderModal = (
  status: PolicyStatus,
  { isOpen = true, extraQueryKeys = [] as unknown[][] } = {},
) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ChangePolicyStatusModal
        policy={policy(status)}
        isOpen={isOpen}
        onClose={onClose}
        extraQueryKeys={extraQueryKeys}
      />
    </QueryClientProvider>,
  );
  return { onClose, invalidateQueries, user: userEvent.setup() };
};

// Opciones que muestra el modal: debe coincidir con la máquina de estados del backend.
const optionLabels = () =>
  screen
    .queryAllByRole('button')
    .map((button) => button.textContent?.trim())
    .filter((label) => label !== 'Cancelar' && label !== 'Confirmar');

describe('ChangePolicyStatusModal', () => {
  beforeEach(() => {
    changePolicyStatusMock.mockReset();
  });

  it('no renderiza nada cuando está cerrado', () => {
    renderModal('QUOTED', { isOpen: false });
    expect(screen.queryByText('Cambiar estado de poliza')).not.toBeInTheDocument();
  });

  it.each<[PolicyStatus, string[]]>([
    ['QUOTED', ['Emitida', 'Cancelada']],
    ['ISSUED', ['Activa', 'Cancelada']],
    ['ACTIVE', ['Suspendida', 'Cancelada']],
    ['SUSPENDED', ['Activa', 'Cancelada']],
  ])('desde %s ofrece solo las transiciones permitidas: %j', (status, expected) => {
    renderModal(status);
    expect(optionLabels()).toEqual(expected);
  });

  it('una póliza CANCELLED no ofrece transiciones ni botón Confirmar', () => {
    renderModal('CANCELLED');
    expect(screen.getByText('Esta poliza no admite mas cambios de estado.')).toBeInTheDocument();
    expect(optionLabels()).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
  });

  it('Confirmar está deshabilitado hasta elegir un estado', async () => {
    const { user } = renderModal('ACTIVE');
    const confirm = screen.getByRole('button', { name: 'Confirmar' });

    expect(confirm).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Suspendida' }));
    expect(confirm).toBeEnabled();
  });

  it('confirma la transición, refresca las consultas y cierra el modal', async () => {
    changePolicyStatusMock.mockResolvedValue({ ...policy('ISSUED') });
    const { user, onClose, invalidateQueries } = renderModal('QUOTED', {
      extraQueryKeys: [['customer-policies', 'customer-1']],
    });

    await user.click(screen.getByRole('button', { name: 'Emitida' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(changePolicyStatusMock).toHaveBeenCalledWith('policy-1', 'ISSUED');
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['policies'] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['customer-policies', 'customer-1'],
    });
  });

  it('muestra el mensaje de error del backend y no cierra el modal', async () => {
    changePolicyStatusMock.mockRejectedValue({
      response: { data: { message: "Policy with id 'policy-1' was not found" } },
    });
    const { user, onClose } = renderModal('QUOTED');

    await user.click(screen.getByRole('button', { name: 'Cancelada' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(
      await screen.findByText("Policy with id 'policy-1' was not found"),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('muestra un mensaje genérico si el error no trae mensaje', async () => {
    changePolicyStatusMock.mockRejectedValue(new Error('Network Error'));
    const { user } = renderModal('ACTIVE');

    await user.click(screen.getByRole('button', { name: 'Cancelada' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(
      await screen.findByText('Error al cambiar el estado. Intente nuevamente.'),
    ).toBeInTheDocument();
  });

  it('Cancelar cierra el modal sin llamar a la API', async () => {
    const { user, onClose } = renderModal('ACTIVE');

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(changePolicyStatusMock).not.toHaveBeenCalled();
  });
});
