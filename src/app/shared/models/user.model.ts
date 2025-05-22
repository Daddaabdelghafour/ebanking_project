import { Client } from './client.model';
import { PaymentMethod } from './payment-method.model';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: string; // client, agent, admin
  firstName: string;
  lastName: string;
  fullName?: string; // Computed property
  phoneNumber: string;
  language: string;
  gdprConsent: boolean;
  gdprConsentDate: string; // ISO date string
  stripeConnectId: string;
  isActive: boolean;
  identityType: string;
  identityNumber: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: string;
  lastLogin: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string;
  clients?: Client[];
  agents?: any[]; // Replace with `Agent` interface if available
  notifications?: any[]; // Replace with `Notification` interface if available
  paymentMethods?: PaymentMethod[];
  documents?: any[]; // Replace with `Document` interface if available
}

// Création d'une interface UserDTO pour les réponses API
export interface UserDTO {
  id: string;
  email: string;
  passwordHash?: string; // Optionnel pour la sécurité
  role: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  language: string;
  gdprConsent: boolean;
  gdprConsentDate: string;
  isActive: boolean;
  identityType: string;
  identityNumber: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}