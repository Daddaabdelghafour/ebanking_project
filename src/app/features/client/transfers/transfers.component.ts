import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, finalize } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { StripeService, StripeBalance } from '../../../services/stripe/stripe.service';

// Interfaces
interface Account {
  id: string;
  accountNumber: string;
  type: string;
  balance: number;
  stripeBalance?: number; // Add Stripe balance
  combinedBalance?: number; // Total balance including Stripe
  currency: string;
  status: string;
  hasStripe?: boolean; // Flag if account has Stripe
  iban?: string;
  availableBalance?: number;
}

interface Transfer {
  id: string;
  reference: string;
  senderAccountNumber: string;
  recipientName: string;
  recipientAccountNumber: string;
  amount: number;
  currency: string;
  type: 'rapid' | 'stripe' | 'external';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reason: string;
  createdAt: string;
  executedDate?: string;
  stripePaymentIntentId?: string;
}

interface QuickTransferRequest {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description: string;
}

interface Recipient {
  id: string;
  email: string;
  localAccount: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PaymentRequestDTO {
  sourceUserId: string;
  destinationStripeAccountId: string;
  amount: number;
  currency: string;
  applicationFeeAmount?: number;
  description: string;
}

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './transfers.component.html',
  styleUrls: ['./transfers.component.css']
})
export class TransfersComponent implements OnInit {
  // Fixed IDs
  clientId: string = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';
  userId: string = 'f63a8753-6908-4130-a897-cf26f5f5d733';
  
  // State management
  currentTab: 'history' | 'rapid' | 'stripe' = 'history';
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  isTransferring: boolean = false;
  
  // Data
  accounts: Account[] = [];
  selectedAccount: Account | null = null;
  transfers: Transfer[] = [];
  availableRecipients: Recipient[] = [];
  selectedRecipient: Recipient | null = null;
  
  // Rapid Transfer
  quickTransfer: QuickTransferRequest = {
    sourceAccountId: '',
    destinationAccountId: '',
    amount: 0,
    description: ''
  };
  
  // Stripe Transfer Form
  stripeTransferForm: FormGroup;
  
  // Messages
  showError: boolean = false;
  showSuccess: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  transferSuccess: boolean = false;
  
  // Modal
  showTransferDetails: boolean = false;
  selectedTransfer: Transfer | null = null;
  
  // Configuration
  currencies = ['EUR', 'USD', 'GBP', 'MAD'];
  
  private apiUrl = 'http://localhost:8085/E-BANKING1/api';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private stripeService: StripeService
  ) {
    this.stripeTransferForm = this.createStripeTransferForm();
  }

  ngOnInit(): void {
    this.loadAccountsWithStripe();
    this.loadAvailableRecipients();
  }

  /**
   * Create Stripe transfer form
   */
  createStripeTransferForm(): FormGroup {
    return this.fb.group({
      recipientId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01), Validators.max(10000)]],
      currency: ['EUR', Validators.required],
      applicationFee: [0],
      description: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  /**
   * Load accounts and combine with Stripe balances
   */
  loadAccountsWithStripe(): void {
    this.isLoading = true;
    
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
          console.log('Stripe balance loaded for transfers:', stripeBalance);
          this.addStripeBalanceToAccounts(stripeBalance);
        } else {
          console.log('No Stripe balance available for transfers');
        }
        
        if (this.accounts.length > 0) {
          this.selectedAccount = this.accounts[0];
          this.quickTransfer.sourceAccountId = this.accounts[0].id;
          this.loadTransfers();
        } else {
          // Fallback for demo
          this.createFallbackAccounts();
        }
      }),
      catchError(error => {
        console.error('Error loading accounts with Stripe:', error);
        this.createFallbackAccounts();
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
    
    // Find EUR balance in Stripe (Stripe amounts are always in cents)
    const eurBalance = stripeBalance.available.find(b => b.currency.toLowerCase() === 'eur');
    
    if (eurBalance) {
      const stripeAmountEUR = eurBalance.amount / 100; // Convert from cents to EUR
      
      // Add to the first account (or find primary account)
      const primaryAccount = this.accounts[0];
      primaryAccount.stripeBalance = stripeAmountEUR; // Always in EUR
      
      if (primaryAccount.currency === 'EUR') {
        // Account is in EUR, direct addition
        primaryAccount.combinedBalance = (primaryAccount.balance || 0) + stripeAmountEUR;
      } else {
        // Account is in different currency, convert Stripe EUR to account currency
        const stripeInAccountCurrency = this.convertFromEUR(stripeAmountEUR, primaryAccount.currency);
        primaryAccount.combinedBalance = (primaryAccount.balance || 0) + stripeInAccountCurrency;
      }
      
      primaryAccount.hasStripe = true;
      
      console.log(`[TRANSFERS] Added Stripe balance: ${stripeAmountEUR} EUR to account ${primaryAccount.accountNumber}`);
      console.log(`[TRANSFERS] Account balance: ${primaryAccount.balance} ${primaryAccount.currency}`);
      console.log(`[TRANSFERS] Combined balance: ${primaryAccount.combinedBalance} ${primaryAccount.currency}`);
    }
  }

  /**
   * Convert from EUR to another currency
   */
  private convertFromEUR(amountEUR: number, toCurrency: string): number {
    if (toCurrency === 'EUR') return amountEUR;
    
    // Conversion rates from EUR
    const fromEURRates: Record<string, number> = {
      'MAD': 10.8,   // 1 EUR = 10.8 MAD
      'USD': 1.18,   // 1 EUR = 1.18 USD
      'GBP': 0.85    // 1 EUR = 0.85 GBP
    };
    
    const rate = fromEURRates[toCurrency] || 1;
    return amountEUR * rate;
  }

  /**
   * Create fallback accounts for demo
   */
  createFallbackAccounts(): void {
    this.accounts = [
      {
        id: '1',
        accountNumber: 'FR76 1000 0000 0000 0000 0001',
        type: 'current',
        balance: 2500.00,
        currency: 'EUR',
        status: 'active'
      },
      {
        id: '2',
        accountNumber: 'FR76 1000 0000 0000 0000 0002',
        type: 'savings',
        balance: 15000.00,
        currency: 'EUR',
        status: 'active'
      }
    ];
    this.selectedAccount = this.accounts[0];
    this.quickTransfer.sourceAccountId = this.accounts[0].id;
    this.loadTransfers();
  }

  /**
   * Load available recipients
   */
  loadAvailableRecipients(): void {
    this.http.get<Recipient[]>(`${this.apiUrl}/stripe/accounts/all`)
      .pipe(
        tap((recipients: Recipient[]) => {
          this.availableRecipients = recipients.filter(r => r.id !== this.userId);
          console.log('Available recipients loaded:', this.availableRecipients);
        }),
        catchError(error => {
          console.error('Error loading recipients:', error);
          this.createFallbackRecipients();
          return of([]);
        })
      )
      .subscribe();
  }

  /**
   * Create fallback recipients for demo
   */
  createFallbackRecipients(): void {
    this.availableRecipients = [
      {
        id: 'acct_demo1',
        email: 'alice@example.com',
        localAccount: {
          firstName: 'Alice',
          lastName: 'Martin',
          email: 'alice@example.com'
        }
      },
      {
        id: 'acct_demo2', 
        email: 'bob@example.com',
        localAccount: {
          firstName: 'Bob',
          lastName: 'Dupont',
          email: 'bob@example.com'
        }
      }
    ];
  }

  /**
   * Load transfers history
   */
  loadTransfers(): void {
    if (!this.selectedAccount) return;
    
    // For demo, create some sample transfers
    this.transfers = [
      {
        id: '1',
        reference: 'RAP-001',
        senderAccountNumber: this.selectedAccount.accountNumber,
        recipientName: 'Compte Épargne',
        recipientAccountNumber: 'FR76 1000 0000 0000 0000 0002',
        amount: 500.00,
        currency: 'EUR',
        type: 'rapid',
        status: 'completed',
        reason: 'Transfert rapide',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        executedDate: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '2',
        reference: 'STR-002',
        senderAccountNumber: this.selectedAccount.accountNumber,
        recipientName: 'Alice Martin',
        recipientAccountNumber: 'acct_1234567890',
        amount: 250.00,
        currency: 'EUR',
        type: 'stripe',
        status: 'completed',
        reason: 'Paiement Stripe',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        executedDate: new Date(Date.now() - 172800000).toISOString(),
        stripePaymentIntentId: 'pi_1234567890'
      }
    ];
  }

  /**
   * Switch tabs
   */
  switchTab(tab: 'history' | 'rapid' | 'stripe'): void {
    this.currentTab = tab;
    this.clearMessages();
    this.transferSuccess = false;
  }

  /**
   * Select account
   */
  selectAccount(account: Account): void {
    this.selectedAccount = account;
    this.quickTransfer.sourceAccountId = account.id;
    this.loadTransfers();
  }

  /**
   * Perform rapid transfer between own accounts
   */
  performQuickTransfer(): void {
    if (this.isTransferring) return;
    
    if (!this.quickTransfer.sourceAccountId || !this.quickTransfer.destinationAccountId) {
      this.showErrorMessage('Veuillez sélectionner les comptes source et destination.');
      return;
    }
    
    if (this.quickTransfer.sourceAccountId === this.quickTransfer.destinationAccountId) {
      this.showErrorMessage('Le compte source et destination ne peuvent pas être identiques.');
      return;
    }
    
    if (this.quickTransfer.amount <= 0) {
      this.showErrorMessage('Le montant doit être supérieur à zéro.');
      return;
    }
    
    const sourceAccount = this.accounts.find(a => a.id === this.quickTransfer.sourceAccountId);
    const availableBalance = sourceAccount?.combinedBalance || sourceAccount?.balance || 0;
    
    if (sourceAccount && availableBalance < this.quickTransfer.amount) {
      this.showErrorMessage('Solde insuffisant pour effectuer ce transfert.');
      return;
    }
    
    this.isTransferring = true;
    this.clearMessages();
    
    // Simulate transfer
    setTimeout(() => {
      this.transferSuccess = true;
      this.isTransferring = false;
      
      // Update balances locally
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
        
        // Add to transfers list
        const newTransfer: Transfer = {
          id: Date.now().toString(),
          reference: `RAP-${Date.now()}`,
          senderAccountNumber: sourceAcc.accountNumber,
          recipientName: this.getAccountTypeLabel(destAcc.type),
          recipientAccountNumber: destAcc.accountNumber,
          amount: this.quickTransfer.amount,
          currency: sourceAcc.currency,
          type: 'rapid',
          status: 'completed',
          reason: this.quickTransfer.description || 'Transfert rapide',
          createdAt: new Date().toISOString(),
          executedDate: new Date().toISOString()
        };
        
        this.transfers.unshift(newTransfer);
      }
      
      setTimeout(() => {
        this.resetQuickTransfer();
      }, 3000);
    }, 1500);
  }

  /**
   * Handle recipient selection for Stripe
   */
  onRecipientSelect(): void {
    const recipientId = this.stripeTransferForm.get('recipientId')?.value;
    this.selectedRecipient = this.availableRecipients.find(r => r.id === recipientId) || null;
  }

  /**
   * Submit Stripe transfer
   */
  onSubmitStripeTransfer(): void {
    if (this.stripeTransferForm.invalid || this.isSubmitting || !this.selectedAccount || !this.selectedRecipient) {
      this.showErrorMessage('Veuillez remplir correctement tous les champs requis.');
      return;
    }
    
    this.isSubmitting = true;
    this.clearMessages();
    
    const formData = this.stripeTransferForm.value;
    
    // Use combined balance for verification
    const availableBalance = this.selectedAccount.combinedBalance || this.selectedAccount.balance || 0;
    
    if (formData.amount > availableBalance) {
      this.showErrorMessage(`Solde insuffisant pour effectuer ce virement. Disponible: ${this.formatCurrency(availableBalance, this.selectedAccount.currency)}`);
      this.isSubmitting = false;
      return;
    }

    this.processStripePayment(formData);
  }

  /**
   * Process Stripe payment
   */
  processStripePayment(formData: any): void {
    const paymentRequest: PaymentRequestDTO = {
      sourceUserId: this.userId,
      destinationStripeAccountId: this.selectedRecipient!.id,
      amount: Math.round(formData.amount * 100), // Convert to cents
      currency: formData.currency.toLowerCase(),
      applicationFeeAmount: formData.applicationFee > 0 ? formData.applicationFee : undefined,
      description: formData.description
    };

    console.log('Processing Stripe payment:', paymentRequest);

    this.http.post(`${this.apiUrl}/transaction/pay`, paymentRequest, this.httpOptions)
      .pipe(
        tap((response: any) => {
          console.log('Stripe payment response:', response);
          
          // Update account balances locally
          if (this.selectedAccount) {
            const deductAmount = formData.amount;
            
            if (this.selectedAccount.combinedBalance) {
              this.selectedAccount.combinedBalance -= deductAmount;
            }
            
            // Deduct from Stripe balance first if available
            if (this.selectedAccount.stripeBalance && this.selectedAccount.stripeBalance >= deductAmount) {
              this.selectedAccount.stripeBalance -= deductAmount;
            } else {
              this.selectedAccount.balance -= deductAmount;
            }
          }
          
          // Create transfer record
          const newTransfer: Transfer = {
            id: response.id,
            reference: `STR-${Date.now()}`,
            senderAccountNumber: this.selectedAccount!.accountNumber,
            recipientName: this.selectedRecipient!.localAccount.firstName + ' ' + this.selectedRecipient!.localAccount.lastName,
            recipientAccountNumber: this.selectedRecipient!.id,
            amount: formData.amount,
            currency: formData.currency,
            type: 'stripe',
            status: response.status === 'succeeded' ? 'completed' : 'processing',
            reason: formData.description,
            createdAt: new Date().toISOString(),
            stripePaymentIntentId: response.id
          };

          this.transfers.unshift(newTransfer);
          this.showSuccessMessage(`Paiement Stripe créé avec succès ! ID: ${response.id}`);
          this.resetStripeForm();
        }),
        catchError(error => {
          console.error('Erreur Stripe payment:', error);
          this.showErrorMessage(error.error || 'Erreur lors du traitement du paiement Stripe.');
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe();
  }

  /**
   * Reset quick transfer form
   */
  resetQuickTransfer(): void {
    this.quickTransfer = {
      sourceAccountId: this.accounts.length > 0 ? this.accounts[0].id : '',
      destinationAccountId: '',
      amount: 0,
      description: ''
    };
    this.transferSuccess = false;
    this.currentTab = 'history';
  }

  /**
   * Reset Stripe form
   */
  resetStripeForm(): void {
    this.stripeTransferForm.reset({
      currency: 'EUR',
      applicationFee: 0
    });
    this.selectedRecipient = null;
    this.currentTab = 'history';
  }

  /**
   * View transfer details
   */
  viewTransferDetails(transfer: Transfer): void {
    this.selectedTransfer = transfer;
    this.showTransferDetails = true;
  }

  /**
   * Close transfer details modal
   */
  closeTransferDetails(): void {
    this.showTransferDetails = false;
    this.selectedTransfer = null;
  }

  /**
   * Message management
   */
  showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
    this.showSuccess = false;
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccess = true;
    this.showError = false;
  }

  clearMessages(): void {
    this.showError = false;
    this.showSuccess = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeError(): void {
    this.showError = false;
    this.errorMessage = '';
  }

  /**
   * Form validation helpers
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.stripeTransferForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Utility methods
   */
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

  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'processing': return 'En cours';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }

  getTransferTypeText(type: string): string {
    switch (type) {
      case 'rapid': return 'Transfert rapide';
      case 'stripe': return 'Paiement Stripe';
      case 'external': return 'Virement externe';
      default: return type;
    }
  }

  getTransferTypeIcon(type: string): string {
    switch (type) {
      case 'rapid': return 'fa-solid fa-bolt';
      case 'stripe': return 'fab fa-stripe';
      case 'external': return 'fa-solid fa-building-columns';
      default: return 'fa-solid fa-money-bill-transfer';
    }
  }
}