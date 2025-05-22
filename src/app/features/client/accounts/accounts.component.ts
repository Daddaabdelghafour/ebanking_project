import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../services/account/account.service';
import { ClientService } from '../../../services/client/client.service';
import { Account } from '../../../shared/models/account.model';
import { catchError, finalize, tap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {
  // Client ID from the client service
  clientId: string = '';
  
  // Données d'affichage
  accounts: Account[] = [];
  totalBalance: number = 0;
  isLoading: boolean = true;
  selectedCurrency: string = 'MAD';
  Math = Math; // Pour pouvoir utiliser Math dans le template
  
  // État des erreurs
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Nouveau compte
  showNewAccountForm: boolean = false;
  newAccountData = {
    type: 'current' as 'current' | 'savings' | 'investment' | 'fixed' | 'other',
    currency: 'MAD',
    initialDeposit: 0
  };
  
  // Transfert rapide
  showQuickTransferForm: boolean = false;
  quickTransfer = {
    sourceAccountId: '',
    destinationAccountId: '',
    amount: 0,
    description: ''
  };
  
  // État des actions
  isCreatingAccount: boolean = false;
  isTransferring: boolean = false;
  transferSuccess: boolean = false;

  constructor(
    private accountService: AccountService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.loadCurrentClient();
  }

  /**
   * Charge le client actuel depuis le service client
   */
  loadCurrentClient(): void {
    this.isLoading = true;
    this.hasError = false;
    
    this.clientService.getCurrentClient().pipe(
      tap(client => {
        if (client) {
          this.clientId = client.id;
          this.loadAccountData();
        } else {
          this.setError("Impossible de charger les informations client");
        }
      }),
      catchError(error => {
        console.error('Erreur lors du chargement du client', error);
        this.setError("Erreur lors du chargement du client");
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Définit un message d'erreur et change l'état
   */
  setError(message: string): void {
    this.errorMessage = message;
    this.hasError = true;
    this.isLoading = false;
  }

  /**
   * Réinitialise les erreurs
   */
  closeError(): void {
    this.hasError = false;
    this.errorMessage = '';
  }

  loadAccountData(): void {
    if (!this.clientId) {
      this.setError("ID client non disponible");
      return;
    }

    this.isLoading = true;
    this.accountService.getClientAccounts(this.clientId).pipe(
      tap(accounts => {
        // Calculer le solde disponible pour chaque compte
        this.accounts = accounts.map(account => {
          // Logique simple pour le solde disponible: 
          // Pour les comptes courants, garder une réserve minimum de 200
          // Pour les autres types, tout le solde est disponible
          if (!account.availableBalance) {
            if (account.type === 'current') {
              account.availableBalance = Math.max(0, account.balance - 200);
            } else {
              account.availableBalance = account.balance;
            }
          }
          return account;
        });
        
        this.calculateTotalBalance();
        
        // Préselectionner le compte source par défaut s'il existe des comptes
        if (this.accounts.length > 0) {
          this.quickTransfer.sourceAccountId = this.accounts[0].id;
        }
      }),
      catchError(error => {
        console.error('Erreur lors du chargement des comptes', error);
        this.setError("Impossible de charger vos comptes. Veuillez réessayer plus tard.");
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  calculateTotalBalance(): void {
    // Pour une application réelle, il faudrait gérer les conversions de devises
    this.totalBalance = this.accounts.reduce((total, account) => {
      if (account.currency === this.selectedCurrency) {
        return total + account.balance;
      }
      // Simulation simple de conversion - à remplacer par un service de conversion réel
      const conversionRates: Record<string, number> = {
        'MAD': 1,
        'EUR': 10.8,
        'USD': 10.0,
        'GBP': 12.6
      };
      
      const rate = conversionRates[account.currency] / conversionRates[this.selectedCurrency];
      return total + (account.balance * rate);
    }, 0);
  }
  
  toggleNewAccountForm(): void {
    this.showNewAccountForm = !this.showNewAccountForm;
    if (!this.showNewAccountForm) {
      // Réinitialiser le formulaire quand on le ferme
      this.newAccountData = {
        type: 'current',
        currency: 'MAD',
        initialDeposit: 0
      };
    }
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
    this.closeError();
  }
  
  createNewAccount(): void {
    if (this.isCreatingAccount) return;
    
    this.isCreatingAccount = true;
    this.closeError();
    
    this.accountService.createAccount(
      this.clientId, 
      this.newAccountData
    ).pipe(
      tap(newAccount => {
        // Ajouter le compte à la liste
        this.accounts.push(newAccount);
        this.calculateTotalBalance();
        
        // Réinitialiser le formulaire et le fermer
        this.toggleNewAccountForm();
      }),
      catchError(error => {
        console.error('Erreur lors de la création du compte', error);
        this.setError("Impossible de créer le compte. Veuillez réessayer.");
        return of(null);
      }),
      finalize(() => {
        this.isCreatingAccount = false;
      })
    ).subscribe();
  }
  
  performQuickTransfer(): void {
    if (this.isTransferring) return;
    
    // Vérifications de base
    if (
      this.quickTransfer.sourceAccountId === this.quickTransfer.destinationAccountId ||
      this.quickTransfer.amount <= 0 ||
      !this.quickTransfer.sourceAccountId ||
      !this.quickTransfer.destinationAccountId
    ) {
      this.setError("Veuillez vérifier les informations de transfert");
      return;
    }
    
    const sourceAccount = this.accounts.find(a => a.id === this.quickTransfer.sourceAccountId);
    if (sourceAccount && sourceAccount.balance < this.quickTransfer.amount) {
      this.setError("Solde insuffisant pour effectuer ce transfert");
      return;
    }
    
    this.isTransferring = true;
    this.closeError();
    
    this.accountService.transferBetweenAccounts(
      this.quickTransfer.sourceAccountId,
      this.quickTransfer.destinationAccountId,
      this.quickTransfer.amount,
      this.quickTransfer.description
    ).pipe(
      tap(result => {
        // Mettre à jour les soldes dans notre liste de comptes locale
        const sourceIndex = this.accounts.findIndex(a => a.id === this.quickTransfer.sourceAccountId);
        const destIndex = this.accounts.findIndex(a => a.id === this.quickTransfer.destinationAccountId);
        
        if (sourceIndex >= 0) {
          this.accounts[sourceIndex].balance = result.sourceAccount.balance;
          this.accounts[sourceIndex].lastTransactionDate = result.sourceAccount.lastTransactionDate;
          
          // Mise à jour du solde disponible
          if (this.accounts[sourceIndex].type === 'current') {
            this.accounts[sourceIndex].availableBalance = Math.max(0, result.sourceAccount.balance - 200);
          } else {
            this.accounts[sourceIndex].availableBalance = result.sourceAccount.balance;
          }
        }
        
        if (destIndex >= 0) {
          this.accounts[destIndex].balance = result.destinationAccount.balance;
          this.accounts[destIndex].lastTransactionDate = result.destinationAccount.lastTransactionDate;
          
          // Mise à jour du solde disponible
          if (this.accounts[destIndex].type === 'current') {
            this.accounts[destIndex].availableBalance = Math.max(0, result.destinationAccount.balance - 200);
          } else {
            this.accounts[destIndex].availableBalance = result.destinationAccount.balance;
          }
        }
        
        this.calculateTotalBalance();
        this.transferSuccess = true;
        
        // Réinitialiser le formulaire après 3 secondes
        setTimeout(() => {
          this.transferSuccess = false;
          this.toggleQuickTransferForm();
        }, 3000);
      }),
      catchError(error => {
        console.error('Erreur lors du transfert', error);
        this.setError("Impossible d'effectuer le transfert. Veuillez réessayer.");
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
  
  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
  
  formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: currency || 'MAD',
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
    
    // Dates pour le relevé (dernier mois)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    this.accountService.downloadAccountStatement(
      accountId,
      startDate,
      endDate,
      'pdf'
    ).pipe(
      tap(url => {
        // Ouvrir le PDF dans un nouvel onglet (simulation)
        console.log(`Téléchargement du relevé pour le compte ${account.accountNumber}`);
        window.open(url, '_blank');
      }),
      catchError(error => {
        console.error('Erreur lors du téléchargement du relevé', error);
        this.setError("Impossible de télécharger le relevé de compte");
        return of(null);
      })
    ).subscribe();
  }
}