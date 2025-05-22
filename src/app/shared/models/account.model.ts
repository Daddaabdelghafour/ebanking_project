import { Client } from './client.model';
import { Card } from './card.model';

export interface Account {
  id: string;
  client?: Client;       // Objet client complet (facultatif)
  clientId: string;      // ID du client
  accountNumber: string;
  type: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  openedDate: string;
  lastTransactionDate: string;
  iban: string;
  rib: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  isPrimary?: boolean;
  interestRate?: number;
  createdAt: string;
  updatedAt?: string;
  accountBankNumber?: AccountBankNumber;
  cards?: Card[];
}

export interface AccountBankNumber {
  bankCode: string;
  branchCode: string;
  accountNumber: string;
  checkDigits: string;
}

export interface AccountDetails extends Account {
  transactions: AccountTransaction[];
  pendingTransfers: number;
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  reference: string;
  date: string;
  balanceAfterTransaction: number;
  description: string;
  category: string;
  beneficiary?: string;
  metadata?: Record<string, any>;
}

export interface AccountFormData {
  type: string;
  currency: string;
  initialDeposit?: number;
}

// Types pour validation
export type AccountType = 'current' | 'savings' | 'investment' | 'fixed' | 'other';
export type AccountStatus = 'active' | 'inactive' | 'blocked' | 'closed';
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'payment' | 'refund' | 'fee' | 'interest';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type TransactionCategory = 'income' | 'expense' | 'transfer' | 'withdrawal' | 'utilities' | 'shopping' | 'dining' | 'transportation' | 'entertainment' | 'healthcare' | 'education' | 'other';