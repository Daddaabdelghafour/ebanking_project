import { Card } from "./card.model";
export interface Account {
  id: string;
  clientId: string;
  accountNumber: string;
  type: 'current' | 'savings' | 'investment' | 'fixed' | 'other';
  balance: number;
  availableBalance?: number;
  currency: string;
  status: 'active' | 'inactive' | 'blocked' | 'pending';
  openedDate: Date;
  lastTransactionDate?: Date;
  iban?: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  isPrimary?: boolean;
  interestRate?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AccountDetails extends Account {
  transactions?: AccountTransaction[];
  cards?: Card[];
  pendingTransfers?: number;
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  reference: string;
  date: Date;
  balanceAfterTransaction: number;
  description?: string;
  category?: string;
}

export interface AccountBankNumber {
  id: string;
  accountId: string;
  countryCode: string;
  checkCode: string;
  bankCode: string;
  cityCode: string;
  accountNumber: string;
  ribKey: string;
}

export interface AccountFormData {
  type: 'current' | 'savings' | 'investment' | 'fixed' | 'other';
  currency: string;
  initialDeposit?: number;
}