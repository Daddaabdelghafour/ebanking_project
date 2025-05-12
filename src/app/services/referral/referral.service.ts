import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Referral, ReferralCampaign, ReferralStats } from '../../shared/models/referral.model';

@Injectable({
  providedIn: 'root'
})
export class ReferralService {
  private apiUrl = `/referrals`;
  
  // MOCK DATA pour le développement
  private mockReferrals: Referral[] = [
    {
      id: 'ref1',
      referrerId: 'client1',
      referredId: 'client5',
      campaignId: 'camp1',
      bonusAmount: 100,
      currency: 'MAD',
      status: 'completed',
      code: 'REF100',
      completedAt: new Date('2023-04-15'),
      createdAt: new Date('2023-04-01')
    },
    {
      id: 'ref2',
      referrerId: 'client1',
      campaignId: 'camp1',
      bonusAmount: 100,
      currency: 'MAD',
      status: 'pending',
      code: 'REF101',
      expiresAt: new Date('2023-06-30'),
      createdAt: new Date('2023-04-20')
    },
    {
      id: 'ref3',
      referrerId: 'client1',
      referredId: 'client8',
      campaignId: 'camp1',
      bonusAmount: 100,
      currency: 'MAD',
      status: 'completed',
      code: 'REF102',
      completedAt: new Date('2023-05-05'),
      createdAt: new Date('2023-04-25')
    }
  ];

  private mockCampaigns: ReferralCampaign[] = [
    {
      id: 'camp1',
      name: 'Programme Parrainage Printemps 2023',
      description: 'Parrainez vos amis et recevez 100 MAD pour chaque nouveau client inscrit.',
      bonusAmount: 100,
      bonusCurrency: 'MAD',
      startDate: new Date('2023-03-01'),
      endDate: new Date('2023-06-30'),
      maxReferrals: 10,
      isActive: true,
      termsConditions: 'Le bonus est crédité après que le parrainé a effectué une transaction.',
      createdAt: new Date('2023-02-15')
    },
    {
      id: 'camp2',
      name: 'Programme Premium',
      description: 'Réservé aux clients premium - Parrainage avec bonus doublé.',
      bonusAmount: 200,
      bonusCurrency: 'MAD',
      startDate: new Date('2023-04-01'),
      endDate: new Date('2023-12-31'),
      maxReferrals: 5,
      isActive: true,
      termsConditions: 'Réservé aux clients avec compte premium.',
      createdAt: new Date('2023-03-15')
    }
  ];

  constructor(private http: HttpClient) { }

  /**
   * Récupère tous les parrainages d'un utilisateur
   */
  getUserReferrals(userId: string): Observable<Referral[]> {
    // En production, remplacer par un appel HTTP
    return of(this.mockReferrals.filter(ref => ref.referrerId === userId))
      .pipe(delay(500));
  }

  /**
   * Récupère les statistiques de parrainage d'un utilisateur
   */
  getUserReferralStats(userId: string): Observable<ReferralStats> {
    // Calculer les statistiques à partir des données mock
    const userReferrals = this.mockReferrals.filter(ref => ref.referrerId === userId);
    const completedRefs = userReferrals.filter(ref => ref.status === 'completed');
    const pendingRefs = userReferrals.filter(ref => ref.status === 'pending');
    
    const totalBonus = completedRefs.reduce((sum, ref) => sum + ref.bonusAmount, 0);
    
    return of({
      totalReferrals: userReferrals.length,
      completedReferrals: completedRefs.length,
      pendingReferrals: pendingRefs.length,
      totalBonusEarned: totalBonus,
      bonusCurrency: 'MAD' // Pourrait varier selon les devises utilisées
    }).pipe(delay(500));
  }

  /**
   * Récupère les campagnes de parrainage actives
   */
  getActiveCampaigns(): Observable<ReferralCampaign[]> {
    const now = new Date();
    return of(this.mockCampaigns.filter(camp => 
      camp.isActive && 
      camp.startDate <= now && 
      (!camp.endDate || camp.endDate >= now)
    )).pipe(delay(500));
  }

  /**
   * Crée un nouveau code de parrainage
   */
  createReferral(userId: string, campaignId: string): Observable<Referral> {
    // Générer un code unique
    const code = 'REF' + Math.floor(Math.random() * 10000);
    
    // Chercher la campagne
    const campaign = this.mockCampaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error('Campagne non trouvée');
    }
    
    const newReferral: Referral = {
      id: 'ref' + new Date().getTime(),
      referrerId: userId,
      campaignId: campaignId,
      bonusAmount: campaign.bonusAmount,
      currency: campaign.bonusCurrency,
      status: 'pending',
      code: code,
      createdAt: new Date(),
      expiresAt: campaign.endDate
    };
    
    // Dans une vraie app, on enverrait à l'API
    this.mockReferrals.push(newReferral);
    
    return of(newReferral).pipe(delay(800));
  }

  /**
   * Envoie une invitation de parrainage par email
   */
  sendReferralInvitation(referralData: { email: string; message?: string; referralCode: string }): Observable<boolean> {
    // Simuler l'envoi d'email
    console.log(`Email d'invitation envoyé à ${referralData.email} avec le code ${referralData.referralCode}`);
    return of(true).pipe(delay(1000));
  }

  /**
   * Valide un code de parrainage lors de l'inscription
   */
  validateReferralCode(code: string): Observable<Referral | null> {
    const referral = this.mockReferrals.find(ref => 
      ref.code === code && 
      ref.status === 'pending' && 
      (!ref.expiresAt || new Date() <= new Date(ref.expiresAt))
    );
    
    return of(referral || null).pipe(delay(500));
  }

  /**
   * Complète un parrainage après l'inscription de l'utilisateur parrainé
   */
  completeReferral(referralId: string, referredUserId: string): Observable<Referral> {
    const index = this.mockReferrals.findIndex(ref => ref.id === referralId);
    if (index === -1) {
      throw new Error('Parrainage non trouvé');
    }
    
    // Mettre à jour le parrainage
    const updatedReferral: Referral = {
      ...this.mockReferrals[index],
      status: 'completed',
      referredId: referredUserId,
      completedAt: new Date(),
      updatedAt: new Date()
    };
    
    this.mockReferrals[index] = updatedReferral;
    
    return of(updatedReferral).pipe(delay(800));
  }
}