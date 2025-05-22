import { User as FirebaseUser } from '@angular/fire/auth';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  requiresVerification?: boolean;
  sessionId?: string;
}

export interface VerificationRequest {
  sessionId: string;
  verificationCode: string;
}

// Interface Utilisateur de l'application
export interface User {
  id: string;           // uid de Firebase
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'client' | 'agent' | 'admin';
  language: string;
  gdprConsent: boolean;
  gdprConsentDate?: Date;
  isActive: boolean;
  identityType?: string;
  identityNumber?: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'email' | 'app';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
}

// Mapper entre FirebaseUser et User de l'application
export function mapFirebaseUser(firebaseUser: FirebaseUser, userData: any): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    phone: userData?.phone || '',
    role: userData?.role || 'client',
    language: userData?.language || 'fr',
    gdprConsent: userData?.gdprConsent || false,
    gdprConsentDate: userData?.gdprConsentDate ? new Date(userData.gdprConsentDate) : undefined,
    isActive: firebaseUser.emailVerified,
    identityType: userData?.identityType,
    identityNumber: userData?.identityNumber,
    twoFactorEnabled: userData?.twoFactorEnabled || false,
    twoFactorMethod: userData?.twoFactorMethod || 'sms',
    lastLogin: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime) : undefined,
    createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
    updatedAt: userData?.updatedAt ? new Date(userData.updatedAt) : undefined,
    createdBy: userData?.createdBy
  };
}

export interface ClientSignupRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  identityType: 'CIN' | 'Passport' | 'Residence Card';
  identityNumber: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  language?: string;
  gdprConsent: boolean;
  accountType?: 'personal' | 'business' | 'premium';
}

export interface AgentSignupRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  employeeId: string;
  branch: string;
  role: string;
  language?: string;
  gdprConsent: boolean;
}

// Mise à jour de l'état d'authentification pour Firebase
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  role: 'client' | 'agent' | 'admin' | null;
  requiresVerification: boolean;
  sessionId: string | null;
  firebaseUser: FirebaseUser | null; // Ajout de l'utilisateur Firebase
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSettings {
  enabled: boolean;
  method: 'sms' | 'email' | 'app';
  phone?: string;
  email?: string;
}