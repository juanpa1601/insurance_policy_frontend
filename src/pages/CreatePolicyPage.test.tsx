import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllCustomers } from '../api/customers.api';
import { createPolicy } from '../api/policies.api';
import type { Policy } from '../types';
import { CreatePolicyPage } from './CreatePolicyPage';

vi.mock('../api/customers.api', () => ({ getAllCustomers: vi.fn() }));
vi.mock('../api/policies.api', () => ({ createPolicy: vi.fn() }));
const getAllCustomersMock = vi.mocked(getAllCustomers);
const createPolicyMock = vi.mocked(createPolicy);

const CUSTOMER_ID = '6f1c2b8e-1d2a-4c3b-9e4f-5a6b7c8d9e0f';

const createdPolicy: Policy = {
  id: 'policy-1',
  policyNumber: 'POL-2026-000001',
  customerId: CUSTOMER_ID,
  branch: 'AUTO',
  status: 'QUOTED',
  ratingStrategy: 'RISK_BASED',
  monthlyPremium: 168000,
  coverage: { coverageAmount: 80000000, termMonths: 12 },
  riskProfile: { riskScore: 40 },
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

const renderPage = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CreatePolicyPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  // Los labels del formulario no están asociados a sus controles, así que
  // se ubican por rol y orden: cliente, ramo, estrategia.
  await screen.findByRole('option', { name: /Ana Torres/ });
  const [customer, branch, strategy] = screen.getAllByRole('combobox');
  const submit = screen.getByRole('button', { name: 'Cotizar Póliza' });
  return { user, customer, branch, strategy, submit };
};

describe('CreatePolicyPage (formulario con Zod + React Hook Form)', () => {
  beforeEach(() => {
    getAllCustomersMock.mockReset().mockResolvedValue([
      {
        id: CUSTOMER_ID,
        name: 'Ana Torres',
        email: 'ana@example.com',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    createPolicyMock.mockReset().mockResolvedValue(createdPolicy);
  });

  it('exige seleccionar un cliente antes de cotizar', async () => {
    const { user, submit } = await renderPage();

    await user.click(submit);

    expect(await screen.findByText('Seleccione un cliente')).toBeInTheDocument();
    expect(createPolicyMock).not.toHaveBeenCalled();
  });

  it('RISK_BASED con el Risk Score vacío muestra el error y no envía', async () => {
    const { user, customer, strategy, submit } = await renderPage();

    await user.selectOptions(customer, CUSTOMER_ID);
    await user.selectOptions(strategy, 'RISK_BASED');
    await user.click(submit);

    expect(
      await screen.findByText('Risk Score es requerido para la estrategia RISK_BASED'),
    ).toBeInTheDocument();
    expect(createPolicyMock).not.toHaveBeenCalled();
  });

  it('envía el riskScore como número y muestra la prima calculada', async () => {
    const { user, customer, strategy, submit } = await renderPage();

    await user.selectOptions(customer, CUSTOMER_ID);
    await user.selectOptions(strategy, 'RISK_BASED');
    await user.type(screen.getByRole('spinbutton'), '40');
    await user.click(submit);

    expect(await screen.findByText('¡Póliza creada exitosamente!')).toBeInTheDocument();
    expect(createPolicyMock).toHaveBeenCalledWith({
      customerId: CUSTOMER_ID,
      branch: 'AUTO',
      ratingStrategy: 'RISK_BASED',
      riskProfile: { riskScore: 40 },
    });
  });

  it('un año de lealtad vacío no bloquea una póliza STANDARD tras cambiar de estrategia', async () => {
    const { user, customer, branch, strategy, submit } = await renderPage();

    await user.selectOptions(customer, CUSTOMER_ID);
    await user.selectOptions(branch, 'TRAVEL');
    await user.selectOptions(strategy, 'LOYALTY');
    await user.clear(screen.getByRole('spinbutton'));
    await user.selectOptions(strategy, 'STANDARD');
    await user.click(submit);

    await screen.findByText('¡Póliza creada exitosamente!');
    expect(createPolicyMock).toHaveBeenCalledWith({
      customerId: CUSTOMER_ID,
      branch: 'TRAVEL',
      ratingStrategy: 'STANDARD',
      riskProfile: {},
    });
  });

  it('muestra un error si la API rechaza la cotización', async () => {
    createPolicyMock.mockRejectedValue(new Error('Request failed with status code 400'));
    const { user, customer, submit } = await renderPage();

    await user.selectOptions(customer, CUSTOMER_ID);
    await user.click(submit);

    expect(
      await screen.findByText('Error al crear la póliza. Verifique los datos e intente nuevamente.'),
    ).toBeInTheDocument();
  });
});
