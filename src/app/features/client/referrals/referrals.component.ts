import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReferralService } from '../../../services/referral/referral.service';
import { Referral, ReferralCampaign, ReferralStats } from '../../../shared/models/referral.model';

@Component({
  selector: 'app-referrals',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './referrals.component.html',
  styleUrls: ['./referrals.component.css']
})
export class ReferralsComponent implements OnInit {
  // En l'absence d'authentification, on utilise un ID client fixe pour les tests
  userId: string = 'client1';
  referrals: Referral[] = [];
  stats: ReferralStats | null = null;
  activeCampaigns: ReferralCampaign[] = [];
  
  inviteEmail: string = '';
  inviteMessage: string = '';
  selectedCampaignId: string = '';
  
  currentReferralCode: string = '';
  isCopied: boolean = false;
  isLoading: boolean = true;
  showForm: boolean = false;
  
  constructor(
    private referralService: ReferralService
  ) {}

  ngOnInit(): void {
    // Utiliser directement l'ID fixe en attendant l'implémentation de l'authentification
    this.loadReferralsData();
  }

  loadReferralsData(): void {
    this.isLoading = true;
    
    // Charger les parrainages
    this.referralService.getUserReferrals(this.userId).subscribe(referrals => {
      this.referrals = referrals;
      
      // Charger les statistiques
      this.referralService.getUserReferralStats(this.userId).subscribe(stats => {
        this.stats = stats;
        
        // Charger les campagnes actives
        this.referralService.getActiveCampaigns().subscribe(campaigns => {
          this.activeCampaigns = campaigns;
          
          if (campaigns.length > 0) {
            this.selectedCampaignId = campaigns[0].id;
          }
          
          // Vérifier si l'utilisateur a déjà un code actif
          const pendingReferral = this.referrals.find(ref => ref.status === 'pending');
          if (pendingReferral) {
            this.currentReferralCode = pendingReferral.code;
          }
          
          this.isLoading = false;
        });
      });
    });
  }

  // Ajouter cette méthode à votre classe ReferralsComponent

getCampaignDescription(campaignId: string): string {
  const campaign = this.activeCampaigns.find(c => c.id === campaignId);
  return campaign ? campaign.description : '';
}


  createReferralCode(): void {
    if (!this.selectedCampaignId) return;
    
    this.isLoading = true;
    this.referralService.createReferral(this.userId, this.selectedCampaignId).subscribe(referral => {
      this.currentReferralCode = referral.code;
      this.referrals.push(referral);
      this.isLoading = false;
    });
  }

  sendInvitation(): void {
    if (!this.inviteEmail || !this.currentReferralCode) return;
    
    this.isLoading = true;
    this.referralService.sendReferralInvitation({
      email: this.inviteEmail,
      message: this.inviteMessage,
      referralCode: this.currentReferralCode
    }).subscribe(success => {
      if (success) {
        this.inviteEmail = '';
        this.inviteMessage = '';
        this.showForm = false;
      }
      this.isLoading = false;
    });
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.currentReferralCode).then(() => {
      this.isCopied = true;
      setTimeout(() => this.isCopied = false, 3000);
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  getReferralStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'completed': return 'Complété';
      case 'expired': return 'Expiré';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}