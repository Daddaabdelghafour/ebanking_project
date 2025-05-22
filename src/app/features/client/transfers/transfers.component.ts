import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
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
  iban?: string;
}

interface Transfer {
  id: string;
  reference: string;
  senderAccountId: string;
  senderAccountNumber: string;
  recipientAccountNumber: string;
  recipientName: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  reason?: string;
  executedDate?: string;
  scheduledDate?: string;
  createdAt: string;
  transactionFees?: number;
  isRecurring?: boolean;
  recurringFrequency?: string;
}

interface TransferFormData {
  senderAccountId: string;
  recipientAccountNumber: string;
  recipientName: string;
  amount: number;
  currency: string;
  reason?: string;
  scheduledDate?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  type: string;
}

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './transfers.component.html',
  styleUrls: ['./transfers.component.css']
})
export class TransfersComponent implements OnInit {
  // Client and account data
  clientId: string = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4'; // ID de client fixe pour le développement
  clientAccounts: Account[] = [];
  selectedAccount: Account | null = null;
  availableRecipientAccounts: Account[] = []; // Comptes disponibles dans la base de données
  
  // Transfers data
  transfers: Transfer[] = [];
  selectedTransfer: Transfer | null = null;
  
  // Form data
  transferForm: FormGroup;
  currencies: string[] = ['MAD', 'EUR', 'USD'];
  transferTypes: {id: string, label: string}[] = [
    { id: 'internal', label: 'Entre mes comptes' },
    { id: 'domestic', label: 'Virement national' }
  ];
  recurringFrequencies: {id: string, label: string}[] = [
    { id: 'weekly', label: 'Hebdomadaire' },
    { id: 'monthly', label: 'Mensuel' },
    { id: 'quarterly', label: 'Trimestriel' },
    { id: 'annually', label: 'Annuel' }
  ];
  
  // UI state
  isLoading = true;
  isSubmitting = false;
  showTransferDetails = false;
  showSuccess = false;
  showError = false;
  errorMessage = '';
  currentTab = 'history'; // 'history' ou 'new'
  
  private apiUrl = 'http://localhost:8085/E-BANKING1/api';
  
  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.transferForm = this.createTransferForm();
  }
  
  ngOnInit(): void {
    this.loadClientAccounts();
    this.loadAllAvailableAccounts(); // Pour simuler les transferts vers d'autres comptes
  }
  
  createTransferForm(): FormGroup {
    return this.fb.group({
      senderAccountId: ['', Validators.required],
      transferType: ['internal', Validators.required],
      recipientAccountNumber: ['', [Validators.required, Validators.minLength(4)]],
      recipientName: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(1)]],
      currency: ['MAD', Validators.required],
      reason: [''],
      isScheduled: [false],
      scheduledDate: [null],
      isRecurring: [false],
      recurringFrequency: ['monthly']
    });
  }
  
  loadClientAccounts(): void {
    this.isLoading = true;
    
    this.http.get<any>(`${this.apiUrl}/clients/${this.clientId}`).pipe(
      tap((response: any) => {
        // Si la réponse est un tableau, prendre le premier élément
        const client = Array.isArray(response) ? response[0] : response;
        
        if (client && client.accounts && Array.isArray(client.accounts)) {
          this.clientAccounts = client.accounts;
          
          // Sélectionner le premier compte par défaut
          if (this.clientAccounts.length > 0) {
            this.selectedAccount = this.clientAccounts[0];
            
            // Initialiser le formulaire avec le compte source
            this.transferForm.patchValue({
              senderAccountId: this.selectedAccount.id,
              currency: this.selectedAccount.currency
            });
            
            // Charger les transferts pour ce compte
            this.loadTransfers(this.selectedAccount.id);
          } else {
            this.isLoading = false;
          }
        } else {
          this.isLoading = false;
          this.showError = true;
          this.errorMessage = "Aucun compte client trouvé.";
        }
      }),
      catchError(err => {
        console.error('Erreur lors du chargement des comptes client:', err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = "Impossible de charger vos comptes. Veuillez réessayer.";
        return of(null);
      })
    ).subscribe();
  }
  
  // Charger d'autres comptes disponibles pour simuler les transferts
  loadAllAvailableAccounts(): void {
    // Simulation - en production, ce serait un appel API pour récupérer des comptes valides
    this.http.get<any>(`${this.apiUrl}/accounts`).pipe(
      tap((accounts: any[]) => {
        // Filtrer pour exclure les comptes du client actuel
        this.availableRecipientAccounts = accounts.filter(account => 
          !this.clientAccounts.some(clientAccount => clientAccount.id === account.id)
        );
      }),
      catchError(err => {
        console.error('Erreur lors du chargement des comptes disponibles:', err);
        // Créer quelques comptes fictifs pour la simulation
        this.availableRecipientAccounts = [
          {
            id: 'other-account-1',
            accountNumber: '9876543210',
            type: 'current',
            balance: 15000,
            availableBalance: 15000,
            currency: 'MAD',
            status: 'active',
            iban: 'MA9876543210'
          },
          {
            id: 'other-account-2',
            accountNumber: '5432167890',
            type: 'savings',
            balance: 25000,
            availableBalance: 25000,
            currency: 'EUR',
            status: 'active',
            iban: 'FR5432167890'
          }
        ];
        return of(null);
      })
    ).subscribe();
  }
  
  loadTransfers(accountId: string): void {
    this.http.get<Transfer[]>(`${this.apiUrl}/transfers/account/${accountId}`).pipe(
      tap((transfers: Transfer[]) => {
        this.transfers = transfers;
      }),
      catchError(err => {
        console.error('Erreur lors du chargement des transferts:', err);
        // Créer des transferts de démonstration
        this.transfers = this.generateDemoTransfers(accountId);
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }
  
  generateDemoTransfers(accountId: string): Transfer[] {
    // Créer quelques transferts de démonstration
    const account = this.clientAccounts.find(acc => acc.id === accountId);
    if (!account) return [];
    
    return [
      {
        id: 'transfer-1',
        reference: 'TRF-' + Math.floor(Math.random() * 1000000),
        senderAccountId: accountId,
        senderAccountNumber: account.accountNumber,
        recipientAccountNumber: '9876543210',
        recipientName: 'Mohamed Amine',
        amount: 1500,
        currency: account.currency,
        status: 'completed',
        type: 'domestic',
        reason: 'Paiement facture',
        executedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'transfer-2',
        reference: 'TRF-' + Math.floor(Math.random() * 1000000),
        senderAccountId: accountId,
        senderAccountNumber: account.accountNumber,
        recipientAccountNumber: '5432167890',
        recipientName: 'Fatima Zahra',
        amount: 2500,
        currency: account.currency,
        status: 'pending',
        type: 'domestic',
        reason: 'Loyer',
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
  }
  
  onSubmitTransfer(): void {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }
    
    this.isSubmitting = true;
    const formData = this.transferForm.value;
    
    // Préparer les données du transfert
    const transferData: TransferFormData = {
      senderAccountId: formData.senderAccountId,
      recipientAccountNumber: formData.recipientAccountNumber,
      recipientName: formData.recipientName,
      amount: Number(formData.amount),
      currency: formData.currency,
      reason: formData.reason || '',
      scheduledDate: formData.isScheduled ? formData.scheduledDate : undefined,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
      type: formData.transferType
    };
    
    // Simuler un appel API pour créer le transfert
    setTimeout(() => {
      // Vérifier le solde disponible
      const senderAccount = this.clientAccounts.find(acc => acc.id === transferData.senderAccountId);
      if (senderAccount && senderAccount.balance < transferData.amount) {
        this.isSubmitting = false;
        this.showError = true;
        this.errorMessage = "Solde insuffisant pour effectuer ce transfert.";
        return;
      }
      
      // Simulation d'un transfert réussi
      this.isSubmitting = false;
      this.showSuccess = true;
      
      // Réinitialiser le formulaire
      this.transferForm.reset({
        senderAccountId: this.selectedAccount?.id,
        transferType: 'internal',
        currency: this.selectedAccount?.currency || 'MAD',
        isScheduled: false,
        isRecurring: false,
        recurringFrequency: 'monthly'
      });
      
      // Passer à l'onglet historique après 3 secondes
      setTimeout(() => {
        this.currentTab = 'history';
        this.showSuccess = false;
        
        // Ajouter le nouveau transfert à la liste et simuler la mise à jour du solde
        const newTransfer: Transfer = {
          id: 'new-transfer-' + Date.now(),
          reference: 'TRF-' + Math.floor(Math.random() * 1000000),
          senderAccountId: transferData.senderAccountId,
          senderAccountNumber: senderAccount?.accountNumber || '',
          recipientAccountNumber: transferData.recipientAccountNumber,
          recipientName: transferData.recipientName,
          amount: transferData.amount,
          currency: transferData.currency,
          status: formData.isScheduled ? 'pending' : 'completed',
          type: transferData.type,
          reason: transferData.reason,
          executedDate: formData.isScheduled ? undefined : new Date().toISOString(),
          scheduledDate: formData.isScheduled ? formData.scheduledDate : undefined,
          createdAt: new Date().toISOString(),
          isRecurring: transferData.isRecurring,
          recurringFrequency: transferData.recurringFrequency
        };
        
        this.transfers.unshift(newTransfer);
        
        // Simuler la mise à jour du solde si le transfert est immédiat
        if (!formData.isScheduled && senderAccount) {
          senderAccount.balance -= transferData.amount;
          senderAccount.availableBalance -= transferData.amount;
        }
      }, 3000);
    }, 1500);
  }
  
  viewTransferDetails(transfer: Transfer): void {
    this.selectedTransfer = transfer;
    this.showTransferDetails = true;
  }
  
  closeTransferDetails(): void {
    this.selectedTransfer = null;
    this.showTransferDetails = false;
  }
  
  cancelTransfer(transferId: string): void {
    if (!transferId) return;
    
    if (confirm('Êtes-vous sûr de vouloir annuler ce virement ?')) {
      // Simuler l'annulation
      const index = this.transfers.findIndex(t => t.id === transferId);
      if (index !== -1) {
        this.transfers[index].status = 'cancelled';
        
        // Si le transfert était en attente, restaurer le solde
        if (this.transfers[index].status === 'pending') {
          const senderAccount = this.clientAccounts.find(
            acc => acc.id === this.transfers[index].senderAccountId
          );
          if (senderAccount) {
            senderAccount.balance += this.transfers[index].amount;
            senderAccount.availableBalance += this.transfers[index].amount;
          }
        }
      }
    }
  }
  
  selectAccount(account: Account): void {
    this.selectedAccount = account;
    // Mettre à jour le compte source dans le formulaire et charger les transferts
    this.transferForm.patchValue({
      senderAccountId: account.id,
      currency: account.currency
    });
    this.loadTransfers(account.id);
  }
  
  switchTab(tab: string): void {
    this.currentTab = tab;
    if (tab === 'new') {
      // Réinitialiser les messages d'erreur/succès
      this.showSuccess = false;
      this.showError = false;
    }
  }
  
  onTransferTypeChange(): void {
    const transferType = this.transferForm.get('transferType')?.value;
    
    // Si c'est un transfert interne, précharger les informations d'un autre compte du client
    if (transferType === 'internal' && this.clientAccounts.length > 1) {
      // Trouver un compte différent du compte source
      const sourceAccountId = this.transferForm.get('senderAccountId')?.value;
      const otherAccounts = this.clientAccounts.filter(acc => acc.id !== sourceAccountId);
      
      if (otherAccounts.length > 0) {
        const destinationAccount = otherAccounts[0];
        this.transferForm.patchValue({
          recipientAccountNumber: destinationAccount.accountNumber,
          recipientName: 'Moi-même', // Le transfert est vers un autre compte du même client
          currency: destinationAccount.currency
        });
      }
    } else if (transferType === 'domestic') {
      // Simuler un bénéficiaire externe
      if (this.availableRecipientAccounts.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.availableRecipientAccounts.length);
        const externalAccount = this.availableRecipientAccounts[randomIndex];
        
        this.transferForm.patchValue({
          recipientAccountNumber: externalAccount.accountNumber,
          recipientName: '', // Le client doit entrer le nom du bénéficiaire
          currency: this.transferForm.get('currency')?.value // Conserver la devise actuelle
        });
      } else {
        // Réinitialiser les champs
        this.transferForm.patchValue({
          recipientAccountNumber: '',
          recipientName: '',
        });
      }
    }
  }
  
  // Utilitaires pour la validation du formulaire
  hasError(controlName: string, errorName: string): boolean {
    const control = this.transferForm.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }
  
  closeError(): void {
    this.showError = false;
  }
  
  // Méthodes pour le formatage
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  }
  
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  }
  
  getStatusClass(status: string): string {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  getStatusText(status: string): string {
    switch(status) {
      case 'completed':
        return 'Exécuté';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }
  
  handleCancelTransfer(): void {
    if (this.selectedTransfer && this.selectedTransfer.id) {
      this.cancelTransfer(this.selectedTransfer.id);
    }
    this.closeTransferDetails();
  }
  
  getTransferTypeText(type: string): string {
    switch(type) {
      case 'domestic':
        return 'National';
      case 'internal':
        return 'Entre mes comptes';
      default:
        return type;
    }
  }
}