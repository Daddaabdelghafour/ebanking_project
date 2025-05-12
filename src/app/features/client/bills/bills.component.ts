import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BillService } from '../../../services/bill/bill.service';
import { Bill, BillFormData } from '../../../shared/models/bill.model';
import { AccountService } from '../../../services/account/account.service';
import { Account } from '../../../shared/models/client.model';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.css']
})
export class BillsComponent implements OnInit {
  // ID client fixe pour les tests
  clientId: string = 'client1';
  
  // Factures et filtres
  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  filterStatus: string = 'all';
  searchTerm: string = '';
  
  // État du chargement
  isLoading: boolean = true;
  
  // Pour le paiement de facture
  selectedBill: Bill | null = null;
  paymentAmount: number = 0;
  selectedAccountId: string = '';
  accounts: Account[] = [];
  isPaying: boolean = false;
  paymentSuccessful: boolean = false;
  
  // Pour l'ajout d'une nouvelle facture
  showAddBillForm: boolean = false;
  newBill: BillFormData = {
    providerId: '',
    referenceNumber: '',
    amount: 0,
    currency: 'MAD',
    dueDate: new Date(),
    isRecurring: false,
    accountId: '',
    notificationEnabled: true,
    billCategory: ''
  };
  
  // Catégories de factures disponibles
  billCategories = [
    { id: 'telecom', name: 'Télécommunications' },
    { id: 'utility', name: 'Eau et électricité' },
    { id: 'streaming', name: 'Streaming et abonnements' },
    { id: 'insurance', name: 'Assurance' },
    { id: 'tax', name: 'Impôts et taxes' },
    { id: 'other', name: 'Autres' }
  ];
  
  // Fréquences de récurrence disponibles
  recurringFrequencies = [
    { id: 'monthly', name: 'Mensuel' },
    { id: 'quarterly', name: 'Trimestriel' },
    { id: 'biannual', name: 'Semestriel' },
    { id: 'annual', name: 'Annuel' }
  ];
  
  // Fournisseurs de services
  providers: any[] = [];
  
  constructor(
    private billService: BillService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    // Charger les comptes du client
    this.accountService.getClientAccounts(this.clientId).subscribe(accounts => {
      this.accounts = accounts;
      if (accounts.length > 0) {
        this.selectedAccountId = accounts[0].id;
        this.newBill.accountId = accounts[0].id;
      }
      
      // Charger les factures du client
      this.billService.getClientBills(this.clientId).subscribe(bills => {
        this.bills = bills;
        this.applyFilters();
        this.isLoading = false;
      });
    });
    
    // Charger les fournisseurs de services
    this.billService.getRechargeProviders().subscribe(providers => {
      this.providers = providers;
    });
  }

  applyFilters(): void {
    this.filteredBills = this.bills.filter(bill => {
      // Filtre par statut
      if (this.filterStatus !== 'all' && bill.status !== this.filterStatus) {
        return false;
      }
      
      // Filtre par texte de recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return (
          bill.providerName.toLowerCase().includes(searchLower) ||
          bill.referenceNumber.toLowerCase().includes(searchLower) ||
          bill.billCategory.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }

  openPaymentModal(bill: Bill): void {
    this.selectedBill = bill;
    this.paymentAmount = bill.amount - bill.paidAmount;
    this.paymentSuccessful = false;
  }

  closePaymentModal(): void {
    this.selectedBill = null;
    this.paymentSuccessful = false;
  }

  payBill(): void {
    if (!this.selectedBill || !this.selectedAccountId || this.paymentAmount <= 0) {
      return;
    }
    
    this.isPaying = true;
    this.billService.payBill(this.selectedBill.id, {
      accountId: this.selectedAccountId,
      amount: this.paymentAmount
    }).subscribe({
      next: (payment) => {
        this.isPaying = false;
        this.paymentSuccessful = true;
        
        // Mettre à jour la liste des factures
        this.loadData();
        
        setTimeout(() => {
          this.closePaymentModal();
        }, 3000);
      },
      error: (err) => {
        this.isPaying = false;
        console.error('Erreur lors du paiement :', err);
        // Gérer l'erreur (afficher un message, etc.)
      }
    });
  }

  toggleAddBillForm(): void {
    this.showAddBillForm = !this.showAddBillForm;
    
    if (!this.showAddBillForm) {
      // Réinitialiser le formulaire
      this.resetNewBillForm();
    }
  }

  resetNewBillForm(): void {
    this.newBill = {
      providerId: '',
      referenceNumber: '',
      amount: 0,
      currency: 'MAD',
      dueDate: new Date(),
      isRecurring: false,
      accountId: this.accounts.length > 0 ? this.accounts[0].id : '',
      notificationEnabled: true,
      billCategory: ''
    };
  }

  addBill(): void {
    if (!this.validateBillForm()) {
      return;
    }
    
    this.isLoading = true;
    this.billService.addBill(this.newBill, this.clientId).subscribe({
      next: (bill) => {
        this.isLoading = false;
        this.bills.push(bill);
        this.applyFilters();
        this.toggleAddBillForm();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur lors de l\'ajout de la facture :', err);
        // Gérer l'erreur (afficher un message, etc.)
      }
    });
  }

  validateBillForm(): boolean {
    // Vérification basique des champs obligatoires
    return (
      !!this.newBill.providerId &&
      !!this.newBill.referenceNumber &&
      this.newBill.amount > 0 &&
      !!this.newBill.billCategory &&
      !!this.newBill.accountId
    );
  }

  getBillStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'partial': return 'Partiellement payé';
      case 'paid': return 'Payé';
      case 'overdue': return 'En retard';
      case 'scheduled': return 'Programmé';
      default: return status;
    }
  }

  getBillStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}