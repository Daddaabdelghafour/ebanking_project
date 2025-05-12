export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rate: number;
  isActive: boolean;
  lastUpdated?: Date;
}