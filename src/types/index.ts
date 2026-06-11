export type Branch = 'AUTO' | 'LIFE' | 'HOME' | 'HEALTH' | 'TRAVEL';
export type PolicyStatus = 'QUOTED' | 'ISSUED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type RatingStrategyType = 'STANDARD' | 'RISK_BASED' | 'LOYALTY';

export interface Customer {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskProfile {
  riskScore?: number;
  customerSince?: number;
}

export interface Policy {
  id: string;
  policyNumber: string;
  customerId: string;
  customer?: Customer;
  branch: Branch;
  status: PolicyStatus;
  ratingStrategy: RatingStrategyType;
  monthlyPremium: number;
  coverage: {
    coverageAmount?: number;
    amount?: number;
    termMonths?: number;
    deductible?: number;
  };
  riskProfile: RiskProfile;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerPayload {
  name: string;
  email: string;
}

export interface CreatePolicyPayload {
  customerId: string;
  branch: Branch;
  ratingStrategy: RatingStrategyType;
  riskProfile: RiskProfile;
}

export interface ChangePolicyStatusPayload {
  targetStatus: PolicyStatus;
}
