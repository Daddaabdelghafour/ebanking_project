import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-client-page',
  standalone: true,
  imports: [
    CommonModule, 
  ],
  templateUrl: './client-page.component.html',
  styleUrls: ['./client-page.component.css']
})
export class ClientPageComponent {
  currentDate = new Date();
  currentName = 'Nick';
  
  // Bank cards (using your existing data)
  bankCards = [
    {
      cardNumber: '4242 4242 4242 4242',
      cardHolder: 'Nick Karam',
      expiryDate: '09/25',
      cardType: 'visa',
      cardBackground: 'bg-gradient-to-r from-blue-700 to-blue-400',
      balance: 5432.21,
      currency: 'EUR'
    },
    {
      cardNumber: '5353 2345 6789 4321',
      cardHolder: 'Nick Karam',
      expiryDate: '12/26',
      cardType: 'mastercard',
      cardBackground: 'bg-gradient-to-r from-red-700 to-red-400',
      balance: 2789.54,
      currency: 'EUR'
    }
  ];
  
  // Financial summary (using your existing data)
  financialSummary = {
    totalBalance: 8221.75,
    totalBalanceChange: 3.2,
    monthlyIncome: 3500,
    monthlyIncomeChange: 5.1,
    monthlyExpenses: 2100.5,
    monthlyExpensesChange: 2.4
  };
  
  // Transactions (using your existing data)
  transactions = [
    {
      name: 'Shopify Subscription',
      type: 'Automatic Payment',
      date: new Date(2023, 4, 12),
      category: 'Software',
      amount: -29.99,
      status: 'Completed',
      icon: 'briefcase'
    },
    {
      name: 'Salary Payment',
      type: 'Direct Deposit',
      date: new Date(2023, 4, 10),
      category: 'Transfer',
      amount: 3500,
      status: 'Completed',
      icon: 'mail'
    },
    {
      name: 'Investment Dividend',
      type: 'Transfer',
      date: new Date(2023, 4, 8),
      category: 'Finance',
      amount: 89.45,
      status: 'Pending',
      icon: 'currency-dollar'
    }
  ];
  
  // Chart data
  spendingChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Income',
        data: [3200, 3500, 3200, 3400, 3500],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.2)'
      },
      {
        label: 'Expenses',
        data: [2200, 2300, 1900, 2100, 2200],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)'
      }
    ]
  };
  
  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  }
  
  getTransactionIconClass(icon: string): string {
    switch (icon) {
      case 'briefcase':
        return 'text-blue-600';
      case 'mail':
        return 'text-green-600';
      case 'currency-dollar':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  }
  
  getTransactionStatusClass(status: string): string {
    switch (status) {
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
  
  exportData() {
    alert('Exporting data...');
    // Implement export functionality
  }
}