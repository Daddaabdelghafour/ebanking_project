import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TransactionService } from '../../../services/transaction/transaction.service';
import { TransactionVerification } from '../../../shared/models/transactionVerification';
@Component({
  selector: 'app-transaction-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './transaction-verification.component.html',
  styleUrls: ['./transaction-verification.component.css']
})
export class TransactionVerificationComponent implements OnInit {
  filterForm: FormGroup;
  transactions: TransactionVerification[] = [];
  filteredTransactions: TransactionVerification[] = [];
  selectedTransaction: TransactionVerification | null = null;
  showDetailsModal = false;
  isLoading = false;
  errorMessage = '';
  verificationNote = '';
  Math = Math;
  agentName = 'Agent Actuel'; // Par défaut
  
  // Options pour le filtre
  statuses = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'success', label: 'Confirmé' },
    { value: 'pending', label: 'En attente' },
    { value: 'flagged', label: 'Signalé' },
    { value: 'failed', label: 'Échoué' }
  ];
  
  transactionTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'transfer', label: 'Virement' },
    { value: 'payment', label: 'Paiement' },
    { value: 'withdrawal', label: 'Retrait' },
    { value: 'deposit', label: 'Dépôt' },
    { value: 'refund', label: 'Remboursement' }
  ];

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      dateFrom: [''],
      dateTo: [''],
      status: ['all'],
      type: ['all'],
      amountMin: [''],
      amountMax: ['']
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
    
    // Obtenir le nom de l'agent connecté
    this.getCurrentAgentName();
    
    // S'abonner aux changements de formulaire pour filtrer en temps réel
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  // Récupérer le nom de l'agent connecté (à adapter selon votre système d'authentification)
  getCurrentAgentName(): void {
  
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.transactionService.getPendingTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.filteredTransactions = [...transactions];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des transactions', err);
        this.errorMessage = 'Impossible de charger les transactions. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredTransactions = this.transactions.filter(transaction => {
      // Recherche par terme (ID, client, description, référence)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        if (!(transaction.id.toLowerCase().includes(searchTerm) ||
              transaction.clientName.toLowerCase().includes(searchTerm) ||
              (transaction.description && transaction.description.toLowerCase().includes(searchTerm)) ||
              (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm)) ||
              (transaction.recipientName && transaction.recipientName.toLowerCase().includes(searchTerm)))) {
          return false;
        }
      }
      
      // Filtre par plage de dates
      if (filters.dateFrom && new Date(transaction.date) < new Date(filters.dateFrom)) {
        return false;
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59);
        if (new Date(transaction.date) > toDate) {
          return false;
        }
      }
      
      // Filtre par statut
      if (filters.status && filters.status !== 'all' && transaction.status !== filters.status) {
        return false;
      }
      
      // Filtre par type
      if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }
      
      // Filtre par plage de montant (utiliser la valeur absolue pour comparer)
      const absAmount = Math.abs(transaction.amount);
      if (filters.amountMin && absAmount < Number(filters.amountMin)) {
        return false;
      }
      
      if (filters.amountMax && absAmount > Number(filters.amountMax)) {
        return false;
      }
      
      return true;
    });
  }

  resetFilters(): void {
    this.filterForm.reset({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      status: 'all',
      type: 'all',
      amountMin: '',
      amountMax: ''
    });
  }

  viewTransactionDetails(transaction: TransactionVerification): void {
    this.selectedTransaction = { ...transaction }; // Clone pour éviter les modifications directes
    this.verificationNote = '';
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
    this.verificationNote = '';
  }

  approveTransaction(id: string): void {
    if (!this.selectedTransaction) return;
    
    this.isLoading = true;
    
    this.transactionService.approveTransaction(id, this.agentName).subscribe({
      next: () => {
        // Mettre à jour la transaction localement (côté frontend uniquement)
        const updatedTransaction = {
          ...this.selectedTransaction!,
          status: 'success' as 'success',
          verifier: this.agentName,
          verificationDate: new Date(),
          verificationNote: this.verificationNote
        };
        
        // Mettre à jour l'interface
        this.updateLocalTransaction(id, updatedTransaction);
        
        this.closeDetailsModal();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de l\'approbation de la transaction', err);
        this.errorMessage = 'Impossible d\'approuver la transaction. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  rejectTransaction(id: string): void {
    if (!this.selectedTransaction) return;
    
    const reason = this.verificationNote || 'Rejetée par l\'agent';
    this.isLoading = true;
    
    this.transactionService.rejectTransaction(id, this.agentName, reason).subscribe({
      next: () => {
        // Mettre à jour la transaction localement (côté frontend uniquement)
        const updatedTransaction = {
          ...this.selectedTransaction!,
          status: 'failed' as 'failed',
          verifier: this.agentName,
          verificationDate: new Date(),
          verificationNote: reason
        };
        
        // Mettre à jour l'interface
        this.updateLocalTransaction(id, updatedTransaction);
        
        this.closeDetailsModal();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du rejet de la transaction', err);
        this.errorMessage = 'Impossible de rejeter la transaction. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  flagTransaction(id: string, reason: string): void {
    if (!this.selectedTransaction) return;
    
    this.isLoading = true;
    
    this.transactionService.flagTransaction(id, reason, this.agentName).subscribe({
      next: () => {
        // Mettre à jour la transaction localement (côté frontend uniquement)
        const updatedTransaction = {
          ...this.selectedTransaction!,
          status: 'flagged' as 'flagged',
          verifier: this.agentName,
          verificationDate: new Date(),
          flaggedReason: reason,
          verificationNote: this.verificationNote
        };
        
        // Mettre à jour l'interface
        this.updateLocalTransaction(id, updatedTransaction);
        
        this.closeDetailsModal();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du signalement de la transaction', err);
        this.errorMessage = 'Impossible de signaler la transaction. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  // Mise à jour locale d'une transaction (pour l'affichage uniquement)
  private updateLocalTransaction(id: string, updatedTransaction: TransactionVerification): void {
    // Mettre à jour dans le tableau principal
    const index = this.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      this.transactions[index] = updatedTransaction;
    }
    
    // Réappliquer les filtres pour mettre à jour l'affichage
    this.applyFilters();
  }

  exportData(): void {
    const csv = this.generateCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  generateCSV(): string {
    const headers = ['ID', 'Date', 'Client', 'Type', 'Montant', 'Devise', 'Statut', 'Bénéficiaire', 'Référence', 'Description'];
    const rows = this.filteredTransactions.map(t => [
      t.id,
      this.formatDateTime(t.date),
      t.clientName,
      this.getTypeLabel(t.type),
      Math.abs(t.amount).toString(),
      t.currency,
      this.getStatusLabel(t.status),
      t.recipientName || '',
      t.reference || '',
      t.description || ''
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(date: Date): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'success':
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'flagged': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'success':
      case 'completed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'flagged': return 'Signalé';
      case 'failed': return 'Échoué';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'transfer': return 'Virement';
      case 'payment': return 'Paiement';
      case 'withdrawal': return 'Retrait';
      case 'deposit': return 'Dépôt';
      case 'refund': return 'Remboursement';
      default: return type;
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'transfer': return 'fa-solid fa-arrow-right-arrow-left';
      case 'payment': return 'fa-solid fa-credit-card';
      case 'withdrawal': return 'fa-solid fa-arrow-up-from-bracket';
      case 'deposit': return 'fa-solid fa-arrow-down-to-bracket';
      case 'refund': return 'fa-solid fa-rotate-left';
      default: return 'fa-solid fa-money-bill-transfer';
    }
  }
}