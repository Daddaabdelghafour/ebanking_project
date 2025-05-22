import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BillService } from '../../../services/bill/bill.service';
import { ClientService } from '../../../services/client/client.service';
import { Bill, BillFormData } from '../../../shared/models/bill.model';
import { AccountService } from '../../../services/account/account.service';
import { Account } from '../../../shared/models/account.model';
import { catchError, finalize, tap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.css']
})
export class BillsComponent implements OnInit {
  // Données client
  clientId: string = '';
  
  // Factures et filtres
  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  filterStatus: string = 'all';
  searchTerm: string = '';
  
  // État du chargement
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Pour le paiement de facture
  selectedBill: Bill | null = null;
  paymentAmount: number = 0;
  selectedAccountId: string = '';
  accounts: Account[] = [];
  isPaying: boolean = false;
  paymentSuccessful: boolean = false;
  paymentError: boolean = false;
  
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
    private accountService: AccountService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.loadCurrentClient();
  }

  /**
   * Charge le client actuel depuis le service client
   */
  loadCurrentClient(): void {
    this.isLoading = true;
    this.hasError = false;
    
    this.clientService.getCurrentClient().pipe(
      tap(client => {
        if (client) {
          this.clientId = client.id;
          this.loadClientData();
        } else {
          this.setError("Impossible de charger les informations client");
        }
      }),
      catchError(error => {
        console.error('Erreur lors du chargement du client', error);
        this.setError("Erreur lors du chargement du client");
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Charge les données du client (comptes et factures)
   */
  loadClientData(): void {
    if (!this.clientId) {
      this.setError("ID client non disponible");
      return;
    }
    
    this.isLoading = true;
    
    // Chargement des comptes du client
    this.clientService.getClientAccounts(this.clientId).pipe(
      tap(accounts => {
        this.accounts = accounts;
        if (accounts.length > 0) {
          // Privilégier le compte principal si disponible
          const primaryAccount = accounts.find(acc => acc.isPrimary);
          this.selectedAccountId = primaryAccount ? primaryAccount.id : accounts[0].id;
          this.newBill.accountId = this.selectedAccountId;
        }
      }),
      switchMap(() => this.billService.getClientBills(this.clientId)),
      tap(bills => {
        this.bills = bills;
        this.applyFilters();
      }),
      catchError(error => {
        console.error('Erreur lors du chargement des données client', error);
        this.setError("Erreur lors du chargement des données");
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
    
    // Chargement des fournisseurs de services
    this.billService.getRechargeProviders().pipe(
      tap(providers => {
        this.providers = providers;
      }),
      catchError(() => {
        // Une erreur ici n'est pas critique, on peut continuer
        console.warn('Impossible de charger la liste des fournisseurs');
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Définit un message d'erreur et change l'état
   */
  setError(message: string): void {
    this.errorMessage = message;
    this.hasError = true;
    this.isLoading = false;
  }

  /**
   * Applique les filtres sur les factures
   */
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
          (bill.providerName?.toLowerCase().includes(searchLower) || false) ||
          (bill.referenceNumber?.toLowerCase().includes(searchLower) || false) ||
          (bill.billCategory?.toLowerCase().includes(searchLower) || false)
        );
      }
      
      return true;
    });
  }

  /**
   * Ouvre le modal de paiement pour une facture
   */
  openPaymentModal(bill: Bill): void {
    this.selectedBill = bill;
    this.paymentAmount = bill.amount - (bill.paidAmount || 0);
    this.paymentSuccessful = false;
    this.paymentError = false;
  }

  /**
   * Ferme le modal de paiement
   */
  closePaymentModal(): void {
    this.selectedBill = null;
    this.paymentSuccessful = false;
    this.paymentError = false;
  }

  /**
   * Effectue le paiement d'une facture
   */
  payBill(): void {
    if (!this.selectedBill || !this.selectedAccountId || this.paymentAmount <= 0) {
      this.paymentError = true;
      return;
    }
    
    this.isPaying = true;
    this.paymentError = false;
    
    this.billService.payBill(this.selectedBill.id, {
      accountId: this.selectedAccountId,
      amount: this.paymentAmount
    }).pipe(
      tap(() => {
        this.paymentSuccessful = true;
        
        // Mettre à jour la liste des factures
        setTimeout(() => {
          this.loadClientData();
          this.closePaymentModal();
        }, 2000);
      }),
      catchError(error => {
        console.error('Erreur lors du paiement', error);
        this.paymentError = true;
        return of(null);
      }),
      finalize(() => {
        this.isPaying = false;
      })
    ).subscribe();
  }

  /**
   * Affiche ou masque le formulaire d'ajout de facture
   */
  toggleAddBillForm(): void {
    this.showAddBillForm = !this.showAddBillForm;
    
    if (!this.showAddBillForm) {
      this.resetNewBillForm();
    }
  }

  /**
   * Réinitialise le formulaire d'ajout de facture
   */
  resetNewBillForm(): void {
    this.newBill = {
      providerId: '',
      referenceNumber: '',
      amount: 0,
      currency: 'MAD',
      dueDate: new Date(),
      isRecurring: false,
      accountId: this.selectedAccountId || (this.accounts.length > 0 ? this.accounts[0].id : ''),
      notificationEnabled: true,
      billCategory: ''
    };
  }

  /**
   * Ajoute une nouvelle facture
   */
  addBill(): void {
    if (!this.validateBillForm()) {
      this.setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    this.isLoading = true;
    this.hasError = false;
    
    // Formatage de la date si nécessaire
    const formattedBill = { ...this.newBill };
    if (formattedBill.dueDate instanceof Date) {
      formattedBill.dueDate = formattedBill.dueDate;
    }
    
    this.billService.addBill(formattedBill, this.clientId).pipe(
      tap(bill => {
        // Ajouter la nouvelle facture et réappliquer les filtres
        this.bills.push(bill);
        this.applyFilters();
        this.toggleAddBillForm();
      }),
      catchError(error => {
        console.error('Erreur lors de l\'ajout de la facture', error);
        this.setError("Impossible d'ajouter la facture");
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  /**
   * Valide le formulaire d'ajout de facture
   */
  validateBillForm(): boolean {
    return (
      !!this.newBill.providerId &&
      !!this.newBill.referenceNumber &&
      this.newBill.amount > 0 &&
      !!this.newBill.billCategory &&
      !!this.newBill.accountId
    );
  }

  /**
   * Réinitialise les erreurs
   */
  closeError(): void {
    this.hasError = false;
    this.errorMessage = '';
  }

  /**
   * Obtient le libellé du statut d'une facture
   */
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

  /**
   * Obtient la classe CSS pour le style d'un statut
   */
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

  /**
   * Formate une date en format local
   */
  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  /**
   * Formate un montant en devise
   */
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currency || 'MAD'
    }).format(amount || 0);
  }
}