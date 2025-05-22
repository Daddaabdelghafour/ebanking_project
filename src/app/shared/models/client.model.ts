import { User } from './user.model';
import { Account } from './account.model';
import { ProductApplication } from './product-application.model';

export interface Client {
  id: string;
  user?: User;             // Optional pour la compatibilité avec les réponses API partielles
  userId?: string;         // Pour les cas où seul l'ID est fourni sans l'objet complet
  firstName: string;
  lastName: string;
  phone: string;
  phoneNumber?: string;    // Ajouté pour la compatibilité avec l'API
  email?: string;          // Ajouté pour la compatibilité
  clientId: string;
  identityNumber: string;
  identityType?: string;   // Ajouté pour la compatibilité
  address: string;
  city: string;
  postalCode: string;
  country: string;
  status: string;          // active, inactive, blocked, pending
  accountType: string;     // personal, business, premium
  imageUrl?: string;       // Optional car peut être absent
  dateJoined: string | Date; // Compatible avec ISO string ou Date
  verificationDate?: string | Date; // Optional et flexible
  otpSecret?: string;      // Optional pour la sécurité
  createdAt: string | Date;
  updatedAt: string | Date;
  language: string;
  profilePicture?: string;

  
  // Propriétés additionnelles pour la compatibilité avec le composant client-page
  balance?: number;        // Solde total agrégé
  currency?: string;       // Devise principale
  lastLogin?: string | Date; // Date de dernière connexion
  birthDate?: string | Date; // Date de naissance
  occupation?: string;     // Profession
  income?: number;         // Revenu
  contactPreference?: string; // Préférence de contact
  gdprConsent?: boolean;
  gdprConsentDate?: string | Date; // Date du consentement RGPD
  
  // Propriétés additionnelles de l'API utilisateur
  isActive?: boolean;      // État d'activation du compte
  role?: string;           // Rôle de l'utilisateur (CLIENT, ADMIN, etc.)
  twoFactorEnabled?: boolean; // Si l'authentification à deux facteurs est activée
  twoFactorMethod?: string;   // Méthode d'authentification à deux facteurs
  stripeConnectId?: string;   // ID de connexion Stripe
  
  // Relations
  accounts?: Account[];
  beneficiaries?: any[];   // Sera remplacé par `Beneficiary` interface si disponible
  alertSettings?: any[];   // Sera remplacé par `AlertSetting` interface si disponible
  productApplications?: ProductApplication[];
}

// Interface simplifiée pour les formulaires
// Mise à jour de l'interface ClientFormData
export interface ClientFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  clientId?: string;
  identityNumber: string;
  identityType?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  accountType?: string;
  birthDate?: string | Date;
  occupation?: string;
  income?: number;
  contactPreference?: string;
  currency?: string;
  status: string;

  // Nouveaux champs pour l'API utilisateur
  language?: string;
  password?: string;
  gdprConsent?: boolean;
}

// Interface pour les fins d'affichage
export interface DisplayClient {
  id: string;
  fullName: string;
  clientId: string;
  email: string;
  phone: string;
  status: string;
  accountType: string;
  balance: number;
  currency: string;
  dateJoined: Date;
  lastLogin?: Date;
}