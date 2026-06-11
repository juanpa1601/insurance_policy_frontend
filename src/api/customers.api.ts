import axios from 'axios';
import type { Customer, CreateCustomerPayload } from '../types';

const BASE = '/api/customers';

export async function getAllCustomers(): Promise<Customer[]> {
  const { data } = await axios.get<Customer[]>(BASE);
  return data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await axios.get<Customer>(`${BASE}/${id}`);
  return data;
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  const { data } = await axios.post<Customer>(BASE, payload);
  return data;
}
