export interface Transfer {
  id: string;
  senderAccountId: string;
  senderAccountNumber?: string;
  recipientAccountId?: string;
  recipientAccountNumber: string;
  recipientName: string;
  recipientBankCode?: string;
  amount: number;
  currency: string;
  reason?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  scheduledDate?: Date;
  executedDate?: Date;
  createdAt: Date;
  transactionFees?: number;
  reference: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  type: 'domestic' | 'international' | 'internal';
}

export interface TransferFormData {
  senderAccountId: string;
  recipientAccountNumber: string;
  recipientName: string;
  recipientBankCode?: string;
  amount: number;
  currency: string;
  reason?: string;
  scheduledDate?: Date;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  type: 'domestic' | 'international' | 'internal';
}