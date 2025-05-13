export interface Recharge {
  id: string;
  providerId: string;
  providerName?: string;
  recipientIdentifier: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  accountId: string;
  currency: string;  // Ajout de cette propriété
  createdAt: Date;
  completedAt?: Date;
  transactionReference?: string;
  reference: string;  // Ajout de cette propriété

}

export interface RechargeProvider {
  id: string;
  name: string;
  type: 'mobile' | 'streaming' | 'other';
  logoUrl?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface RechargeFormData {
  providerId: string;
  recipientIdentifier: string;
  amount: number;
  accountId: string;
}