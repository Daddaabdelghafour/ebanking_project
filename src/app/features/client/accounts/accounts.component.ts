import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { StripeService } from '../../../services/stripe/stripe.service';
import { StripeBalance } from '../../../services/stripe/stripe.service';
interface Account {
  id: string;
  accountNumber: string;
  type: string;
  balance: number;
  stripeBalance?: number; // Add Stripe balance
  combinedBalance?: number; // Total balance including Stripe
  availableBalance: number;
  currency: string;
  status: string;
  openedDate: string;
  lastTransactionDate: string | null;
  iban: string;
  dailyLimit?: number;
  interestRate?: number;
  client?: any;
  hasStripe?: boolean; // Flag if account has Stripe
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
  userId : string = 'f63a8753-6908-4130-a897-cf26f5f5d733'
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

  constructor(
    private http: HttpClient,
    private stripeService: StripeService
  ) {}

  ngOnInit(): void {
    this.loadAccountsWithStripe();
  }

  /**
   * Load accounts and combine with Stripe balances
   */
  loadAccountsWithStripe(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Load bank accounts
    const accounts$ = this.http.get<Account[]>(`${this.apiUrl}/accounts/client/${this.clientId}/active`);
    
    // Load Stripe balance
    const stripeBalance$ = this.stripeService.getUserStripeBalance(this.userId).pipe(
      catchError(() => of(null))
    );
    
    forkJoin({
      accounts: accounts$,
      stripeBalance: stripeBalance$
    })
    .pipe(
      tap(({ accounts, stripeBalance }) => {
        this.accounts = accounts || [];
        
        // Add Stripe balance to accounts if available
        if (stripeBalance && stripeBalance.available && stripeBalance.available.length > 0) {
          this.addStripeBalanceToAccounts(stripeBalance);
        }
        
        this.calculateTotalBalance();
        
        if (this.accounts.length > 0) {
          this.quickTransfer.sourceAccountId = this.accounts[0].id;
        }
      }),
      catchError(error => {
        console.error('Erreur lors du chargement:', error);
        this.errorMessage = 'Impossible de charger vos comptes.';
        return of({ accounts: [], stripeBalance: null });
      }),
      finalize(() => {
        this.isLoading = false;
      })
    )
    .subscribe();
  }

  /**
   * Add Stripe balance to the first account (or primary account)
   */
  private addStripeBalanceToAccounts(stripeBalance: StripeBalance): void {
    if (this.accounts.length === 0) return;
    
    // Find EUR balance in Stripe (or convert if needed)
    const eurBalance = stripeBalance.available.find(b => b.currency.toLowerCase() === 'eur');
    
    if (eurBalance) {
      const stripeAmount = eurBalance.amount / 100; // Convert from cents
      
      // Add to the first account (or find primary account)
      const primaryAccount = this.accounts[0];
      primaryAccount.stripeBalance = stripeAmount;
      primaryAccount.combinedBalance = primaryAccount.balance + stripeAmount;
      primaryAccount.hasStripe = true;
    }
  }

  /**
   * Charge les comptes via l'endpoint accounts/client/{clientId}/active
   */
  loadAccounts(): void {
    this.loadAccountsWithStripe();
  }

  /**
   * Refresh accounts including Stripe
   */
  refreshAccounts(): void {
    this.loadAccountsWithStripe();
  }

  /**
   * Affiche les détails d'un compte
   */
  showAccountDetailsModal(accountId: string): void {
    this.http.get<Account>(`${this.apiUrl}/accounts/${accountId}`)
      .pipe(
        tap((account: Account) => {
          // Add Stripe info if this account has it
          const localAccount = this.accounts.find(a => a.id === accountId);
          if (localAccount?.hasStripe) {
            account.stripeBalance = localAccount.stripeBalance;
            account.combinedBalance = localAccount.combinedBalance;
            account.hasStripe = true;
          }
          
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
    const availableBalance = sourceAccount?.combinedBalance || sourceAccount?.balance || 0;
    
    if (sourceAccount && availableBalance < this.quickTransfer.amount) {
      this.errorMessage = 'Solde insuffisant pour effectuer ce transfert.';
      return;
    }
    
    this.isTransferring = true;
    this.errorMessage = '';
    
    // Simuler le transfert
    setTimeout(() => {
      this.transferSuccess = true;
      this.isTransferring = false;
      
      // Mettre à jour les soldes localement
      const sourceAcc = this.accounts.find(a => a.id === this.quickTransfer.sourceAccountId);
      const destAcc = this.accounts.find(a => a.id === this.quickTransfer.destinationAccountId);
      
      if (sourceAcc && destAcc) {
        sourceAcc.balance -= this.quickTransfer.amount;
        if (sourceAcc.combinedBalance) {
          sourceAcc.combinedBalance -= this.quickTransfer.amount;
        }
        
        destAcc.balance += this.quickTransfer.amount;
        if (destAcc.combinedBalance) {
          destAcc.combinedBalance += this.quickTransfer.amount;
        }
        
        this.calculateTotalBalance();
      }
      
      setTimeout(() => {
        this.closeQuickTransfer();
      }, 3000);
    }, 1500);
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
      const accountBalance = account.combinedBalance || account.balance;
      
      if (account.currency === this.selectedCurrency) {
        return total + accountBalance;
      }
      
      // Conversion simple
      const rates: Record<string, number> = {
        'MAD': 1,
        'EUR': 10.8,
        'USD': 10.1,
        'GBP': 12.5
      };
      
      const fromRate = rates[account.currency] || 1;
      const toRate = rates[this.selectedCurrency] || 1;
      const convertedAmount = (accountBalance / fromRate) * toRate;
      
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
}