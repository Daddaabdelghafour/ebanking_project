export interface Account {
  id: string;
  accountNumber: string;
  type: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive' | 'blocked' | 'pending';
  openedDate: Date;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  clientId: string;
  address: string;
  city: string;
  status: 'active' | 'inactive' | 'blocked' | 'pending';
  accountType: string;
  balance: number;
  currency: string;
  imageUrl?: string;
  dateJoined: Date;
  lastLogin?: Date;
  identityNumber: string;
  identityType: 'CIN' | 'Passport' | 'Residence Card';
  birthDate: Date;
  occupation?: string;
  income?: number;
  // Added these properties to fix the errors
  contactPreference?: string;
  accounts?: Account[];
}

export interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: 'active' | 'inactive' | 'blocked' | 'pending';
  accountType: string;
  currency: string;
  identityNumber: string;
  identityType: 'CIN' | 'Passport' | 'Residence Card';
  birthDate?: Date;
  occupation?: string;
  income?: number;
  password?: string;
  confirmPassword?: string;
}