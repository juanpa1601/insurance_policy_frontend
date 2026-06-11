import axios from 'axios';
import type { Policy, PolicyStatus, CreatePolicyPayload } from '../types';

const BASE = '/api/policies';

export async function getAllPolicies(): Promise<Policy[]> {
  const { data } = await axios.get<Policy[]>(BASE);
  return data;
}

export async function getPolicy(id: string): Promise<Policy> {
  const { data } = await axios.get<Policy>(`${BASE}/${id}`);
  return data;
}

export async function getPoliciesByCustomer(customerId: string): Promise<Policy[]> {
  const { data } = await axios.get<Policy[]>(`${BASE}/customer/${customerId}`);
  return data;
}

export async function createPolicy(payload: CreatePolicyPayload): Promise<Policy> {
  const { data } = await axios.post<Policy>(BASE, payload);
  return data;
}

export async function changePolicyStatus(
  id: string,
  targetStatus: PolicyStatus,
): Promise<Policy> {
  const { data } = await axios.patch<Policy>(`${BASE}/${id}/status`, { targetStatus });
  return data;
}
