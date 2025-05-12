import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientService } from '../../../services/client/client.service';
import { Client, Account } from '../../../shared/models/client.model';

interface BankCard {
  cardType: 'visa' | 'mastercard';
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  balance: number;
  currency: string;
  cardBackground: string;
}

interface Transaction {
  id: string;
  name: string;
  type: string;
  date: Date;
  category: 'Software' | 'Transfer' | 'Finance';
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  icon: 'briefcase' | 'mail' | 'currency-dollar';
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
  bankCards: BankCard[] = [];
  financialSummary: FinancialSummary = {
    totalBalance: 0,
    totalBalanceChange: 3.2,
    monthlyIncome: 0,
    monthlyIncomeChange: 5.1,
    monthlyExpenses: 0,
    monthlyExpensesChange: 2.4
  };
  transactions: Transaction[] = [];

  constructor(private clientService: ClientService) {}

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
          this.updateFinancialData(client);
          this.generateTransactions();
        } else {
          this.error = "Client non trouvé";
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = "Erreur lors du chargement des données client";
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  updateFinancialData(client: Client): void {
    // Update financial summary based on client data
    this.financialSummary.totalBalance = client.balance;
    // Income could be based on client's income property if available
    this.financialSummary.monthlyIncome = client.income || 0;
    // Expenses could be calculated from transactions or estimated
    this.financialSummary.monthlyExpenses = this.financialSummary.monthlyIncome * 0.7;
    
    // Generate bank cards based on client accounts
    this.bankCards = [];
    
    // Add the main account as a card
    this.bankCards.push({
      cardType: 'visa',
      cardNumber: this.formatCardNumber('4539 **** **** 5678'),
      cardHolder: `${client.firstName} ${client.lastName}`,
      expiryDate: '12/25',
      balance: client.balance,
      currency: client.currency,
      cardBackground: 'bg-gradient-to-r from-blue-500 to-blue-700'
    });
    
    // Add additional cards based on client accounts if they exist
    if (client.accounts && client.accounts.length > 0) {
      client.accounts.forEach((account, index) => {
        if (index > 0) { // Skip the first account as it's already added
          this.bankCards.push({
            cardType: index % 2 === 0 ? 'visa' : 'mastercard',
            cardNumber: this.formatCardNumber(`${account.accountNumber.substring(0, 4)} **** **** ${account.accountNumber.slice(-4)}`),
            cardHolder: `${client.firstName} ${client.lastName}`,
            expiryDate: '06/27',
            balance: account.balance,
            currency: account.currency,
            cardBackground: index % 2 === 0 
              ? 'bg-gradient-to-r from-purple-500 to-purple-700'
              : 'bg-gradient-to-r from-green-500 to-green-700'
          });
        }
      });
    }
  }

  generateTransactions(): void {
    // Generate realistic transactions based on client data
    const categories: ['Software', 'Transfer', 'Finance'] = ['Software', 'Transfer', 'Finance'];
    const icons: ['briefcase', 'mail', 'currency-dollar'] = ['briefcase', 'mail', 'currency-dollar'];
    const statuses: ['Completed', 'Pending', 'Failed'] = ['Completed', 'Pending', 'Failed'];
    
    this.transactions = [];
    
    // Add some deposits
    this.transactions.push({
      id: 'txn1',
      name: 'Virement entrant',
      type: 'Dépôt',
      date: new Date(2023, 4, 15),
      category: 'Transfer',
      amount: 1250.00,
      status: 'Completed',
      icon: 'mail'
    });
    
    // Add salary payment
    this.transactions.push({
      id: 'txn2',
      name: 'Salaire',
      type: 'Dépôt',
      date: new Date(2023, 4, 5),
      category: 'Finance',
      amount: this.currentClient?.income || 0,
      status: 'Completed',
      icon: 'currency-dollar'
    });
    
    // Add some withdrawals/payments
    const paymentAmounts = [-120.50, -45.99, -67.80, -255.30, -22.50];
    const paymentNames = ['Carrefour', 'Netflix', 'Amazon', 'Loyer', 'Restaurant'];
    
    for (let i = 0; i < 5; i++) {
      this.transactions.push({
        id: `txn${i+3}`,
        name: paymentNames[i],
        type: 'Paiement',
        date: new Date(2023, 4, 20 - i),
        category: i % 3 === 0 ? 'Software' : (i % 2 === 0 ? 'Finance' : 'Transfer'),
        amount: paymentAmounts[i],
        status: i === 0 ? 'Pending' : (i === 4 ? 'Failed' : 'Completed'),
        icon: icons[i % 3]
      });
    }
    
    // Sort by date, most recent first
    this.transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  formatCardNumber(number: string): string {
    return number.replace(/\s/g, ' ');
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
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
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