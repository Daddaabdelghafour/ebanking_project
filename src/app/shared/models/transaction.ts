export interface Transaction {
  id: string;
  accountId: string;
  name: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'transfer' | 'refund' | 'other';
  date: Date;
  category: 'software' | 'transfer' | 'finance' | 'shopping' | 'utilities' | 'entertainment' | 'food' | 'housing' | 'other';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  icon?: string;
  description?: string;
  recipientName?: string;
  recipientAccountId?: string;
  merchantName?: string;
  merchantCategory?: string;
  balanceAfterTransaction?: number;
  reference?: string;
  tags?: string[];
}

export interface TransactionSummary {
  totalIncoming: number;
  totalOutgoing: number;
  netChange: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  categorySummary: CategorySummary[];
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
}






















