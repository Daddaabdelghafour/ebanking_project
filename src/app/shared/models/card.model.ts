export interface Card {
  id: string;
  accountId: string;
  type: string;
  network: string;
  cardholderName: string;
  maskedNumber: string;
  expiryMonth: string;
  expiryYear: string;
  status: string;
  isContactless: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  onlinePaymentEnabled: boolean;
  internationalPaymentEnabled: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface CardRequest {
  id: string;
  accountId: string;
  type: string;
  cardholderName?: string;
  requestDate: string | Date;
  status: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// Types pour validation
export type CardType = 'debit' | 'credit' | 'prepaid' | 'virtual';
export type CardNetwork = 'visa' | 'mastercard' | 'amex';
export type CardStatus = 'active' | 'inactive' | 'blocked' | 'expired';