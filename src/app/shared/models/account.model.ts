export interface Account {
  id: string;
  clientId: string;
  accountNumber: string;
  type: 'current' | 'savings' | 'investment' | 'fixed' | 'other';
  balance: number;
  availableBalance?: number; // Ajout de cette propriété optionnelle
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
  availableBalance?: number;
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

export interface Card {
  id: string;
  accountId: string;
  type: 'debit' | 'credit' | 'prepaid' | 'virtual';
  network: 'visa' | 'mastercard' | 'amex' | 'other';
  cardholderName: string;
  maskedNumber: string;
  expiryMonth: string;
  expiryYear: string;
  status: 'active' | 'inactive' | 'blocked' | 'expired';
  isContactless?: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  onlinePaymentEnabled?: boolean;
  internationalPaymentEnabled?: boolean;
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