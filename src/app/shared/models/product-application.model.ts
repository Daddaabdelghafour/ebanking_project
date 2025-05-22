export interface ProductApplication {
  id: string;
  clientId: string;
  productType: string;
  status: string;
  applicationDate: string;
  decisionDate?: string;
  decision?: string;
  decisionReason?: string;
  createdAt: string;
  updatedAt?: string;
}