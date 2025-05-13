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
  isContactless: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  onlinePaymentEnabled: boolean;
  internationalPaymentEnabled: boolean;
  pinLocked?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CardRequest {
  id: string;
  clientId: string;
  accountId: string;
  type: 'debit' | 'credit' | 'prepaid' | 'virtual';
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
  deliveryAddress?: string;
  createdAt: Date;
  updatedAt?: Date;
}