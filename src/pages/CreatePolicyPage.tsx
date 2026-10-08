import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPolicy } from '../api/policies.api';
import { getAllCustomers } from '../api/customers.api';
import type { Policy } from '../types';
import {
  createPolicySchema,
  type CreatePolicyFormData as FormData,
  type CreatePolicyFormInput as FormInput,
} from './createPolicy.schema';

export function CreatePolicyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createdPolicy, setCreatedPolicy] = useState<Policy | null>(null);

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: getAllCustomers,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(createPolicySchema),
    defaultValues: { branch: 'AUTO', ratingStrategy: 'STANDARD' },
  });

  const watchedStrategy = useWatch({ control, name: 'ratingStrategy' });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createPolicy({
        customerId: data.customerId,
        branch: data.branch,
        ratingStrategy: data.ratingStrategy,
        riskProfile: {
          ...(data.riskScore !== undefined && { riskScore: data.riskScore }),
          ...(data.customerSince !== undefined && { customerSince: data.customerSince }),
        },
      }),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setCreatedPolicy(policy);
    },
  });

  if (createdPolicy) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-green-800">¡Póliza creada exitosamente!</h2>
          <div className="space-y-2 text-sm text-green-700">
            <p><span className="font-medium">Número:</span> {createdPolicy.policyNumber}</p>
            <p><span className="font-medium">Ramo:</span> {createdPolicy.branch}</p>
            <p><span className="font-medium">Estrategia:</span> {createdPolicy.ratingStrategy}</p>
            <p><span className="font-medium">Estado:</span> {createdPolicy.status}</p>
            <p className="text-xl font-bold text-green-900 pt-2">
              Prima calculada:{' '}
              {createdPolicy.monthlyPremium?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/policies')}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ver Pólizas
            </button>
            <button
              onClick={() => {
                setCreatedPolicy(null);
                reset();
              }}
              className="flex-1 border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
            >
              Nueva Póliza
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/policies')}
          className="text-sm text-blue-600 hover:underline mb-2 block"
        >
          ← Volver a pólizas
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Póliza</h1>
      </div>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4 bg-white rounded-lg shadow p-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select
            {...register('customerId')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Seleccione un cliente...</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.email}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-red-600 text-sm mt-1">{errors.customerId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ramo</label>
          <select
            {...register('branch')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {(['AUTO', 'LIFE', 'HOME', 'HEALTH', 'TRAVEL'] as const).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estrategia de Tarificación</label>
          <select
            {...register('ratingStrategy')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="STANDARD">STANDARD</option>
            <option value="RISK_BASED">RISK_BASED</option>
            <option value="LOYALTY">LOYALTY</option>
          </select>
        </div>

        {watchedStrategy === 'RISK_BASED' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Score <span className="text-gray-400">(0–100)</span>
            </label>
            <input
              {...register('riskScore')}
              type="number"
              min={0}
              max={100}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="50"
            />
            {errors.riskScore && <p className="text-red-600 text-sm mt-1">{errors.riskScore.message}</p>}
          </div>
        )}

        {watchedStrategy === 'LOYALTY' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente desde <span className="text-gray-400">(año)</span>
            </label>
            <input
              {...register('customerSince')}
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2020"
            />
            {errors.customerSince && (
              <p className="text-red-600 text-sm mt-1">{errors.customerSince.message}</p>
            )}
          </div>
        )}

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Error al crear la póliza. Verifique los datos e intente nuevamente.
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/policies')}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Cotizando...' : 'Cotizar Póliza'}
          </button>
        </div>
      </form>
    </div>
  );
}
