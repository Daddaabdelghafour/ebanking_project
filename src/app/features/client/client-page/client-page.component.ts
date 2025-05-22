import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ClientService } from '../../../services/client/client.service';
import { CardService } from '../../../services/card/card.service';
import { Client } from '../../../shared/models/client.model';
import { Card } from '../../../shared/models/card.model';
import { Transaction } from '../../../shared/models/transaction';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

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
  imports: [CommonModule],
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
    monthlyExpenses: 0
  };
  transactions: any[] = [];
  
  showAllTransactions: boolean = false;
  
  private apiUrl = 'http://localhost:8085/E-BANKING1/api'; // Ajustez selon votre configuration
  
  constructor(
    private http: HttpClient,
    private clientService: ClientService,
    private cardService: CardService
  ) {}

  ngOnInit(): void {
    this.loadClient();
  }

  // Méthode directe pour charger les données client
  loadClient(): void {
    this.loading = true;
    this.error = null;
    
    // Appel direct à l'API pour obtenir le client
    this.http.get(`${this.apiUrl}/clients/fe6f2c00-b906-454a-b57d-f79c8e4f9da4`)
      .pipe(
        tap((response: any) => {
          // Si la réponse est un tableau, prendre le premier élément
          if (Array.isArray(response) && response.length > 0) {
            this.client = response[0];
          } else {
            this.client = response;
          }
          
          // Extraire le nom d'utilisateur puisque firstName et lastName sont null
          this.clientName = this.client.username || 'Client';
          
          // Extraire le solde total de tous les comptes
          let totalBalance = 0;
          if (this.client.accounts && Array.isArray(this.client.accounts)) {
            totalBalance = this.client.accounts.reduce((sum: number, account: ClientAccount) => 
              sum + (account.balance || 0), 0);
          }
          
          // Créer un résumé financier estimé
          // Nous n'avons pas d'income, donc on estime à partir du solde
          const estimatedMonthlyIncome = totalBalance * 0.2 || 5000;
          this.summary = {
            totalBalance: totalBalance,
            monthlyIncome: estimatedMonthlyIncome,
            monthlyExpenses: estimatedMonthlyIncome * 0.7
          };
          
          // Charger les cartes directement
          this.loadCardsByClientId();
        }),
        catchError(err => {
          console.error('Erreur lors du chargement du client:', err);
          this.error = 'Impossible de charger les données client';
          
          // Créer des données de démo
          this.createDemoData();
          return of(null);
        }),
        finalize(() => {
          // Si tout échoue, au moins s'assurer que l'interface n'est plus en chargement
          if (this.loading) {
            this.loading = false;
          }
        })
      )
      .subscribe();
  }

  // Charger directement les cartes par ID de compte
  loadCardsByClientId(): void {
    if (!this.client || !this.client.accounts || !this.client.accounts.length) {
      this.loading = false;
      return;
    }
    
    // Récupérer l'ID du premier compte disponible
    const accountId = this.client.accounts[0].id;
    
    // Appel direct pour les cartes avec l'ID du compte
    this.http.get(`${this.apiUrl}/cards/account/${accountId}`)
      .pipe(
        tap((cardsResponse: any) => {
          // Formater les cartes pour l'affichage
          this.formatDisplayCards(cardsResponse || []);
          
          // Si aucune carte n'est trouvée, en créer une virtuelle
          if (this.cards.length === 0) {
            this.createVirtualCard();
          }
          
          // Créer des transactions de test
          this.generateDemoTransactions();
        }),
        catchError(err => {
          console.error('Erreur lors du chargement des cartes:', err);
          // Créer une carte virtuelle en cas d'erreur
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
  formatDisplayCards(cardsData: any[]): void {
    this.cards = cardsData.map(card => {
      // Déterminer le style de l'arrière-plan basé sur le réseau
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
      
      // Formatage de la date d'expiration
      const expiryDate = card.expiryMonth && card.expiryYear 
        ? `${card.expiryMonth}/${card.expiryYear.substring(2)}` 
        : '00/00';
      
      // Récupérer la devise et le solde du compte client
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
        internationalPaymentEnabled: card.internationalPaymentEnabled,
        dailyLimit: card.dailyLimit,
        monthlyLimit: card.monthlyLimit,
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
      monthlyExpenses: 8400
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
    
    // Trier par date (le plus récent d'abord)
    this.transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  // Utilitaires pour le formatage
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

  // Fonctions d'interface utilisateur
  toggleAllTransactions(): void {
    this.showAllTransactions = !this.showAllTransactions;
  }
  
  refreshData(): void {
    this.loadClient();
  }
}