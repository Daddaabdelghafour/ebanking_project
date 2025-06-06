import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BillService } from '../../../services/bill/bill.service';
import { AccountService } from '../../../services/account/account.service';
import { Recharge, RechargeProvider, RechargeFormData } from '../../../shared/models/recharge.model';
import { Account } from '../../../shared/models/account.model';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-recharges',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './recharges.component.html',
  styleUrls: ['./recharges.component.css']
})
export class RechargesComponent implements OnInit {
  // ID client fixe pour les tests
  clientId: string = 'client1';
  accountId: string = 'acc1';
  
  // Providers et recharges
  mobileProviders: RechargeProvider[] = [];
  streamingProviders: RechargeProvider[] = [];
  rechargeHistory: Recharge[] = [];
  
  // État du chargement
  isLoading: boolean = true;
  isProcessing: boolean = false;
  
  // Pour effectuer une recharge
  selectedService: 'mobile' | 'streaming' = 'mobile';
  selectedProvider: string = '';
  recipientIdentifier: string = '';
  amount: number = 0;
  accounts: Account[] = [];
  selectedAccountId: string = '';
  
  // Montants prédéfinis pour les recharges mobiles
  predefinedAmounts: number[] = [10, 20, 30, 50, 100, 200];
  
  // État de succès
  rechargeSuccess: boolean = false;
  lastRecharge: Recharge | null = null;
  
  constructor(
    private billService: BillService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    // Utiliser forkJoin pour charger les données en parallèle
    forkJoin({
      //accounts: this.accountService.getClientAccounts(this.clientId),
      mobileProviders: this.billService.getRechargeProviders('mobile'),
      streamingProviders: this.billService.getRechargeProviders('streaming'),
      recharges: this.billService.getClientRecharges(this.accountId)
    })
    .pipe(
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (results) => {
        // Traiter les comptes
        //this.accounts = results.accounts;
        if (this.accounts.length > 0) {
          this.selectedAccountId = this.accounts[0].id;
        }
        
        // Traiter les fournisseurs mobiles
        this.mobileProviders = results.mobileProviders.map(provider => ({
          ...provider,
          type: 'mobile'
        }));
        if (this.mobileProviders.length > 0) {
          this.selectedProvider = this.mobileProviders[0].id;
        }
        
        // Traiter les fournisseurs de streaming
        this.streamingProviders = results.streamingProviders.map(provider => ({
          ...provider,
          type: 'streaming'
        }));
        
        // Traiter l'historique des recharges
        this.rechargeHistory = results.recharges.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        // Vous pourriez ajouter un message d'erreur à afficher à l'utilisateur
      }
    });
  }

  selectAmount(amount: number): void {
    this.amount = amount;
  }

  selectService(service: 'mobile' | 'streaming'): void {
    this.selectedService = service;
    
    // Réinitialiser le fournisseur sélectionné
    if (service === 'mobile' && this.mobileProviders.length > 0) {
      this.selectedProvider = this.mobileProviders[0].id;
    } else if (service === 'streaming' && this.streamingProviders.length > 0) {
      this.selectedProvider = this.streamingProviders[0].id;
    } else {
      this.selectedProvider = '';
    }
    
    this.recipientIdentifier = '';
    this.amount = 0;
  }

  performRecharge(): void {
    if (!this.validateRechargeForm()) {
      return;
    }
    
    const rechargeData: RechargeFormData = {
      providerId: this.selectedProvider,
      recipientIdentifier: this.recipientIdentifier,
      amount: this.amount,
      accountId: this.selectedAccountId
    };
    
    this.isProcessing = true;
    this.billService.performRecharge(rechargeData).subscribe({
      next: (recharge) => {
        this.isProcessing = false;
        this.rechargeSuccess = true;
        this.lastRecharge = recharge;
        
        // Ajouter la recharge à l'historique
        this.rechargeHistory = [recharge, ...this.rechargeHistory];
        
        // Réinitialiser le formulaire
        this.recipientIdentifier = '';
        this.amount = 0;
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('Erreur lors de la recharge:', err);
        // Gérer l'erreur (afficher un message, etc.)
      }
    });
  }

  validateRechargeForm(): boolean {
    if (this.selectedService === 'mobile') {
      // Pour les recharges mobiles, vérifier le numéro de téléphone
      const phoneRegex = /^0[567]\d{8}$/;  // Format marocain pour mobile
      return (
        !!this.selectedProvider &&
        phoneRegex.test(this.recipientIdentifier) &&
        this.amount > 0 &&
        !!this.selectedAccountId
      );
    } else {
      // Pour les abonnements streaming, le format d'identifiant peut varier
      return (
        !!this.selectedProvider &&
        this.recipientIdentifier.length > 3 &&
        this.amount > 0 &&
        !!this.selectedAccountId
      );
    }
  }

  closeSuccessMessage(): void {
    this.rechargeSuccess = false;
    this.lastRecharge = null;
  }

  getProviderName(providerId: string): string {
    const allProviders = [...this.mobileProviders, ...this.streamingProviders];
    const provider = allProviders.find(p => p.id === providerId);
    return provider ? provider.name : 'Inconnu';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Complété';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      default: return status;
    }
  }
}