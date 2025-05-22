import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  client?: any;
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
  clientId: string = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';
  
  accounts: Account[] = [];
  totalBalance: number = 0;
  isLoading: boolean = true;
  selectedCurrency: string = 'MAD';
  errorMessage: string = '';
  
  // Modals
  showAccountDetails: boolean = false;
  showStatements: boolean = false;
  showQuickTransferForm: boolean = false;
  
  // Selected account for details/statements
  selectedAccount: Account | null = null;
  
  // Transfert rapide
  quickTransfer: TransferRequest = {
    sourceAccountId: '',
    destinationAccountId: '',
    amount: 0,
    description: ''
  };
  
  isTransferring: boolean = false;
  transferSuccess: boolean = false;

  private apiUrl = 'http://localhost:8085/E-BANKING1/api';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  /**
   * Charge les comptes via l'endpoint accounts/client/{clientId}/active
   */
  loadAccounts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<Account[]>(`${this.apiUrl}/accounts/client/${this.clientId}/active`)
      .pipe(
        tap((accounts: Account[]) => {
          this.accounts = accounts || [];
          this.calculateTotalBalance();
          
          if (this.accounts.length > 0) {
            this.quickTransfer.sourceAccountId = this.accounts[0].id;
          }
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des comptes:', error);
          this.errorMessage = 'Impossible de charger vos comptes.';
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  /**
   * Affiche les détails d'un compte
   */
  showAccountDetailsModal(accountId: string): void {
    this.http.get<Account>(`${this.apiUrl}/accounts/${accountId}`)
      .pipe(
        tap((account: Account) => {
          this.selectedAccount = account;
          this.showAccountDetails = true;
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des détails:', error);
          this.errorMessage = 'Impossible de charger les détails du compte.';
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Affiche les relevés d'un compte
   */
  showStatementsModal(accountId: string): void {
    const account = this.accounts.find(a => a.id === accountId);
    if (account) {
      this.selectedAccount = account;
      this.showStatements = true;
    }
  }

  /**
   * Télécharge le relevé PDF
   */
  downloadStatement(format: 'pdf' | 'excel' = 'pdf'): void {
    if (!this.selectedAccount) return;
    
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Simuler le téléchargement (remplacer par votre endpoint réel)
    const url = `${this.apiUrl}/accounts/${this.selectedAccount.id}/statements?from=${startDateStr}&to=${endDate}&format=${format}`;
    window.open(url, '_blank');
  }

  /**
   * Ouvre le modal de transfert rapide
   */
  openQuickTransfer(sourceAccountId?: string): void {
    if (sourceAccountId) {
      this.quickTransfer.sourceAccountId = sourceAccountId;
    }
    this.showQuickTransferForm = true;
    this.transferSuccess = false;
    this.errorMessage = '';
  }

  /**
   * Effectue un transfert entre comptes
   */
  performQuickTransfer(): void {
    if (this.isTransferring) return;
    
    // Validations
    if (!this.quickTransfer.sourceAccountId || !this.quickTransfer.destinationAccountId) {
      this.errorMessage = 'Veuillez sélectionner les comptes source et destination.';
      return;
    }
    
    if (this.quickTransfer.sourceAccountId === this.quickTransfer.destinationAccountId) {
      this.errorMessage = 'Le compte source et destination ne peuvent pas être identiques.';
      return;
    }
    
    if (this.quickTransfer.amount <= 0) {
      this.errorMessage = 'Le montant doit être supérieur à zéro.';
      return;
    }
    
    const sourceAccount = this.accounts.find(a => a.id === this.quickTransfer.sourceAccountId);
    if (sourceAccount && sourceAccount.balance < this.quickTransfer.amount) {
      this.errorMessage = 'Solde insuffisant pour effectuer ce transfert.';
      return;
    }
    
    this.isTransferring = true;
    this.errorMessage = '';
    
    // Simuler le transfert (remplacer par votre endpoint réel)
    const transferData = {
      sourceAccountId: this.quickTransfer.sourceAccountId,
      destinationAccountId: this.quickTransfer.destinationAccountId,
      amount: this.quickTransfer.amount,
      description: this.quickTransfer.description || 'Transfert entre comptes',
      type: 'INTERNAL_TRANSFER'
    };
    
    // Pour la simulation, on fait juste un timeout
    setTimeout(() => {
      this.transferSuccess = true;
      this.isTransferring = false;
      
      // Mettre à jour les soldes localement pour la démo
      const sourceAcc = this.accounts.find(a => a.id === this.quickTransfer.sourceAccountId);
      const destAcc = this.accounts.find(a => a.id === this.quickTransfer.destinationAccountId);
      
      if (sourceAcc && destAcc) {
        sourceAcc.balance -= this.quickTransfer.amount;
        destAcc.balance += this.quickTransfer.amount;
        this.calculateTotalBalance();
      }
      
      // Auto-fermer après 3 secondes
      setTimeout(() => {
        this.closeQuickTransfer();
      }, 3000);
    }, 1500);

    // Code pour un vrai appel API (décommenter quand prêt) :
    /*
    this.http.post(`${this.apiUrl}/transfers`, transferData, this.httpOptions)
      .pipe(
        tap(() => {
          this.transferSuccess = true;
          this.loadAccounts(); // Recharger les comptes
          
          setTimeout(() => {
            this.closeQuickTransfer();
          }, 3000);
        }),
        catchError(error => {
          console.error('Erreur lors du transfert:', error);
          this.errorMessage = 'Erreur lors du transfert. Veuillez réessayer.';
          return of(null);
        }),
        finalize(() => {
          this.isTransferring = false;
        })
      )
      .subscribe();
    */
  }

  /**
   * Ferme le modal de transfert
   */
  closeQuickTransfer(): void {
    this.showQuickTransferForm = false;
    this.transferSuccess = false;
    this.quickTransfer = {
      sourceAccountId: this.accounts.length > 0 ? this.accounts[0].id : '',
      destinationAccountId: '',
      amount: 0,
      description: ''
    };
    this.errorMessage = '';
  }

  /**
   * Ferme les modals
   */
  closeModal(): void {
    this.showAccountDetails = false;
    this.showStatements = false;
    this.selectedAccount = null;
  }

  calculateTotalBalance(): void {
    this.totalBalance = this.accounts.reduce((total, account) => {
      if (account.currency === this.selectedCurrency) {
        return total + account.balance;
      }
      
      // Conversion simple (à améliorer avec un service de taux de change)
      const rates: Record<string, number> = {
        'MAD': 1,
        'EUR': 10.8,
        'USD': 10.1,
        'GBP': 12.5
      };
      
      const fromRate = rates[account.currency] || 1;
      const toRate = rates[this.selectedCurrency] || 1;
      const convertedAmount = (account.balance / fromRate) * toRate;
      
      return total + convertedAmount;
    }, 0);
  }
  
  changeCurrency(currency: string): void {
    this.selectedCurrency = currency;
    this.calculateTotalBalance();
  }
  
  // Utilitaires
  getAccountTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'current': 'Compte courant',
      'savings': 'Compte épargne',
      'investment': 'Compte d\'investissement',
      'fixed': 'Dépôt à terme',
      'business': 'Compte professionnel',
      'other': 'Autre'
    };
    return types[type] || type;
  }
  
  getAccountStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
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
      case 'business': return 'fa-solid fa-building';
      default: return 'fa-solid fa-credit-card';
    }
  }
  
  formatDate(date: Date | string | undefined | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
  
  formatCurrency(value: number, currency: string = 'MAD'): string {
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2
    }).format(value || 0);
  }

  refreshAccounts(): void {
    this.loadAccounts();
  }
}