import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientService } from '../../../services/client/client.service';
import { CardService } from '../../../services/card/card.service';
import { Client } from '../../../shared/models/client.model';
import { Account } from '../../../shared/models/account.model';
import { Card } from '../../../shared/models/card.model';
import { Transaction } from '../../../shared/models/transaction';
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
  currentClient: Client | null = null;
  currentName: string = '';
  currentDate: Date = new Date();
  isLoading: boolean = true;
  error: string | null = null;
  
  // Financial data
  clientCards: Card[] = [];
  displayCards: DisplayCard[] = [];
  accounts: Account[] = [];
  financialSummary: FinancialSummary = {
    totalBalance: 0,
    totalBalanceChange: 3.2,
    monthlyIncome: 0,
    monthlyIncomeChange: 5.1,
    monthlyExpenses: 0,
    monthlyExpensesChange: 2.4
  };
  transactions: Transaction[] = [];

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
    
    // In a real app, you would get the current client ID from AuthService or similar
    // For this example, we'll use a hardcoded ID (the first client)
    const clientId = 'cl1';
    
    this.clientService.getClientById(clientId).subscribe({
      next: (client) => {
        if (client) {
          this.currentClient = client;
          this.currentName = `${client.firstName} ${client.lastName}`;
          
          // Charge les comptes du client si disponibles
          if (client.accounts && client.accounts.length > 0) {
            this.accounts = client.accounts;
          }
          
          // Charge les cartes du client
          this.loadClientCards(clientId);
          
          // Mettre à jour les données financières
          this.updateFinancialData(client);
          
          // Générer les transactions de test
          this.generateTransactions();
        } else {
          this.error = "Client non trouvé";
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = "Erreur lors du chargement des données client";
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  loadClientCards(clientId: string): void {
    this.cardService.getCardsByClientId(clientId).subscribe({
      next: (cards) => {
        this.clientCards = cards;
        this.prepareDisplayCards();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = "Erreur lors du chargement des cartes";
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  prepareDisplayCards(): void {
    // Code existant pour prepareDisplayCards...
    this.displayCards = [];
    
    // Convertir les cartes en format d'affichage
    this.clientCards.forEach((card, index) => {
      // Trouver le compte associé à cette carte
      const linkedAccount = this.accounts.find(acc => acc.id === card.accountId);
      
      // Créer une carte d'affichage avec les informations combinées
      this.displayCards.push({
        id: card.id,
        network: card.network,
        maskedNumber: card.maskedNumber,
        cardholderName: card.cardholderName,
        expiryDate: this.cardService.getExpiryDate(card.expiryMonth, card.expiryYear),
        balance: linkedAccount?.balance || 0,
        currency: linkedAccount?.currency || 'MAD',
        status: card.status,
        accountId: card.accountId,
        cardBackground: this.getCardBackground(index, card.network)
      });
    });
    
    // Si aucune carte n'est trouvée, créez une carte virtuelle pour l'affichage
    if (this.displayCards.length === 0 && this.currentClient) {
      this.displayCards.push({
        id: 'virtual',
        network: 'visa',
        maskedNumber: '4539 **** **** 5678',
        cardholderName: `${this.currentClient.firstName} ${this.currentClient.lastName}`,
        expiryDate: '12/25',
        balance: this.currentClient.balance,
        currency: this.currentClient.currency,
        status: 'active',
        accountId: 'main',
        cardBackground: 'bg-gradient-to-r from-blue-500 to-blue-700'
      });
    }
  }

  getCardBackground(index: number, network: string): string {
    // Code existant pour getCardBackground...
    if (network === 'visa') {
      return index % 2 === 0 
        ? 'bg-gradient-to-r from-blue-500 to-blue-700'
        : 'bg-gradient-to-r from-indigo-500 to-indigo-700';
    } else if (network === 'mastercard') {
      return index % 2 === 0 
        ? 'bg-gradient-to-r from-red-500 to-orange-500'
        : 'bg-gradient-to-r from-orange-500 to-yellow-500';
    } else {
      return 'bg-gradient-to-r from-gray-700 to-gray-900';
    }
  }

  updateFinancialData(client: Client): void {
    // Code existant pour updateFinancialData...
    this.financialSummary.totalBalance = client.balance;
    this.financialSummary.monthlyIncome = client.income || 0;
    this.financialSummary.monthlyExpenses = this.financialSummary.monthlyIncome * 0.7;
  }

  generateTransactions(): void {
    // Utilisation du modèle Transaction standardisé
    this.transactions = [];

    // Définir le compte principal (utiliser le premier compte ou créer un ID par défaut)
    const mainAccountId = this.accounts.length > 0 ? this.accounts[0].id : 'acc1';
    const mainCurrency = this.currentClient?.currency || 'MAD';
    
    // Ajouter des dépôts
    this.transactions.push({
      id: 'txn1',
      accountId: mainAccountId,
      name: 'Virement entrant',
      type: 'deposit',
      date: new Date(2023, 4, 15),
      category: 'transfer',
      amount: 1250.00,
      currency: mainCurrency,
      status: 'completed',
      icon: 'mail',
      reference: 'VIR-2023051501',
      balanceAfterTransaction: 4500.00,
      recipientName: this.currentName
    });
    
    // Ajouter le paiement de salaire
    this.transactions.push({
      id: 'txn2',
      accountId: mainAccountId,
      name: 'Salaire',
      type: 'deposit',
      date: new Date(2023, 4, 5),
      category: 'finance',
      amount: this.currentClient?.income || 3500.00,
      currency: mainCurrency,
      status: 'completed',
      icon: 'currency-dollar',
      description: 'Versement salaire mensuel',
      merchantName: 'ACME Corporation',
      reference: 'SAL-202305',
      balanceAfterTransaction: 3250.00
    });
    
    // Ajouter des retraits/paiements
    const paymentDetails = [
      { name: 'Carrefour', amount: 120.50, type: 'payment', category: 'shopping', status: 'pending', merchant: 'Carrefour' },
      { name: 'Netflix', amount: 45.99, type: 'payment', category: 'entertainment', status: 'completed', merchant: 'Netflix Inc.' },
      { name: 'Amazon', amount: 67.80, type: 'payment', category: 'shopping', status: 'completed', merchant: 'Amazon EU' },
      { name: 'Loyer', amount: 255.30, type: 'payment', category: 'housing', status: 'completed', merchant: 'Régie Immobilière' },
      { name: 'Restaurant', amount: 22.50, type: 'payment', category: 'food', status: 'failed', merchant: 'Au Bon Goût' }
    ];
    
    let currentBalance = 3250.00;
    
    for (let i = 0; i < paymentDetails.length; i++) {
      const payment = paymentDetails[i];
      currentBalance -= payment.amount;
      
      this.transactions.push({
        id: `txn${i+3}`,
        accountId: mainAccountId,
        name: payment.name,
        type: payment.type as any,
        date: new Date(2023, 4, 20 - i),
        category: payment.category as any,
        amount: -payment.amount, // Montant négatif pour les paiements
        currency: mainCurrency,
        status: payment.status as any,
        icon: this.getCategoryIcon(payment.category),
        merchantName: payment.merchant,
        balanceAfterTransaction: currentBalance,
        reference: `REF-${Date.now().toString().substring(5)}-${i}`
      });
    }
    
    // Trier par date, les plus récentes en premier
    this.transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'shopping': return 'shopping-cart';
      case 'entertainment': return 'film';
      case 'housing': return 'home';
      case 'food': return 'utensils';
      case 'transfer': return 'exchange-alt';
      case 'finance': return 'money-bill';
      default: return 'tag';
    }
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  getTransactionStatusClass(status: string): string {
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

  exportData(): void {
    console.log('Exporting data...');
    // Implement export functionality as needed
    alert('La fonction d\'exportation sera disponible prochainement.');
  }
}