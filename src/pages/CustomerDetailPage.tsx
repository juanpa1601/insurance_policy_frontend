import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomer } from '../api/customers.api';
import { getPoliciesByCustomer } from '../api/policies.api';
import { CustomerBadge } from '../components/CustomerBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ChangePolicyStatusModal } from '../components/ChangePolicyStatusModal';
import type { Policy } from '../types';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [modalPolicy, setModalPolicy] = useState<Policy | null>(null);

  const { data: customer, isLoading: loadingCustomer, isError: errorCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id!),
    enabled: !!id,
  });

  const { data: policies, isLoading: loadingPolicies } = useQuery({
    queryKey: ['policies', 'customer', id],
    queryFn: () => getPoliciesByCustomer(id!),
    enabled: !!id,
  });

  if (loadingCustomer) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (errorCustomer || !customer) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Cliente no encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/customers')}
        className="text-sm text-blue-600 hover:underline"
      >
        &larr; Volver a clientes
      </button>

      <div className="bg-white rounded-lg shadow p-6 space-y-3">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <CustomerBadge isActive={customer.isActive} />
        </div>
        <p className="text-gray-500">{customer.email}</p>
        <div className="text-sm text-gray-400 space-y-1">
          <p>Creado: {new Date(customer.createdAt).toLocaleDateString('es-MX')}</p>
          <p>Actualizado: {new Date(customer.updatedAt).toLocaleDateString('es-MX')}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Polizas</h2>
          <button
            onClick={() => navigate('/policies/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Nueva Poliza
          </button>
        </div>

        {loadingPolicies && (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {policies && policies.length === 0 && (
          <p className="text-gray-500 text-sm">Este cliente no tiene polizas.</p>
        )}

        {policies && policies.length > 0 && (
          <div className="overflow-hidden shadow ring-1 ring-black/5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numero</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ramo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estrategia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prima Mensual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{policy.policyNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{policy.branch}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{policy.ratingStrategy}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(policy.monthlyPremium ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={policy.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(policy.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        disabled={policy.status === 'CANCELLED'}
                        onClick={() => setModalPolicy(policy)}
                        className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        Cambiar Estado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalPolicy && (
        <ChangePolicyStatusModal
          policy={modalPolicy}
          isOpen={true}
          onClose={() => setModalPolicy(null)}
          extraQueryKeys={[['policies', 'customer', id]]}
        />
      )}
    </div>
  );
}
