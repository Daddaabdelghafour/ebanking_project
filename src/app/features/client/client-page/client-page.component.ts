import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-client-page',
  templateUrl: './client-page.component.html',
  styleUrl: './client-page.component.css',
  imports: [CommonModule]
})
export class ClientPageComponent {
  currentDate = new Date();
  timeRange = 'Daily';
  currentName = 'Nick';
  financialSummary = {
    totalBalance: 12645.00,
    totalBalanceChange: 12,
    monthlyIncome: 2645.00,
    monthlyIncomeChange: 12,
    monthlyExpenses: 1895.00,
    monthlyExpensesChange: 8,
    cardBalance: 7328.00,
    cardLimit: 20000,
    cardUsedPercentage: 36
  };
  
  transactions = [
    { 
      id: 1, 
      name: 'Dribbble', 
      type: 'Subscription', 
      category: 'Software',
      date: '2025-05-04',
      amount: -440.00,
      status: 'Completed',
      icon: 'briefcase'
    },
    { 
      id: 2, 
      name: 'Jaxson Dorwart', 
      type: 'Transfer',
      category: 'Transfer',
      date: '2025-05-01',
      amount: 840.00,
      status: 'Completed',
      icon: 'mail'
    },
    { 
      id: 3, 
      name: 'Hanna Bergson', 
      type: 'Transfer',
      category: 'Finance',
      date: '2025-04-28',
      amount: 1200.00,
      status: 'Completed',
      icon: 'currency-dollar'
    }
  ];
  
  financialGoals = [
    {
      name: 'Home Down Payment',
      targetDate: 'December 2026',
      current: 18500,
      target: 50000,
      percentage: 37,
      icon: 'home'
    },
    {
      name: 'College Fund',
      targetDate: 'September 2028',
      current: 12750,
      target: 25000,
      percentage: 51,
      icon: 'book-open'
    },
    {
      name: 'Vacation',
      targetDate: 'July 2025',
      current: 3800,
      target: 5000,
      percentage: 76,
      icon: 'globe'
    }
  ];
  
  expenseCategories = [
    { name: 'Food & Health', amount: 863, percentage: 28, color: 'primary' },
    { name: 'Entertainment', amount: 548, percentage: 18, color: 'secondary' },
    { name: 'Shopping', amount: 1024, percentage: 34, color: 'purple-500' },
    { name: 'Investment', amount: 625, percentage: 20, color: 'green-500' }
  ];
  
  // Données pour le graphique mensuel
  monthlyData = [
    { month: 'Jan', income: 400, expense: 300 },
    { month: 'Feb', income: 600, expense: 500 },
    { month: 'Mar', income: 800, expense: 600 },
    { month: 'Apr', income: 1200, expense: 900 },
    { month: 'May', income: 1300, expense: 1000 },
    { month: 'Jun', income: 900, expense: 800 },
    { month: 'Jul', income: 500, expense: 400 },
    { month: 'Aug', income: 1000, expense: 700 },
    { month: 'Sep', income: 600, expense: 500 },
    { month: 'Oct', income: 800, expense: 600 },
    { month: 'Nov', income: 400, expense: 300 },
    { month: 'Dec', income: 700, expense: 600 }
  ];

  constructor() { }

  changeTimeRange(range: string): void {
    this.timeRange = range;
    // Ici, vous appelleriez normalement votre service pour charger les données selon la plage de temps
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  getTransactionIconClass(icon: string): string {
    const baseClasses = 'h-4 w-4';
    switch (icon) {
      case 'briefcase': return `${baseClasses} text-blue-600`;
      case 'mail': return `${baseClasses} text-green-600`;
      case 'currency-dollar': return `${baseClasses} text-purple-600`;
      default: return baseClasses;
    }
  }

  getTransactionStatusClass(status: string): string {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  exportData(): void {
    console.log('Exporting data...');
    // Implémentez la logique d'exportation ici
  }
}