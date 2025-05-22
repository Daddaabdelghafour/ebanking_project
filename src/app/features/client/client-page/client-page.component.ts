import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientService } from '../../../services/client/client.service';
import { CardService } from '../../../services/card/card.service';
import { Client } from '../../../shared/models/client.model';
import { Account } from '../../../shared/models/account.model';
import { Card } from '../../../shared/models/card.model';
import { Transaction } from '../../../shared/models/transaction';
import { catchError, finalize, tap, switchMap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

// Define clear types for display data
interface DisplayCard {
  id: string;
  network: 'visa' | 'mastercard' | 'amex' | 'other';
  maskedNumber: string;
  cardholderName: string;
  expiryDate: string;
  balance: number;
  currency: string;
  cardBackground: string;
  status: 'active' | 'inactive' | 'blocked' | 'expired';
  accountId: string;
}

interface FinancialSummary {
  totalBalance: number;
  totalBalanceChange: number;
  monthlyIncome: number;
  monthlyIncomeChange: number;
  monthlyExpenses: number;
  monthlyExpensesChange: number;
}

@Component({
  selector: 'app-client-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-page.component.html',
  styleUrls: ['./client-page.component.css']
})
export class ClientPageComponent implements OnInit {
  // Core client data
  currentClient: Client | null = null;
  currentName: string = '';
  currentDate: Date = new Date();
  
  // Loading and error states
  isLoading: boolean = true;
  error: string | null = null;
  
  // Financial data, all properly typed
  clientCards: Card[] = [];
  displayCards: DisplayCard[] = [];
  accounts: Account[] = [];
  financialSummary: FinancialSummary = {
    totalBalance: 0,
    totalBalanceChange: 0,
    monthlyIncome: 0,
    monthlyIncomeChange: 0,
    monthlyExpenses: 0,
    monthlyExpensesChange: 0
  };
  transactions: Transaction[] = [];
  
  // Only show recent transactions by default
  showAllTransactions: boolean = false;
  
  constructor(
    private clientService: ClientService,
    private cardService: CardService
  ) {}

  ngOnInit(): void {
    this.loadClientData();
  }

  loadClientData(): void {
    this.isLoading = true;
    this.error = null;
    
    // Utilise directement le client de test défini dans le service
    this.clientService.getClientDashboard().pipe(
      tap(dashboard => {
        if (dashboard && dashboard.client) {
          this.currentClient = dashboard.client;
          this.currentName = `${dashboard.client.firstName} ${dashboard.client.lastName}`;
          
          // Charger les comptes depuis le tableau de bord
          this.accounts = dashboard.accounts || [];
          
          // Mettre à jour les données financières
          this.financialSummary = dashboard.financialSummary || {
            totalBalance: dashboard.client.balance || 0,
            totalBalanceChange: 0,
            monthlyIncome: dashboard.client.income || 0,
            monthlyIncomeChange: 0,
            monthlyExpenses: (dashboard.client.income || 0) * 0.7,
            monthlyExpensesChange: 0
          };
        } else {
          this.error = "Client non trouvé";
        }
      }),
      catchError(err => {
        this.error = "Erreur lors du chargement des données client";
        console.error(err);
        return of(null);
      }),
      finalize(() => {
        // Maintenant, chargeons les cartes
        if (this.currentClient) {
          this.loadClientCards();
        } else {
          this.isLoading = false;
        }
      })
    ).subscribe();
  }

  loadClientCards(): void {
    // Récupérer les cartes pour chaque compte du client
    if (!this.accounts || this.accounts.length === 0) {
      this.isLoading = false;
      return;
    }

    const cardRequests = this.accounts.map(account => 
      this.cardService.getCardsByCardholderName(this.currentName)
    );
    
    forkJoin(cardRequests).pipe(
      tap(cardArrays => {
        // Fusionner tous les tableaux de cartes
        this.clientCards = cardArrays.flat();
        this.prepareDisplayCards();
        
        // Générer des transactions de test
        this.generateTransactions();
      }),
      catchError(err => {
        this.error = "Erreur lors du chargement des cartes";
        console.error(err);
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  prepareDisplayCards(): void {
    this.displayCards = [];
    
    // Convert cards to display format
    this.clientCards.forEach((card, index) => {
      // Find the associated account
      const linkedAccount = this.accounts.find(acc => acc.id === card.accountId);
      
      if (card.network) {
        this.displayCards.push({
          id: card.id,
          network: card.network as any,
          maskedNumber: card.maskedNumber,
          cardholderName: card.cardholderName,
          expiryDate: this.cardService.getExpiryDate(card.expiryMonth, card.expiryYear),
          balance: linkedAccount?.balance || 0,
          currency: linkedAccount?.currency || 'MAD',
          status: card.status as any,
          accountId: card.accountId,
          cardBackground: this.getCardBackground(index, card.network)
        });
      }
    });
    
    // Create a virtual card if none exists
    if (this.displayCards.length === 0 && this.currentClient) {
      // Si le client a au moins un compte, utiliser les données du premier compte
      const primaryAccount = this.accounts.length > 0 ? 
        this.accounts.find(acc => acc.isPrimary) || this.accounts[0] : null;
      
      this.displayCards.push({
        id: 'virtual',
        network: 'visa',
        maskedNumber: '4539 **** **** 5678',
        cardholderName: `${this.currentClient.firstName} ${this.currentClient.lastName}`,
        expiryDate: '12/25',
        balance: primaryAccount?.balance || this.currentClient.balance || 0,
        currency: primaryAccount?.currency || this.currentClient.currency || 'MAD',
        status: 'active',
        accountId: primaryAccount?.id || 'main',
        cardBackground: 'bg-gradient-to-r from-blue-500 to-blue-700'
      });
    }
  }

  getCardBackground(index: number, network: string): string {
    // Simplified card background logic
    if (network === 'visa') {
      return 'bg-gradient-to-r from-blue-500 to-blue-700';
    } else if (network === 'mastercard') {
      return 'bg-gradient-to-r from-red-500 to-orange-500';
    } else {
      return 'bg-gradient-to-r from-gray-700 to-gray-900';
    }
  }

  generateTransactions(): void {
    // Create sample transactions for demonstration
    this.transactions = [];
    
    // Use the first account or a default
    const mainAccount = this.accounts.find(acc => acc.isPrimary) || 
                       (this.accounts.length > 0 ? this.accounts[0] : null);
    const mainAccountId = mainAccount?.id || 'main';
    const mainCurrency = mainAccount?.currency || this.currentClient?.currency || 'MAD';
    
    // Add deposits
    this.addTransaction('txn1', mainAccountId, 'Virement entrant', 'deposit', 
      new Date(2023, 4, 15), 'transfer', 1250.00, mainCurrency, 
      'completed', 4500.00, this.currentName);
    
    this.addTransaction('txn2', mainAccountId, 'Salaire', 'deposit', 
      new Date(2023, 4, 5), 'finance', this.currentClient?.income || 3500.00, 
      mainCurrency, 'completed', 3250.00, 'ACME Corporation');
    
    // Add payments - simplified
    const payments = [
      { name: 'Carrefour', amount: 120.50, category: 'shopping', status: 'pending' },
      { name: 'Netflix', amount: 45.99, category: 'entertainment', status: 'completed' },
      { name: 'Amazon', amount: 67.80, category: 'shopping', status: 'completed' },
      { name: 'Loyer', amount: 255.30, category: 'housing', status: 'completed' },
      { name: 'Restaurant', amount: 22.50, category: 'food', status: 'failed' }
    ];
    
    let balance = 3250.00;
    
    payments.forEach((payment, i) => {
      balance -= payment.amount;
      
      this.addTransaction(
        `txn${i+3}`, 
        mainAccountId, 
        payment.name, 
        'payment', 
        new Date(2023, 4, 20 - i), 
        payment.category, 
        -payment.amount, 
        mainCurrency, 
        payment.status,
        balance,
        payment.name
      );
    });
    
    // Sort transactions by date (most recent first)
    this.transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  // Helper method to create transactions
  private addTransaction(
    id: string, 
    accountId: string, 
    name: string, 
    type: string, 
    date: Date, 
    category: string, 
    amount: number, 
    currency: string, 
    status: string, 
    balanceAfter: number,
    merchant: string
  ): void {
    this.transactions.push({
      id: id,
      accountId: accountId,
      name: name,
      type: type as any,
      date: date,
      category: category as any,
      amount: amount,
      currency: currency,
      status: status as any,
      icon: this.getCategoryIcon(category),
      merchantName: merchant,
      balanceAfterTransaction: balanceAfter,
      reference: `REF-${Date.now().toString().substring(5)}-${id}`
    });
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'shopping': 'shopping-cart',
      'entertainment': 'film',
      'housing': 'home',
      'food': 'utensils',
      'transfer': 'exchange-alt',
      'finance': 'money-bill'
    };
    
    return icons[category] || 'tag';
  }
  
  // Formatting helpers
  formatCurrency(amount: number, currency: string = 'MAD'): string {
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getTransactionStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  // UI helpers
  toggleAllTransactions(): void {
    this.showAllTransactions = !this.showAllTransactions;
  }
  
  // Simplified export function
  exportData(): void {
    console.log('Export requested');
    alert('Export functionality will be available in a future update.');
  }
}