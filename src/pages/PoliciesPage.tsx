import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllPolicies } from '../api/policies.api';
import { StatusBadge } from '../components/StatusBadge';
import { ChangePolicyStatusModal } from '../components/ChangePolicyStatusModal';
import type { Policy } from '../types';

export function PoliciesPage() {
  const navigate = useNavigate();
  const [modalPolicy, setModalPolicy] = useState<Policy | null>(null);

  const { data: policies, isLoading, isError } = useQuery({
    queryKey: ['policies'],
    queryFn: getAllPolicies,
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Polizas</h1>
        <button
          onClick={() => navigate('/policies/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nueva Poliza
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error al cargar las polizas. Verifique que el servidor este disponible.
        </div>
      )}

      {policies && policies.length === 0 && (
        <p className="text-gray-500 text-sm">No hay polizas registradas.</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
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
                    {policy.customer?.name ?? policy.customerId}
                  </td>
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

      {modalPolicy && (
        <ChangePolicyStatusModal
          policy={modalPolicy}
          isOpen={true}
          onClose={() => setModalPolicy(null)}
        />
      )}
    </div>
  );
}
