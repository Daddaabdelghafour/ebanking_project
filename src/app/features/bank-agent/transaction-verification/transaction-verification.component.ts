import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-transaction-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './transaction-verification.component.html',
  styleUrls: ['./transaction-verification.component.css']
})
export class TransactionVerificationComponent implements OnInit {
  filterForm: FormGroup;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  selectedTransaction: Transaction | null = null;
  showDetailsModal = false;
  
  // Filter options
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
    { value: 'deposit', label: 'Dépôt' }
  ];

  constructor(private fb: FormBuilder) {
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
    this.loadSampleTransactions();
    this.applyFilters(); // Initialize with all transactions
    
    // Subscribe to form changes to filter in real time
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadSampleTransactions() {
    this.transactions = [
      {
        id: 'TRX-12345',
        date: new Date(2023, 4, 15, 10, 23),
        amount: 1500.00,
        currency: 'MAD',
        type: 'transfer',
        typeLabel: 'Virement',
        status: 'success',
        clientName: 'Ahmed Benjelloun',
        clientId: '1',
        accountNumber: '**** 4532',
        recipient: 'Fatima El Alaoui',
        recipientAccount: '**** 7890',
        description: 'Virement mensuel',
        reference: 'REF7823',
        verifier: 'Auto',
        flaggedReason: null
      },
      {
        id: 'TRX-12346',
        date: new Date(2023, 4, 15, 14, 45),
        amount: 15000.00,
        currency: 'MAD',
        type: 'withdrawal',
        typeLabel: 'Retrait',
        status: 'flagged',
        clientName: 'Karim Naciri',
        clientId: '3',
        accountNumber: '**** 6543',
        recipient: null,
        recipientAccount: null,
        description: 'Retrait agence',
        reference: 'REF7824',
        verifier: null,
        flaggedReason: 'Montant inhabituel'
      },
      {
        id: 'TRX-12347',
        date: new Date(2023, 4, 14, 9, 10),
        amount: 750.00,
        currency: 'MAD',
        type: 'payment',
        typeLabel: 'Paiement',
        status: 'success',
        clientName: 'Fatima El Alaoui',
        clientId: '2',
        accountNumber: '**** 7890',
        recipient: 'Maroc Telecom',
        recipientAccount: '**** 1111',
        description: 'Facture téléphone',
        reference: 'REF7825',
        verifier: 'Auto',
        flaggedReason: null
      },
      {
        id: 'TRX-12348',
        date: new Date(2023, 4, 14, 16, 30),
        amount: 5000.00,
        currency: 'MAD',
        type: 'transfer',
        typeLabel: 'Virement',
        status: 'pending',
        clientName: 'Ahmed Benjelloun',
        clientId: '1',
        accountNumber: '**** 4532',
        recipient: 'Société XYZ',
        recipientAccount: '**** 8888',
        description: 'Paiement fournisseur',
        reference: 'REF7826',
        verifier: null,
        flaggedReason: null
      },
      {
        id: 'TRX-12349',
        date: new Date(2023, 4, 13, 11, 20),
        amount: 200.00,
        currency: 'MAD',
        type: 'deposit',
        typeLabel: 'Dépôt',
        status: 'success',
        clientName: 'Karim Naciri',
        clientId: '3',
        accountNumber: '**** 6543',
        recipient: null,
        recipientAccount: null,
        description: 'Dépôt espèces',
        reference: 'REF7827',
        verifier: 'Sarah Martin',
        flaggedReason: null
      },
      {
        id: 'TRX-12350',
        date: new Date(2023, 4, 13, 15, 40),
        amount: 1200.00,
        currency: 'MAD',
        type: 'payment',
        typeLabel: 'Paiement',
        status: 'failed',
        clientName: 'Fatima El Alaoui',
        clientId: '2',
        accountNumber: '**** 7890',
        recipient: 'REDAL',
        recipientAccount: '**** 2222',
        description: 'Facture électricité',
        reference: 'REF7828',
        verifier: 'System',
        flaggedReason: 'Solde insuffisant'
      }
    ];
  }

  applyFilters() {
    const filters = this.filterForm.value;
    
    this.filteredTransactions = this.transactions.filter(transaction => {
      // Search term filter (check ID, client name, and description)
      if (filters.searchTerm && !this.matchesSearchTerm(transaction, filters.searchTerm)) {
        return false;
      }
      
      // Date range filter
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
      
      // Status filter
      if (filters.status !== 'all' && transaction.status !== filters.status) {
        return false;
      }
      
      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }
      
      // Amount range filter
      if (filters.amountMin && transaction.amount < parseFloat(filters.amountMin)) {
        return false;
      }
      if (filters.amountMax && transaction.amount > parseFloat(filters.amountMax)) {
        return false;
      }
      
      return true;
    });
  }

  matchesSearchTerm(transaction: Transaction, term: string): boolean {
    term = term.toLowerCase();
    return !!(
      transaction.id.toLowerCase().includes(term) ||
      transaction.clientName.toLowerCase().includes(term) ||
      (transaction.description && transaction.description.toLowerCase().includes(term)) ||
      (transaction.reference && transaction.reference.toLowerCase().includes(term))
    );
  }

  resetFilters() {
    this.filterForm.reset({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      status: 'all',
      type: 'all',
      amountMin: '',
      amountMax: ''
    });
    this.applyFilters();
  }

  viewTransactionDetails(transaction: Transaction) {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
  }

  approveTransaction(id: string) {
    const transaction = this.transactions.find(t => t.id === id);
    if (transaction) {
      transaction.status = 'success';
      transaction.verifier = 'Sarah Martin'; // Current agent
      transaction.flaggedReason = null;
    }
    this.closeDetailsModal();
  }

  rejectTransaction(id: string) {
    const transaction = this.transactions.find(t => t.id === id);
    if (transaction) {
      transaction.status = 'failed';
      transaction.verifier = 'Sarah Martin'; // Current agent
      transaction.flaggedReason = 'Rejeté par l\'agent';
    }
    this.closeDetailsModal();
  }

  flagTransaction(id: string, reason: string) {
    const transaction = this.transactions.find(t => t.id === id);
    if (transaction) {
      transaction.status = 'flagged';
      transaction.flaggedReason = reason || 'Signalé pour vérification';
    }
    this.closeDetailsModal();
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
      case 'success': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'flagged': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'success': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'flagged': return 'Signalé';
      case 'failed': return 'Échoué';
      default: return status;
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'transfer': return 'fa-solid fa-arrow-right-arrow-left';
      case 'payment': return 'fa-solid fa-credit-card';
      case 'withdrawal': return 'fa-solid fa-arrow-up-from-bracket';
      case 'deposit': return 'fa-solid fa-arrow-down-to-bracket';
      default: return 'fa-solid fa-money-bill-transfer';
    }
  }

  exportData() {
    alert('Exportation des données...');
    // Implement export functionality
  }
}

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  type: string;
  typeLabel: string;
  status: string;
  clientName: string;
  clientId: string;
  accountNumber: string;
  recipient: string | null;
  recipientAccount: string | null;
  description: string | null;
  reference: string | null;
  verifier: string | null;
  flaggedReason: string | null;
}