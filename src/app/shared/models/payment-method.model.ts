export interface PaymentMethod {
  id: string;
  userId: string;
  type: string;
  provider: string;
  accountNumber?: string;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  holderName?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}