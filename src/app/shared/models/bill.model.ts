export interface Bill {
  id: string;
  clientId: string;
  providerId: string;
  providerName: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  isPaid: boolean;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'scheduled';
  paidAmount: number;
  paidDate?: Date;
  createdAt: Date;
  notificationEnabled: boolean;
  billCategory: string;
  logo?: string;
}

export interface BillPayment {
  id: string;
  billId: string;
  accountId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  transactionId?: string;
  createdAt: Date;
}

export interface RechargeProvider {
  id: string;
  name: string;
  serviceType: 'mobile' | 'internet' | 'tv' | 'gaming' | 'streaming';
  logoUrl: string;
  isActive: boolean;
  feePercentage?: number;
  fixedFee?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Recharge {
  id: string;
  accountId: string;
  providerId: string;
  providerName?: string;
  recipientIdentifier: string;  // numéro de téléphone, compte, etc.
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: Date;
  executedAt?: Date;
  reference: string;
}

export interface BillFormData {
  providerId: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  accountId: string;
  notificationEnabled: boolean;
  billCategory: string;
}

export interface RechargeFormData {
  providerId: string;
  recipientIdentifier: string;
  amount: number;
  accountId: string;
}