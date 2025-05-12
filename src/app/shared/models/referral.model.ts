export interface Referral {
  id: string;
  referrerId: string;           // ID de l'utilisateur qui parraine
  referredId?: string;          // ID de l'utilisateur parrainé (optionnel si pas encore inscrit)
  campaignId: string;           // ID de la campagne de parrainage
  bonusAmount: number;
  currency: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  code: string;                 // Code de parrainage unique généré pour l'utilisateur
  expiresAt?: Date;             // Date d'expiration du code de parrainage
  completedAt?: Date;           // Date à laquelle le parrainage a été validé
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReferralCampaign {
  id: string;
  name: string;
  description: string;
  bonusAmount: number;          // Montant de la récompense
  bonusCurrency: string;        // Devise de la récompense
  startDate: Date;              // Date de début de la campagne
  endDate?: Date;               // Date de fin de la campagne (optionnelle si pas de fin prévue)
  maxReferrals?: number;        // Nombre maximum de parrainages par utilisateur
  isActive: boolean;            // Si la campagne est active
  termsConditions?: string;     // Conditions de la campagne
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReferralStats {
  totalReferrals: number;       // Nombre total de parrainages
  completedReferrals: number;   // Nombre de parrainages complétés
  pendingReferrals: number;     // Nombre de parrainages en attente
  totalBonusEarned: number;     // Montant total gagné
  bonusCurrency: string;        // Devise des bonus
}

export interface ReferralFormData {
  email: string;                // Email de la personne à parrainer
  message?: string;             // Message personnalisé à envoyer
  campaignId?: string;          // ID de la campagne (si plusieurs disponibles)
}