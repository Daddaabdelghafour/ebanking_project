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
  type: 'internal' | 'external' | 'international';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reason?: string;
  scheduledDate?: string;
  executedDate?: string;
  createdAt: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  transactionFees?: number;
}

interface TransferFormData {
  transferType: string;
  recipientAccountNumber: string;
  recipientName: string;
  amount: number;
  currency: string;
  reason: string;
  isScheduled: boolean;
  scheduledDate?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
}

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './transfers.component.html',
  styleUrls: ['./transfers.component.css']
})
export class TransfersComponent implements OnInit {
  clientId: string = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';
  
  // UI States
  currentTab: 'history' | 'new' = 'history';
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  showError: boolean = false;
  showSuccess: boolean = false;
  showTransferDetails: boolean = false;
  errorMessage: string = '';
  
  // Data
  clientAccounts: Account[] = [];
  selectedAccount: Account | null = null;
  transfers: Transfer[] = [];
  selectedTransfer: Transfer | null = null;
  transferForm: FormGroup;
  
  // Configuration
  transferTypes = [
    { id: 'internal', label: 'Virement interne' },
    { id: 'external', label: 'Virement externe' },
    { id: 'international', label: 'Virement international' }
  ];
  
  currencies = ['MAD', 'EUR', 'USD', 'GBP'];
  
  recurringFrequencies = [
    { id: 'weekly', label: 'Hebdomadaire' },
    { id: 'monthly', label: 'Mensuel' },
    { id: 'quarterly', label: 'Trimestriel' },
    { id: 'yearly', label: 'Annuel' }
  ];

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
  }

  /**
   * Créer le formulaire de virement
   */
  createTransferForm(): FormGroup {
    return this.fb.group({
      transferType: ['external', Validators.required],
      recipientAccountNumber: ['', [Validators.required, Validators.minLength(8)]],
      recipientName: ['', [Validators.required, Validators.minLength(2)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      currency: ['MAD', Validators.required],
      reason: [''],
      isScheduled: [false],
      scheduledDate: [''],
      isRecurring: [false],
      recurringFrequency: ['monthly']
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
          this.showErrorMessage('Impossible de charger vos comptes.');
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  /**
   * Charger l'historique des virements
   */
  loadTransfers(): void {
    if (!this.selectedAccount) return;
    
    // Simuler des données pour l'instant (remplacer par votre endpoint réel)
    this.transfers = [
      {
        id: '1',
        reference: 'TRF-001-2024',
        senderAccountNumber: this.selectedAccount.accountNumber,
        recipientName: 'Mohammed Alami',
        recipientAccountNumber: '1234567890123',
        amount: 1500,
        currency: 'MAD',
        type: 'external',
        status: 'completed',
        reason: 'Paiement facture',
        createdAt: '2024-01-15T10:30:00Z',
        executedDate: '2024-01-15T10:32:00Z'
      },
      {
        id: '2',
        reference: 'TRF-002-2024',
        senderAccountNumber: this.selectedAccount.accountNumber,
        recipientName: 'Fatima Benali',
        recipientAccountNumber: '9876543210987',
        amount: 850,
        currency: 'MAD',
        type: 'external',
        status: 'pending',
        reason: 'Remboursement',
        createdAt: '2024-01-16T14:20:00Z',
        scheduledDate: '2024-01-17T09:00:00Z'
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
   * Gérer le changement de type de virement
   */
  onTransferTypeChange(): void {
    const transferType = this.transferForm.get('transferType')?.value;
    
    // Ajuster les validations selon le type
    if (transferType === 'international') {
      this.transferForm.get('recipientAccountNumber')?.setValidators([
        Validators.required, 
        Validators.minLength(15)
      ]);
    } else {
      this.transferForm.get('recipientAccountNumber')?.setValidators([
        Validators.required, 
        Validators.minLength(8)
      ]);
    }
    
    this.transferForm.get('recipientAccountNumber')?.updateValueAndValidity();
  }

  /**
   * Soumettre le virement
   */
  onSubmitTransfer(): void {
    if (this.transferForm.invalid || this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.clearMessages();
    
    const formData: TransferFormData = this.transferForm.value;
    
    // Vérifier le solde
    if (this.selectedAccount && formData.amount > this.selectedAccount.balance) {
      this.showErrorMessage('Solde insuffisant pour effectuer ce virement.');
      this.isSubmitting = false;
      return;
    }
    
    // Préparer les données pour l'API
    const transferData = {
      senderAccountId: this.selectedAccount?.id,
      recipientAccountNumber: formData.recipientAccountNumber,
      recipientName: formData.recipientName,
      amount: formData.amount,
      currency: formData.currency,
      type: formData.transferType,
      reason: formData.reason,
      isScheduled: formData.isScheduled,
      scheduledDate: formData.isScheduled ? formData.scheduledDate : null,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : null
    };
    
    // Simuler l'appel API et redirection vers Stripe
    this.processTransferWithStripe(transferData);
  }

  /**
   * Traiter le virement avec Stripe
   */
  processTransferWithStripe(transferData: any): void {
    console.log('Processing transfer with Stripe:', transferData);
    
    // Simuler la création d'une session Stripe
    setTimeout(() => {
      // Générer une URL Stripe simulée
      const stripeSessionId = 'cs_test_' + Math.random().toString(36).substr(2, 9);
      const stripeUrl = `https://checkout.stripe.com/pay/${stripeSessionId}#fidkdWxOYHwnPyd1blpxYHZxWjA0S05MZ1FJQGNkYUEyVElCYlBTTDJBUTRJT2dVd2xVcT1gJE1qNkNAaU9kYUZSfV1VPGRJcmtKNUt8MTRtaVJFZ29UaHYwc3JQaVV0YHR8MEh%2FQ0FCYjU8ZGtoNicpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl`;
      
      // Rediriger vers Stripe
      this.redirectToStripe(stripeUrl, transferData);
    }, 1000);
  }

  /**
   * Rediriger vers Stripe
   */
  redirectToStripe(stripeUrl: string, transferData: any): void {
    // Sauvegarder les données du transfert localement pour le retour
    localStorage.setItem('pendingTransfer', JSON.stringify(transferData));
    
    // Message d'information
    if (confirm('Vous allez être redirigé vers Stripe pour finaliser le paiement. Continuer ?')) {
      // En production, vous ouvrirez la vraie URL Stripe
      // window.location.href = stripeUrl;
      
      // Pour la démo, on simule le succès
      this.simulateStripeSuccess();
    } else {
      this.isSubmitting = false;
    }
  }

  /**
   * Simuler le succès Stripe (pour la démo)
   */
  simulateStripeSuccess(): void {
    setTimeout(() => {
      this.isSubmitting = false;
      this.showSuccessMessage('Virement créé avec succès !');
      this.transferForm.reset();
      this.transferForm.patchValue({
        transferType: 'external',
        currency: 'MAD',
        isScheduled: false,
        isRecurring: false,
        recurringFrequency: 'monthly'
      });
      
      // Recharger les virements
      this.loadTransfers();
      
      // Retourner à l'historique
      this.currentTab = 'history';
    }, 2000);
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

  /**
   * Annuler un virement
   */
  cancelTransfer(transferId: string): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce virement ?')) {
      // Simuler l'annulation
      const transfer = this.transfers.find(t => t.id === transferId);
      if (transfer) {
        transfer.status = 'cancelled';
      }
      
      this.showSuccessMessage('Virement annulé avec succès.');
    }
  }

  /**
   * Gérer l'annulation depuis le modal
   */
  handleCancelTransfer(): void {
    if (this.selectedTransfer) {
      this.cancelTransfer(this.selectedTransfer.id);
      this.closeTransferDetails();
    }
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
  formatCurrency(amount: number, currency: string = 'MAD'): string {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
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
  }

  /**
   * Fermer le message d'erreur
   */
  closeError(): void {
    this.showError = false;
    this.errorMessage = '';
  }
}