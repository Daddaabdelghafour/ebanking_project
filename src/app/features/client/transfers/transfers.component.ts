import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface Account {
  id: string;
  accountNumber: string;
  type: string;
  balance: number;
  currency: string;
  status: string;
}

interface Transfer {
  id: string;
  reference: string;
  senderAccountNumber: string;
  recipientName: string;
  recipientAccountNumber: string;
  amount: number;
  currency: string;
  type: 'stripe' | 'direct';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reason?: string;
  scheduledDate?: string;
  executedDate?: string;
  createdAt: string;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
}

interface PaymentRequestDTO {
  sourceUserId: string;
  destinationStripeAccountId: string;
  amount: number; // en centimes
  currency: string;
  applicationFeeAmount?: number;
  description?: string;
}

interface StripeAccount {
  id: string;
  email: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  localAccount: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
}

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './transfers.component.html',
  styleUrls: ['./transfers.component.css']
})
export class TransfersComponent implements OnInit {
  // Fixed IDs like in stripe-management
  clientId: string = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';
  userId: string = 'f63a8753-6908-4130-a897-cf26f5f5d733';
  
  // UI States
  currentTab: 'history' | 'new' = 'history';
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  isLoadingRecipients: boolean = false;
  showError: boolean = false;
  showSuccess: boolean = false;
  showTransferDetails: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Data
  clientAccounts: Account[] = [];
  selectedAccount: Account | null = null;
  availableRecipients: StripeAccount[] = [];
  selectedRecipient: StripeAccount | null = null;
  transfers: Transfer[] = [];
  selectedTransfer: Transfer | null = null;
  transferForm: FormGroup;
  
  // Configuration
  transferTypes = [
    { id: 'stripe', label: 'Virement via Stripe' },
    { id: 'direct', label: 'Transfert direct' }
  ];
  
  currencies = ['EUR', 'USD', 'MAD'];

  private apiUrl = 'http://localhost:8085/E-BANKING1/api';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.transferForm = this.createTransferForm();
  }

  ngOnInit(): void {
    this.loadClientAccounts();
    this.loadAvailableRecipients();
  }

  /**
   * Créer le formulaire de virement simplifié
   */
  createTransferForm(): FormGroup {
    return this.fb.group({
      transferType: ['stripe', Validators.required],
      recipientId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01), Validators.max(10000)]],
      currency: ['EUR', Validators.required],
      description: ['Virement client', [Validators.required, Validators.minLength(3)]],
      applicationFee: [0, [Validators.min(0), Validators.max(1000)]] // Frais plateforme en centimes
    });
  }

  /**
   * Charger les comptes du client
   */
  loadClientAccounts(): void {
    this.isLoading = true;
    
    this.http.get<Account[]>(`${this.apiUrl}/accounts/client/${this.clientId}/active`)
      .pipe(
        tap((accounts: Account[]) => {
          this.clientAccounts = accounts || [];
          if (this.clientAccounts.length > 0) {
            this.selectedAccount = this.clientAccounts[0];
            this.loadTransfers();
          }
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des comptes:', error);
          // Utiliser des données de fallback pour la démo
          this.createFallbackAccounts();
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  /**
   * Créer des comptes de fallback pour la démo
   */
  createFallbackAccounts(): void {
    this.clientAccounts = [
      {
        id: 'acc_123456',
        accountNumber: '001234567890',
        type: 'checking',
        balance: 5000.00,
        currency: 'EUR',
        status: 'active'
      }
    ];
    this.selectedAccount = this.clientAccounts[0];
    this.loadTransfers();
  }

  /**
   * Charger les destinataires disponibles (comptes Stripe actifs)
   */
  loadAvailableRecipients(): void {
    this.isLoadingRecipients = true;
    
    this.http.get<StripeAccount[]>(`${this.apiUrl}/stripe`)
      .pipe(
        tap((accounts: StripeAccount[]) => {
          // Filtrer les comptes actifs et excluire le compte courant
          this.availableRecipients = accounts.filter(acc => 
            acc.chargesEnabled && 
            acc.payoutsEnabled && 
            acc.localAccount.id !== this.userId
          );
          console.log('Recipients loaded:', this.availableRecipients);
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des destinataires:', error);
          this.showErrorMessage('Impossible de charger les destinataires disponibles.');
          return of([]);
        }),
        finalize(() => {
          this.isLoadingRecipients = false;
        })
      )
      .subscribe();
  }

  /**
   * Charger l'historique des virements (simulation pour l'instant)
   */
  loadTransfers(): void {
    if (!this.selectedAccount) return;
    
    // Simuler des données - remplacer par votre endpoint réel
    this.transfers = [
      {
        id: '1',
        reference: 'TRF-001-2024',
        senderAccountNumber: this.selectedAccount.accountNumber,
        recipientName: 'Mohammed Alami',
        recipientAccountNumber: 'acct_1Nv0FGQ9RKHgCVdK',
        amount: 15.00,
        currency: 'EUR',
        type: 'stripe',
        status: 'completed',
        reason: 'Paiement service',
        createdAt: new Date().toISOString(),
        executedDate: new Date().toISOString(),
        stripePaymentIntentId: 'pi_test_1234567890'
      }
    ];
  }

  /**
   * Sélectionner un compte
   */
  selectAccount(account: Account): void {
    this.selectedAccount = account;
    this.loadTransfers();
  }

  /**
   * Changer d'onglet
   */
  switchTab(tab: 'history' | 'new'): void {
    this.currentTab = tab;
    this.clearMessages();
  }

  /**
   * Sélectionner un destinataire
   */
  onRecipientSelect(): void {
    const recipientId = this.transferForm.get('recipientId')?.value;
    this.selectedRecipient = this.availableRecipients.find(r => r.id === recipientId) || null;
  }

  /**
   * Soumettre le virement
   */
  onSubmitTransfer(): void {
    if (this.transferForm.invalid || this.isSubmitting || !this.selectedAccount || !this.selectedRecipient) {
      this.showErrorMessage('Veuillez remplir correctement tous les champs requis.');
      return;
    }
    
    this.isSubmitting = true;
    this.clearMessages();
    
    const formData = this.transferForm.value;
    
    // Vérifier le solde
    const amountInEur = formData.amount;
    if (amountInEur > this.selectedAccount.balance) {
      this.showErrorMessage('Solde insuffisant pour effectuer ce virement.');
      this.isSubmitting = false;
      return;
    }

    // Préparer la demande selon le type de transfert
    if (formData.transferType === 'stripe') {
      this.processStripePayment(formData);
    } else {
      this.processDirectTransfer(formData);
    }
  }

  /**
   * Traiter le paiement via Stripe
   */
  processStripePayment(formData: any): void {
    const paymentRequest: PaymentRequestDTO = {
      sourceUserId: this.userId,
      destinationStripeAccountId: this.selectedRecipient!.id,
      amount: Math.round(formData.amount * 100), // Convertir en centimes
      currency: formData.currency.toLowerCase(),
      applicationFeeAmount: formData.applicationFee > 0 ? formData.applicationFee : undefined,
      description: formData.description
    };

    console.log('Processing Stripe payment:', paymentRequest);

    this.http.post(`${this.apiUrl}/transaction/pay`, paymentRequest, this.httpOptions)
      .pipe(
        tap((response: any) => {
          console.log('Stripe payment response:', response);
          
          // Créer un enregistrement de transfert local
          const newTransfer: Transfer = {
            id: response.id,
            reference: `PAY-${Date.now()}`,
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
          this.resetForm();
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
   * Traiter le transfert direct
   */
  processDirectTransfer(formData: any): void {
    const transferRequest = {
      sourceAccountId: this.selectedAccount!.id, // Notre compte Stripe
      destinationStripeAccountId: this.selectedRecipient!.id,
      amount: Math.round(formData.amount * 100), // Convertir en centimes
      currency: formData.currency.toLowerCase(),
      description: formData.description
    };

    console.log('Processing direct transfer:', transferRequest);

    this.http.post(`${this.apiUrl}/transaction/direct-transfer`, transferRequest, this.httpOptions)
      .pipe(
        tap((response: any) => {
          console.log('Direct transfer response:', response);
          
          // Créer un enregistrement de transfert local
          const newTransfer: Transfer = {
            id: response.id,
            reference: `TRF-${Date.now()}`,
            senderAccountNumber: this.selectedAccount!.accountNumber,
            recipientName: this.selectedRecipient!.localAccount.firstName + ' ' + this.selectedRecipient!.localAccount.lastName,
            recipientAccountNumber: this.selectedRecipient!.id,
            amount: formData.amount,
            currency: formData.currency,
            type: 'direct',
            status: 'completed',
            reason: formData.description,
            createdAt: new Date().toISOString(),
            stripeTransferId: response.id
          };

          this.transfers.unshift(newTransfer);
          this.showSuccessMessage(`Transfert direct créé avec succès ! ID: ${response.id}`);
          this.resetForm();
        }),
        catchError(error => {
          console.error('Erreur direct transfer:', error);
          this.showErrorMessage(error.error || 'Erreur lors du transfert direct.');
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe();
  }

  /**
   * Réinitialiser le formulaire après succès
   */
  resetForm(): void {
    this.transferForm.reset();
    this.transferForm.patchValue({
      transferType: 'stripe',
      currency: 'EUR',
      description: 'Virement client',
      applicationFee: 0
    });
    this.selectedRecipient = null;
    this.currentTab = 'history';
  }

  /**
   * Afficher les détails d'un virement
   */
  viewTransferDetails(transfer: Transfer): void {
    this.selectedTransfer = transfer;
    this.showTransferDetails = true;
  }

  /**
   * Fermer les détails du virement
   */
  closeTransferDetails(): void {
    this.showTransferDetails = false;
    this.selectedTransfer = null;
  }

  // ===== UTILITAIRES =====

  /**
   * Vérifier les erreurs de formulaire
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.transferForm.get(controlName);
    return !!(control?.hasError(errorType) && (control?.dirty || control?.touched));
  }

  /**
   * Obtenir le nom du destinataire
   */
  getRecipientName(recipientId: string): string {
    const recipient = this.availableRecipients.find(r => r.id === recipientId);
    if (recipient) {
      return `${recipient.localAccount.firstName} ${recipient.localAccount.lastName}`;
    }
    return 'Destinataire inconnu';
  }

  /**
   * Obtenir le texte du type de virement
   */
  getTransferTypeText(type: string): string {
    const typeObj = this.transferTypes.find(t => t.id === type);
    return typeObj?.label || type;
  }

  /**
   * Obtenir le texte du statut
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'processing': 'En cours',
      'completed': 'Complété',
      'failed': 'Échec',
      'cancelled': 'Annulé'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtenir la classe CSS du statut
   */
  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Formater la date
   */
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formater la devise
   */
  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Calculer les frais en euros
   */
  getApplicationFeeInEur(): number {
    const feeInCents = this.transferForm.get('applicationFee')?.value || 0;
    return feeInCents / 100;
  }

  /**
   * Afficher un message d'erreur
   */
  showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
    this.showSuccess = false;
  }

  /**
   * Afficher un message de succès
   */
  showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccess = true;
    this.showError = false;
    
    // Auto-masquer après 5 secondes
    setTimeout(() => {
      this.showSuccess = false;
    }, 5000);
  }

  /**
   * Fermer les messages
   */
  clearMessages(): void {
    this.showError = false;
    this.showSuccess = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Fermer le message d'erreur
   */
  closeError(): void {
    this.showError = false;
    this.errorMessage = '';
  }
}