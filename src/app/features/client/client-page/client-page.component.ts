import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ClientService } from '../../../services/client/client.service';
import { CardService, Card, CardRequest } from '../../../services/card/card.service';
import { StripeService, StripeAccount, StripeBalance } from '../../../services/stripe/stripe.service'; // ADD THIS
import { Client } from '../../../shared/models/client.model';
import { Transaction } from '../../../shared/models/transaction';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

// Interface simplifiée pour l'affichage
interface DisplayCard {
  id: string;
  network: string;
  maskedNumber: string;
  cardholderName: string;
  expiryDate: string;
  balance: number;
  currency: string;
  cardBackground: string;
  status: string;
  type?: string;
  isContactless?: boolean;
  onlinePaymentEnabled?: boolean;
}

interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  stripeBalance?: number; // ADD THIS
  combinedBalance?: number; // ADD THIS
}

interface ClientAccount {
  id: string;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  iban: string;
}

@Component({
  selector: 'app-client-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-page.component.html',
  styleUrls: ['./client-page.component.css']
})
export class ClientPageComponent implements OnInit {
  // Données de base
  client: any = null;
  clientName: string = '';
  currentDate: Date = new Date();
  
  // États de chargement
  loading: boolean = false;
  error: string | null = null;
  
  // Données financières simplifiées
  cards: DisplayCard[] = [];
  summary: FinancialSummary = {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    stripeBalance: 0, // ADD THIS
    combinedBalance: 0 // ADD THIS
  };
  transactions: any[] = [];
  
  showAllTransactions: boolean = false;
  
  // ADD STRIPE PROPERTIES
  stripeAccount: StripeAccount | null = null;
  stripeBalance: StripeBalance | null = null;
  hasStripeAccount: boolean = false;
  
  // Propriétés pour les demandes de cartes
  showCardRequestModal = false;
  cardRequestLoading = false;
  cardRequestError: string | null = null;
  cardRequestSuccess: string | null = null;
  
  selectedCardType: 'debit' | 'credit' = 'debit';
  selectedCardNetwork: 'visa' | 'mastercard' | 'amex' = 'visa';
  requestReason = '';
  
  private apiUrl = 'http://localhost:8085/E-BANKING1/api';
  userId = 'f63a8753-6908-4130-a897-cf26f5f5d733';

  constructor(
    private http: HttpClient,
    private clientService: ClientService,
    private cardService: CardService,
    private stripeService: StripeService // ADD THIS
  ) {}

  ngOnInit(): void {
    this.loadClient();
  }

  // Méthode directe pour charger les données client
  loadClient(): void {
    this.loading = true;
    this.error = null;
    
    this.http.get(`${this.apiUrl}/clients/fe6f2c00-b906-454a-b57d-f79c8e4f9da4`)
      .pipe(
        tap((response: any) => {
          if (Array.isArray(response) && response.length > 0) {
            this.client = response[0];
          } else {
            this.client = response;
          }
          
          this.clientName = this.client.username || 'Client';
          
          let totalBalance = 0;
          if (this.client.accounts && Array.isArray(this.client.accounts)) {
            totalBalance = this.client.accounts.reduce((sum: number, account: ClientAccount) => 
              sum + (account.balance || 0), 0);
          }
          
          const estimatedMonthlyIncome = totalBalance * 0.2 || 5000;
          this.summary = {
            totalBalance: totalBalance,
            monthlyIncome: estimatedMonthlyIncome,
            monthlyExpenses: estimatedMonthlyIncome * 0.7,
            stripeBalance: 0,
            combinedBalance: totalBalance
          };
          
          // LOAD BOTH CARDS AND STRIPE DATA
          this.loadCardsByClientId();
          this.loadStripeData(); // ADD THIS
        }),
        catchError(err => {
          console.error('Erreur lors du chargement du client:', err);
          this.error = 'Impossible de charger les données client';
          this.createDemoData();
          return of(null);
        }),
        finalize(() => {
          if (this.loading) {
            this.loading = false;
          }
        })
      )
      .subscribe();
  }

  // ADD NEW METHOD TO LOAD STRIPE DATA
  loadStripeData(): void {
    if (!this.userId) {
      console.log('No client ID available for Stripe data');
      return;
    }

    console.log('Loading Stripe data for client:', this.userId);

    // Load both Stripe account and balance
    forkJoin({
      account: this.stripeService.getStripeAccountByUserId(this.userId),
      balance: this.stripeService.getUserStripeBalance(this.userId)
    }).pipe(
      tap(({ account, balance }) => {
        this.stripeAccount = account;
        this.stripeBalance = balance;
        this.hasStripeAccount = account !== null;

        console.log('Stripe data loaded:', {
          hasAccount: this.hasStripeAccount,
          accountId: account?.id,
          balance: balance
        });

        // Update summary with Stripe balance
        if (balance && balance.available && balance.available.length > 0) {
          const stripeBalanceAmount = balance.available.reduce((sum, bal) => {
            return sum + (bal.amount / 100); // Convert from cents
          }, 0);
          
          this.summary.stripeBalance = stripeBalanceAmount;
          this.summary.combinedBalance = this.summary.totalBalance + stripeBalanceAmount;
          
          console.log('Updated summary:', {
            bankBalance: this.summary.totalBalance,
            stripeBalance: this.summary.stripeBalance,
            combinedBalance: this.summary.combinedBalance
          });
        }
      }),
      catchError(error => {
        console.error('Error loading Stripe data:', error);
        this.stripeAccount = null;
        this.stripeBalance = null;
        this.hasStripeAccount = false;
        return of({ account: null, balance: null });
      })
    ).subscribe();
  }

  // ADD STRIPE UTILITY METHODS
  getStripeAccountStatus(): string {
    if (!this.stripeAccount) return 'Pas de compte Stripe';
    
    if (this.stripeService.isAccountFullySetup(this.stripeAccount)) {
      return 'Compte actif';
    } else if (this.stripeAccount.detailsSubmitted) {
      return 'En cours de vérification';
    } else {
      return 'Configuration incomplète';
    }
  }

  getStripeAccountStatusClass(): string {
    if (!this.stripeAccount) return 'bg-gray-100 text-gray-800';
    
    if (this.stripeService.isAccountFullySetup(this.stripeAccount)) {
      return 'bg-green-100 text-green-800';
    } else if (this.stripeAccount.detailsSubmitted) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  }

  getFormattedStripeBalance(): string {
    if (!this.stripeBalance) return '0,00 EUR';
    return this.stripeService.formatBalance(this.stripeBalance);
  }


  // Add this method to your component
getCardGradient(index: number): string {
  const gradients = [
    'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)', // Blue
    'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', // Purple
    'linear-gradient(135deg, #10B981 0%, #059669 100%)', // Green
    'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', // Red
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Orange
    'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', // Indigo
  ];
  
  return gradients[index % gradients.length];
}

  getStripeBalanceInCurrency(currency: string): number {
    if (!this.stripeBalance?.available) return 0;
    
    const balance = this.stripeBalance.available.find(bal => 
      bal.currency.toUpperCase() === currency.toUpperCase()
    );
    
    return balance ? balance.amount / 100 : 0;
  }

  // Charger directement les cartes par ID de compte
  loadCardsByClientId(): void {
    if (!this.client || !this.client.accounts || !this.client.accounts.length) {
      this.loading = false;
      return;
    }
    
    const accountId = this.client.accounts[0].id;
    
    this.cardService.getCardsByAccountId(accountId)
      .pipe(
        tap((cardsResponse: Card[]) => {
          this.formatDisplayCards(cardsResponse || []);
          
          if (this.cards.length === 0) {
            this.createVirtualCard();
          }
          
          this.generateDemoTransactions();
        }),
        catchError(err => {
          console.error('Erreur lors du chargement des cartes:', err);
          this.createVirtualCard();
          this.generateDemoTransactions();
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe();
  }

  // Formater les cartes pour l'affichage
  formatDisplayCards(cardsData: Card[]): void {
    this.cards = cardsData.map(card => {
      let background;
      switch(card.network?.toLowerCase()) {
        case 'visa':
          background = 'bg-gradient-to-r from-blue-600 to-blue-800';
          break;
        case 'mastercard':
          background = 'bg-gradient-to-r from-red-500 to-orange-500';
          break;
        case 'amex':
          background = 'bg-gradient-to-r from-cyan-500 to-blue-500';
          break;
        default:
          background = 'bg-gradient-to-r from-gray-700 to-gray-900';
      }
      
      const expiryDate = card.expiryMonth && card.expiryYear 
        ? `${card.expiryMonth}/${card.expiryYear.substring(2)}` 
        : '00/00';
      
      const currency = this.client.accounts && this.client.accounts.length > 0 
        ? this.client.accounts[0].currency 
        : 'EUR';
      const balance = this.client.accounts && this.client.accounts.length > 0 
        ? this.client.accounts[0].balance 
        : 0;
      
      return {
        id: card.id,
        type: card.type,
        network: card.network,
        maskedNumber: card.maskedNumber,
        cardholderName: card.cardholderName || this.clientName,
        expiryDate: expiryDate,
        status: card.status,
        isContactless: card.isContactless,
        onlinePaymentEnabled: card.onlinePaymentEnabled,
        balance: balance,
        currency: currency,
        cardBackground: background
      };
    });
  }

  // Créer des données de démo en cas d'erreur
  createDemoData(): void {
    this.client = {
      id: 'demo-client',
      username: 'Client Démo',
      email: 'demo@example.com',
      accounts: [{
        id: 'demo-account',
        accountNumber: '1234567890',
        balance: 25000,
        availableBalance: 25000,
        currency: 'MAD',
        status: 'active',
        iban: 'MA1234567890'
      }]
    };
    
    this.clientName = 'Client Démo';
    
    this.summary = {
      totalBalance: 25000,
      monthlyIncome: 12000,
      monthlyExpenses: 8400,
      stripeBalance: 0,
      combinedBalance: 25000
    };
    
    this.createVirtualCard();
    this.generateDemoTransactions();
  }

  // Créer une carte virtuelle
  createVirtualCard(): void {
    const currency = this.client.accounts && this.client.accounts.length > 0 
      ? this.client.accounts[0].currency 
      : 'EUR';
    
    this.cards = [{
      id: 'virtual',
      type: 'debit',
      network: 'visa',
      maskedNumber: '**** **** **** 1234',
      cardholderName: this.clientName,
      expiryDate: '12/25',
      status: 'active',
      cardBackground: 'bg-gradient-to-r from-blue-600 to-blue-800',
      isContactless: true,
      onlinePaymentEnabled: true,
      balance: this.summary.totalBalance,
      currency: currency
    }];
  }

  // Générer des transactions fictives
  generateDemoTransactions(): void {
    const currency = this.client.accounts && this.client.accounts.length > 0 ? 
      this.client.accounts[0].currency : 'EUR';
    
    this.transactions = [
      {
        id: 'txn1',
        name: 'Virement entrant',
        type: 'deposit',
        date: new Date(2023, 4, 15),
        amount: 1250,
        currency: currency,
        status: 'completed',
        merchant: this.clientName,
        icon: 'exchange-alt'
      },
      {
        id: 'txn2',
        name: 'Salaire',
        type: 'deposit',
        date: new Date(2023, 4, 5),
        amount: this.summary.monthlyIncome,
        currency: currency,
        status: 'completed',
        merchant: 'ACME Corporation',
        icon: 'money-bill'
      },
      {
        id: 'txn3',
        name: 'Carrefour',
        type: 'payment',
        date: new Date(2023, 4, 20),
        amount: -120.50,
        currency: currency,
        status: 'pending',
        merchant: 'Carrefour',
        icon: 'shopping-cart'
      },
      {
        id: 'txn4',
        name: 'Netflix',
        type: 'payment',
        date: new Date(2023, 4, 19),
        amount: -45.99,
        currency: currency,
        status: 'completed',
        merchant: 'Netflix',
        icon: 'film'
      },
      {
        id: 'txn5',
        name: 'Loyer',
        type: 'payment',
        date: new Date(2023, 4, 18),
        amount: -255.30,
        currency: currency,
        status: 'completed',
        merchant: 'Loyer',
        icon: 'home'
      }
    ];
    
    this.transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // ===== MÉTHODES POUR LES DEMANDES DE CARTES =====

  /**
   * Ouvrir le modal de demande de carte
   */
  openCardRequestModal(): void {
    this.showCardRequestModal = true;
    this.cardRequestError = null;
    this.cardRequestSuccess = null;
    this.resetCardRequestForm();
  }

  /**
   * Fermer le modal de demande de carte
   */
  closeCardRequestModal(): void {
    this.showCardRequestModal = false;
    this.resetCardRequestForm();
  }

  /**
   * Réinitialiser le formulaire de demande
   */
  resetCardRequestForm(): void {
    this.selectedCardType = 'debit';
    this.selectedCardNetwork = 'visa';
    this.requestReason = '';
    this.cardRequestError = null;
    this.cardRequestSuccess = null;
  }

  /**
   * Soumettre la demande de carte
   */
  submitCardRequest(): void {
    if (!this.requestReason.trim()) {
      this.cardRequestError = 'Veuillez indiquer la raison de votre demande';
      return;
    }

    if (!this.client || !this.client.accounts || this.client.accounts.length === 0) {
      this.cardRequestError = 'Impossible de traiter la demande - compte non trouvé';
      return;
    }

    this.cardRequestLoading = true;
    this.cardRequestError = null;

    const request: Omit<CardRequest, 'id' | 'status' | 'requestDate'> = {
      clientId: this.client.id || 'demo-client',
      accountId: this.client.accounts[0].id,
      cardType: this.selectedCardType,
      cardNetwork: this.selectedCardNetwork,
      requestReason: this.requestReason.trim(),
      clientName: this.clientName,
      clientEmail: this.client.email || 'client@example.com'
    };

    this.cardService.createCardRequest(request).subscribe({
      next: (response) => {
        console.log('Card request submitted successfully:', response);
        this.cardRequestLoading = false;
        this.cardRequestSuccess = 'Demande de carte envoyée avec succès ! Un agent vous contactera sous 24-48h.';
        
        // Fermer le modal après 2 secondes
        setTimeout(() => {
          this.closeCardRequestModal();
        }, 2000);
      },
      error: (error) => {
        console.error('Error submitting card request:', error);
        this.cardRequestError = 'Erreur lors de l\'envoi de la demande. Veuillez réessayer.';
        this.cardRequestLoading = false;
      }
    });
  }

  /**
   * Obtenir l'icône pour le type de carte
   */
  getCardTypeIcon(type: string): string {
    switch (type) {
      case 'credit': return 'fa-credit-card';
      case 'debit': 
      default: return 'fa-money-check-alt';
    }
  }

  /**
   * Obtenir le logo du réseau de carte
   */
  getCardNetworkLogo(network: string): string {
    switch (network) {
      case 'visa': return 'fa-cc-visa';
      case 'mastercard': return 'fa-cc-mastercard';
      case 'amex': return 'fa-cc-amex';
      default: return 'fa-credit-card';
    }
  }

  // ===== UTILITAIRES =====
  
  formatCurrency(amount: number, currency: string = 'MAD'): string {
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'blocked': 'bg-red-100 text-red-800'
    };
    
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  toggleAllTransactions(): void {
    this.showAllTransactions = !this.showAllTransactions;
  }
  
  refreshData(): void {
    this.loadClient();
  }

  clearMessages(): void {
    this.cardRequestError = null;
    this.cardRequestSuccess = null;
  }
}