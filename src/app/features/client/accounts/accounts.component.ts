import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

interface Account {
  id: string;
  accountNumber: string;
  type: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  openedDate: string;
  lastTransactionDate: string | null;
  iban: string;
  dailyLimit?: number;
  interestRate?: number;
}

interface AccountRequest {
  type: 'current' | 'savings' | 'investment' | 'fixed' | 'other';
  currency: string;
  initialDeposit: number;
  reason?: string;
}

interface TransferRequest {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description: string;
}

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {
  // Client ID fixé pour le développement (à remplacer par l'authentification)
  clientId: string = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';
  
  // Données d'affichage
  accounts: Account[] = [];
  totalBalance: number = 0;
  isLoading: boolean = true;
  selectedCurrency: string = 'EUR'; // Par défaut en EUR selon l'API
  
  // État des erreurs
  errorMessage: string = '';
  
  // Demande de nouveau compte
  showNewAccountForm: boolean = false;
  newAccountData: AccountRequest = {
    type: 'current',
    currency: 'EUR',
    initialDeposit: 0,
    reason: ''
  };
  
  // Transfert rapide
  showQuickTransferForm: boolean = false;
  quickTransfer: TransferRequest = {
    sourceAccountId: '',
    destinationAccountId: '',
    amount: 0,
    description: ''
  };
  
  // État des actions
  isCreatingAccount: boolean = false;
  isTransferring: boolean = false;
  transferSuccess: boolean = false;
  accountRequestSuccess: boolean = false;

  private apiUrl = 'http://localhost:8085/E-BANKING1/api';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  /**
   * Charge les comptes directement via l'API
   */
  loadAccounts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<any>(`${this.apiUrl}/clients/${this.clientId}`)
      .pipe(
        tap((response: any) => {
          // Si la réponse est un tableau, prendre le premier élément
          const client = Array.isArray(response) ? response[0] : response;
          
          // Récupérer les comptes
          if (client && client.accounts && Array.isArray(client.accounts)) {
            this.accounts = client.accounts.map((account: any) => {
              // Si le solde disponible n'est pas défini, on le calcule
              if (account.availableBalance === undefined) {
                account.availableBalance = account.balance;
              }
              return account;
            });
            
            this.calculateTotalBalance();
            
            // Préselectionner le compte source par défaut s'il existe des comptes
            if (this.accounts.length > 0) {
              this.quickTransfer.sourceAccountId = this.accounts[0].id;
            }
          } else {
            this.accounts = [];
          }
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des comptes:', error);
          this.errorMessage = 'Impossible de charger vos comptes. Veuillez réessayer plus tard.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  calculateTotalBalance(): void {
    // Pour une application réelle, il faudrait gérer les conversions de devises
    this.totalBalance = this.accounts.reduce((total, account) => {
      if (account.currency === this.selectedCurrency) {
        return total + account.balance;
      }
      // Simulation simple de conversion - à remplacer par un service de conversion réel
      const conversionRates: Record<string, number> = {
        'MAD': 0.093,
        'EUR': 1,
        'USD': 0.93,
        'GBP': 1.17
      };
      
      const rate = conversionRates[account.currency] / conversionRates[this.selectedCurrency];
      return total + (account.balance * rate);
    }, 0);
  }
  
  toggleNewAccountForm(): void {
    this.showNewAccountForm = !this.showNewAccountForm;
    this.accountRequestSuccess = false;
    if (!this.showNewAccountForm) {
      // Réinitialiser le formulaire quand on le ferme
      this.newAccountData = {
        type: 'current',
        currency: 'EUR',
        initialDeposit: 0,
        reason: ''
      };
    }
    this.errorMessage = '';
  }
  
  toggleQuickTransferForm(): void {
    this.showQuickTransferForm = !this.showQuickTransferForm;
    this.transferSuccess = false;
    if (!this.showQuickTransferForm) {
      // Réinitialiser le formulaire quand on le ferme
      this.quickTransfer = {
        sourceAccountId: this.accounts.length > 0 ? this.accounts[0].id : '',
        destinationAccountId: '',
        amount: 0,
        description: ''
      };
    }
    this.errorMessage = '';
  }
  
  /**
   * Envoie une demande d'ouverture de compte au lieu de créer directement
   */
  requestNewAccount(): void {
    if (this.isCreatingAccount) return;
    
    this.isCreatingAccount = true;
    this.errorMessage = '';
    
    // Remplacer par un appel à l'API pour enregistrer la demande
    this.http.post(`${this.apiUrl}/account-requests`, {
      clientId: this.clientId,
      accountType: this.newAccountData.type,
      currency: this.newAccountData.currency,
      initialDeposit: this.newAccountData.initialDeposit,
      reason: this.newAccountData.reason,
      status: 'pending'
    }).pipe(
      tap(() => {
        this.accountRequestSuccess = true;
        
        // Après 3 secondes, fermer le formulaire
        setTimeout(() => {
          this.toggleNewAccountForm();
        }, 3000);
      }),
      catchError(error => {
        console.error('Erreur lors de la demande de compte', error);
        this.errorMessage = "Votre demande n'a pas pu être envoyée. Veuillez réessayer.";
        
        // Simuler un succès pour les besoins de la démo (à supprimer en production)
        this.accountRequestSuccess = true;
        setTimeout(() => {
          this.toggleNewAccountForm();
        }, 3000);
        
        return of(null);
      }),
      finalize(() => {
        this.isCreatingAccount = false;
      })
    ).subscribe();
  }
  
  /**
   * Effectue un transfert entre comptes directement via l'API
   */
  performQuickTransfer(): void {
    if (this.isTransferring) return;
    
    // Vérifications de base
    if (
      this.quickTransfer.sourceAccountId === this.quickTransfer.destinationAccountId ||
      this.quickTransfer.amount <= 0 ||
      !this.quickTransfer.sourceAccountId ||
      !this.quickTransfer.destinationAccountId
    ) {
      this.errorMessage = "Veuillez vérifier les informations de transfert";
      return;
    }
    
    const sourceAccount = this.accounts.find(a => a.id === this.quickTransfer.sourceAccountId);
    if (sourceAccount && sourceAccount.balance < this.quickTransfer.amount) {
      this.errorMessage = "Solde insuffisant pour effectuer ce transfert";
      return;
    }
    
    this.isTransferring = true;
    this.errorMessage = '';
    
    // Appel direct à l'API pour le transfert
    this.http.post(`${this.apiUrl}/transfers`, {
      sourceAccountId: this.quickTransfer.sourceAccountId,
      destinationAccountId: this.quickTransfer.destinationAccountId,
      amount: this.quickTransfer.amount,
      description: this.quickTransfer.description || 'Transfert entre comptes'
    }).pipe(
      tap((result: any) => {
        // Rafraîchir les données des comptes après le transfert
        this.loadAccounts();
        this.transferSuccess = true;
        
        // Réinitialiser le formulaire après 3 secondes
        setTimeout(() => {
          this.transferSuccess = false;
          this.toggleQuickTransferForm();
        }, 3000);
      }),
      catchError(error => {
        console.error('Erreur lors du transfert', error);
        this.errorMessage = "Impossible d'effectuer le transfert. Veuillez réessayer.";
        
        // Pour la démo uniquement - simuler un transfert réussi (à supprimer en production)
        this.transferSuccess = true;
        this.loadAccounts();
        setTimeout(() => {
          this.toggleQuickTransferForm();
        }, 3000);
        
        return of(null);
      }),
      finalize(() => {
        this.isTransferring = false;
      })
    ).subscribe();
  }
  
  getAccountTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'current': 'Compte courant',
      'savings': 'Compte épargne',
      'investment': 'Compte d\'investissement',
      'fixed': 'Dépôt à terme',
      'other': 'Autre'
    };
    return types[type] || type;
  }
  
  getAccountStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  getAccountTypeIcon(type: string): string {
    switch (type) {
      case 'current': return 'fa-solid fa-wallet';
      case 'savings': return 'fa-solid fa-piggy-bank';
      case 'investment': return 'fa-solid fa-chart-line';
      case 'fixed': return 'fa-solid fa-lock';
      default: return 'fa-solid fa-credit-card';
    }
  }
  
  formatDate(date: Date | string | undefined | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
  
  formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: currency || 'EUR',
      minimumFractionDigits: 2
    }).format(value || 0);
  }
  
  changeCurrency(currency: string): void {
    this.selectedCurrency = currency;
    this.calculateTotalBalance();
  }
  
  downloadAccountDetails(accountId: string): void {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) return;
    
    this.errorMessage = '';
    
    // Dates pour le relevé (dernier mois)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Appel direct pour télécharger le relevé
    window.open(`${this.apiUrl}/accounts/${accountId}/statements?from=${startDateStr}&to=${endDate}&format=pdf`, '_blank');
  }
}