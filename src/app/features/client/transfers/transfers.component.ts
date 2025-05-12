import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ClientService } from '../../../services/client/client.service';
import { TransferService } from '../../../services/transfer/transfer.service';
import { Client, Account } from '../../../shared/models/client.model';
import { Transfer, TransferFormData } from '../../../shared/models/transfer.model';

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './transfers.component.html',
  styleUrls: ['./transfers.component.css']
})
export class TransfersComponent implements OnInit {
  // Client and account data
  currentClient: Client | null = null;
  clientAccounts: Account[] = [];
  selectedAccount: Account | null = null;
  
  // Transfers data
  transfers: Transfer[] = [];
  selectedTransfer: Transfer | null = null;
  
  // Form data
  transferForm: FormGroup;
  banks: {code: string, name: string}[] = [];
  currencies: string[] = [];
  transferTypes: {id: string, label: string}[] = [];
  recurringFrequencies: {id: string, label: string}[] = [];
  
  // UI state
  isLoading = true;
  isSubmitting = false;
  showTransferForm = false;
  showTransferDetails = false;
  showSuccess = false;
  showError = false;
  errorMessage = '';
  currentTab = 'history'; // 'history' or 'new'
  
  constructor(
    private clientService: ClientService,
    private transferService: TransferService,
    private fb: FormBuilder
  ) {
    this.transferForm = this.createTransferForm();
  }
  
  ngOnInit(): void {
    this.loadClientData();
    this.loadReferenceData();
  }
  
  createTransferForm(): FormGroup {
    return this.fb.group({
      senderAccountId: ['', Validators.required],
      transferType: ['domestic', Validators.required],
      recipientAccountNumber: ['', [Validators.required, Validators.minLength(4)]],
      recipientName: ['', [Validators.required, Validators.minLength(3)]],
      recipientBankCode: [''],
      amount: ['', [Validators.required, Validators.min(1)]],
      currency: ['MAD', Validators.required],
      reason: [''],
      isScheduled: [false],
      scheduledDate: [null],
      isRecurring: [false],
      recurringFrequency: ['monthly']
    });
  }
  
  loadClientData(): void {
    // Pour la démo, on utilise le premier client
    const clientId = 'cl1';
    
    this.isLoading = true;
    this.clientService.getClientById(clientId).subscribe({
      next: (client) => {
        if (client) {
          this.currentClient = client;
          
          // Extract accounts from client data
          if (client.accounts && client.accounts.length > 0) {
            this.clientAccounts = client.accounts;
            this.selectedAccount = client.accounts[0];
            
            // Set default sender account
            this.transferForm.patchValue({
              senderAccountId: this.selectedAccount.id,
              currency: this.selectedAccount.currency
            });
            
            // Load transfers for the selected account
            this.loadTransfers(this.selectedAccount.id);
          } else {
            this.isLoading = false;
            this.showError = true;
            this.errorMessage = "Aucun compte trouvé pour effectuer des virements.";
          }
        } else {
          this.isLoading = false;
          this.showError = true;
          this.errorMessage = "Client non trouvé.";
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données client', err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = "Erreur lors du chargement des données client.";
      }
    });
  }
  
  loadTransfers(accountId: string): void {
    this.transferService.getTransfers(accountId).subscribe({
      next: (transfers) => {
        this.transfers = transfers;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des transferts', err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = "Erreur lors du chargement des transferts.";
      }
    });
  }
  
  loadReferenceData(): void {
    // Load banks
    this.transferService.getBanks().subscribe(banks => {
      this.banks = banks;
    });
    
    // Load currencies
    this.transferService.getCurrencies().subscribe(currencies => {
      this.currencies = currencies;
    });
    
    // Load transfer types
    this.transferService.getTransferTypes().subscribe(types => {
      this.transferTypes = types;
    });
    
    // Load recurring frequencies
    this.transferService.getRecurringFrequencies().subscribe(frequencies => {
      this.recurringFrequencies = frequencies;
    });
  }
  
  onSubmitTransfer(): void {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }
    
    this.isSubmitting = true;
    const formData = this.transferForm.value;
    
    // Prepare transfer data
    const transferData: TransferFormData = {
      senderAccountId: formData.senderAccountId,
      recipientAccountNumber: formData.recipientAccountNumber,
      recipientName: formData.recipientName,
      recipientBankCode: formData.transferType === 'international' ? formData.recipientBankCode : undefined,
      amount: formData.amount,
      currency: formData.currency,
      reason: formData.reason,
      scheduledDate: formData.isScheduled ? formData.scheduledDate : undefined,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
      type: formData.transferType
    };
    
    this.transferService.createTransfer(transferData).subscribe({
      next: (transfer) => {
        this.isSubmitting = false;
        this.showSuccess = true;
        
        // Reset form and reload transfers
        this.transferForm.reset({
          senderAccountId: this.selectedAccount?.id,
          transferType: 'domestic',
          currency: this.selectedAccount?.currency || 'MAD',
          isScheduled: false,
          isRecurring: false,
          recurringFrequency: 'monthly'
        });
        
        // Switch to history tab after success
        setTimeout(() => {
          this.currentTab = 'history';
          this.showSuccess = false;
          this.loadTransfers(this.selectedAccount?.id || '');
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur lors de la création du virement', err);
        this.isSubmitting = false;
        this.showError = true;
        this.errorMessage = "Erreur lors de la création du virement.";
      }
    });
  }
  
  viewTransferDetails(transfer: Transfer): void {
    this.selectedTransfer = transfer;
    this.showTransferDetails = true;
  }
  
  closeTransferDetails(): void {
    this.selectedTransfer = null;
    this.showTransferDetails = false;
  }
  
  cancelTransfer(transferId?: string): void {
  if (!transferId) return;
  
  if (confirm('Êtes-vous sûr de vouloir annuler ce virement ?')) {
    this.transferService.cancelTransfer(transferId).subscribe({
      next: (success) => {
        if (success) {
          // Reload transfers
          this.loadTransfers(this.selectedAccount?.id || '');
        } else {
          this.showError = true;
          this.errorMessage = "Impossible d'annuler ce virement.";
        }
      },
      error: (err) => {
        console.error('Erreur lors de l\'annulation du virement', err);
        this.showError = true;
        this.errorMessage = "Erreur lors de l'annulation du virement.";
      }
    });
  }
}
  
  selectAccount(account: Account): void {
    this.selectedAccount = account;
    // Update form sender account and load transfers
    this.transferForm.patchValue({
      senderAccountId: account.id,
      currency: account.currency
    });
    this.loadTransfers(account.id);
  }
  
  switchTab(tab: string): void {
    this.currentTab = tab;
    if (tab === 'new') {
      // Reset any previous success/error messages
      this.showSuccess = false;
      this.showError = false;
    }
  }
  
  onTransferTypeChange(): void {
    const transferType = this.transferForm.get('transferType')?.value;
    
    // If international, require bank code
    if (transferType === 'international') {
      this.transferForm.get('recipientBankCode')?.setValidators([Validators.required]);
    } else {
      this.transferForm.get('recipientBankCode')?.clearValidators();
    }
    this.transferForm.get('recipientBankCode')?.updateValueAndValidity();
    
    // If internal, pre-set recipient to client's other accounts
    if (transferType === 'internal' && this.clientAccounts.length > 1) {
      // Find accounts other than the selected sender account
      const otherAccounts = this.clientAccounts.filter(
        acc => acc.id !== this.transferForm.get('senderAccountId')?.value
      );
      
      if (otherAccounts.length > 0) {
        const recipientAccount = otherAccounts[0];
        this.transferForm.patchValue({
          recipientAccountNumber: recipientAccount.accountNumber,
          recipientName: `${this.currentClient?.firstName} ${this.currentClient?.lastName}`,
          currency: recipientAccount.currency
        });
      }
    }
  }
  
  // Helper methods for form validation
  hasError(controlName: string, errorName: string): boolean {
    const control = this.transferForm.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }
  
  closeError(): void {
    this.showError = false;
  }
  
  // Formatting helper methods
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  }
  
  formatDate(date: Date | undefined): string {
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
  
  getTransferTypeText(type: string): string {
    switch(type) {
      case 'domestic':
        return 'National';
      case 'international':
        return 'International';
      case 'internal':
        return 'Interne';
      default:
        return type;
    }
  }
}