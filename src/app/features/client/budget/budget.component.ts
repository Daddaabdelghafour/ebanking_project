import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Simple Interfaces
interface Budget {
  id: string;
  clientId: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  currency: string;
  period: string;
  isOverBudget: boolean;
  alertLevel: 'safe' | 'warning' | 'danger';
  createdAt: string;
}

interface AlertSetting {
  id?: string;
  clientId: string;
  budgetCategory: string;
  threshold: number; // percentage (e.g., 80 for 80%)
  isActive: boolean;
  alertType: string;
}

interface ExpenseTransaction {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'expense';
  currency: string;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.css']
})
export class BudgetComponent implements OnInit {
  
  // Fixed IDs
  clientId: string = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';
  userId: string = 'f63a8753-6908-4130-a897-cf26f5f5d733';
  
  // State
  currentTab: 'overview' | 'manage' | 'add' | 'alerts' = 'overview';
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  Math = Math; // Expose Math for templates
  // Data
  budgets: Budget[] = [];
  alertSettings: AlertSetting[] = [];
  transactions: ExpenseTransaction[] = [];
  totalBudget: number = 0;
  totalSpent: number = 0;
  
  // Forms
  budgetForm: FormGroup;
  alertForm: FormGroup;
  
  // Messages
  showError: boolean = false;
  showSuccess: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Categories (simple list)
  categories = [
    { id: 'food', label: 'Alimentation', icon: 'fa-utensils', color: 'green' },
    { id: 'transport', label: 'Transport', icon: 'fa-car', color: 'blue' },
    { id: 'shopping', label: 'Shopping', icon: 'fa-shopping-bag', color: 'purple' },
    { id: 'entertainment', label: 'Divertissement', icon: 'fa-gamepad', color: 'pink' },
    { id: 'bills', label: 'Factures', icon: 'fa-file-invoice', color: 'orange' },
    { id: 'health', label: 'Santé', icon: 'fa-heartbeat', color: 'red' },
    { id: 'other', label: 'Autre', icon: 'fa-circle', color: 'gray' }
  ];

  private apiUrl = 'http://localhost:8085/E-BANKING1/api';
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.budgetForm = this.createBudgetForm();
    this.alertForm = this.createAlertForm();
  }

  ngOnInit(): void {
    this.loadBudgets();
    this.loadAlertSettings();
    this.loadTransactions();
  }

  /**
   * Create budget form
   */
  createBudgetForm(): FormGroup {
    return this.fb.group({
      category: ['', Validators.required],
      limit: ['', [Validators.required, Validators.min(1)]],
      period: ['monthly', Validators.required]
    });
  }

  /**
   * Create alert form
   */
  createAlertForm(): FormGroup {
    return this.fb.group({
      budgetCategory: ['', Validators.required],
      threshold: [80, [Validators.required, Validators.min(1), Validators.max(100)]],
      alertType: ['email', Validators.required]
    });
  }

  /**
   * Load budgets from backend
   */
  loadBudgets(): void {
    this.isLoading = true;
    
    // For now, create local storage budgets since backend endpoint isn't specified
    const storedBudgets = localStorage.getItem(`budgets_${this.clientId}`);
    if (storedBudgets) {
      this.budgets = JSON.parse(storedBudgets);
    } else {
      this.budgets = [];
    }
    
    this.calculateTotals();
    this.isLoading = false;
  }

  /**
   * Load alert settings
   */
  loadAlertSettings(): void {
    this.http.get<AlertSetting>(`${this.apiUrl}/alerts/client/${this.clientId}`)
      .pipe(
        catchError(error => {
          console.log('No alert settings found for client:', this.clientId);
          return of(null);
        })
      )
      .subscribe(alertSetting => {
        if (alertSetting) {
          this.alertSettings = [alertSetting];
        }
      });
  }

  /**
   * Load recent transactions to calculate spending
   */
  loadTransactions(): void {
    // This would typically come from transactions API
    // For now, we'll simulate with local data
    const storedTransactions = localStorage.getItem(`transactions_${this.clientId}`);
    if (storedTransactions) {
      this.transactions = JSON.parse(storedTransactions);
    } else {
      this.transactions = [];
    }
    
    this.updateBudgetSpending();
  }

  /**
   * Calculate totals and update budget status
   */
  calculateTotals(): void {
    this.totalBudget = this.budgets.reduce((sum, budget) => sum + budget.limit, 0);
    this.totalSpent = this.budgets.reduce((sum, budget) => sum + budget.spent, 0);

    // Update each budget
    this.budgets.forEach(budget => {
      budget.remaining = budget.limit - budget.spent;
      budget.percentage = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0;
      budget.isOverBudget = budget.spent > budget.limit;
      
      // Set alert level
      if (budget.isOverBudget) {
        budget.alertLevel = 'danger';
      } else if (budget.percentage >= 80) {
        budget.alertLevel = 'warning';
      } else {
        budget.alertLevel = 'safe';
      }
    });

    this.saveBudgets();
    this.checkBudgetAlerts();
  }

  /**
   * Update budget spending from transactions
   */
  updateBudgetSpending(): void {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    this.budgets.forEach(budget => {
      // Calculate spending for this budget category this month
      const categorySpending = this.transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transaction.category === budget.category &&
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      budget.spent = categorySpending;
    });

    this.calculateTotals();
  }

  /**
   * Check for budget alerts
   */
  checkBudgetAlerts(): void {
    this.budgets.forEach(budget => {
      const alertSetting = this.alertSettings.find(alert => 
        alert.budgetCategory === budget.category && alert.isActive
      );

      if (alertSetting && budget.percentage >= alertSetting.threshold) {
        this.triggerBudgetAlert(budget, alertSetting);
      }
    });
  }

  /**
   * Trigger budget alert
   */
  triggerBudgetAlert(budget: Budget, alertSetting: AlertSetting): void {
    if (budget.isOverBudget) {
      this.showWarningMessage(`⚠️ Budget dépassé pour ${this.getCategoryLabel(budget.category)} : ${budget.percentage}% utilisé (${this.formatCurrency(Math.abs(budget.remaining))} de dépassement)`);
    } else if (budget.percentage >= alertSetting.threshold) {
      this.showWarningMessage(`🔔 Attention : ${budget.percentage}% du budget ${this.getCategoryLabel(budget.category)} utilisé`);
    }
  }

  /**
   * Switch tabs
   */
  switchTab(tab: 'overview' | 'manage' | 'add' | 'alerts'): void {
    this.currentTab = tab;
    this.clearMessages();
  }

  /**
   * Submit new budget
   */
  onSubmitBudget(): void {
    if (this.budgetForm.invalid) {
      this.showErrorMessage('Veuillez remplir tous les champs requis.');
      return;
    }

    this.isSubmitting = true;
    const formData = this.budgetForm.value;

    // Check if category already exists
    const exists = this.budgets.find(b => b.category === formData.category);
    if (exists) {
      this.showErrorMessage('Un budget existe déjà pour cette catégorie.');
      this.isSubmitting = false;
      return;
    }

    // Create new budget
    const newBudget: Budget = {
      id: Date.now().toString(),
      clientId: this.clientId,
      category: formData.category,
      limit: formData.limit,
      spent: 0,
      remaining: formData.limit,
      percentage: 0,
      currency: 'EUR',
      period: formData.period,
      isOverBudget: false,
      alertLevel: 'safe',
      createdAt: new Date().toISOString()
    };

    // Simulate API call
    setTimeout(() => {
      this.budgets.push(newBudget);
      this.calculateTotals();
      this.showSuccessMessage('Budget créé avec succès !');
      this.budgetForm.reset({ period: 'monthly' });
      this.currentTab = 'manage';
      this.isSubmitting = false;
    }, 500);
  }

  /**
   * Submit alert setting
   */
  onSubmitAlert(): void {
    if (this.alertForm.invalid) {
      this.showErrorMessage('Veuillez remplir tous les champs requis.');
      return;
    }

    this.isSubmitting = true;
    const formData = this.alertForm.value;

    const alertSetting: AlertSetting = {
      clientId: this.clientId,
      budgetCategory: formData.budgetCategory,
      threshold: formData.threshold,
      isActive: true,
      alertType: formData.alertType
    };

    // Save to backend
    this.http.post<AlertSetting>(`${this.apiUrl}/alerts`, alertSetting, this.httpOptions)
      .pipe(
        catchError(error => {
          console.error('Error saving alert setting:', error);
          // Save locally as fallback
          this.alertSettings.push({ ...alertSetting, id: Date.now().toString() });
          return of(alertSetting);
        })
      )
      .subscribe(() => {
        this.showSuccessMessage('Alerte budgétaire configurée avec succès !');
        this.alertForm.reset({ threshold: 80, alertType: 'email' });
        this.isSubmitting = false;
        this.loadAlertSettings();
      });
  }

  /**
   * Delete budget
   */
  deleteBudget(budget: Budget): void {
    if (confirm(`Supprimer le budget "${this.getCategoryLabel(budget.category)}" ?`)) {
      this.budgets = this.budgets.filter(b => b.id !== budget.id);
      this.calculateTotals();
      this.showSuccessMessage('Budget supprimé !');
    }
  }

  /**
   * Delete alert setting
   */
  deleteAlert(alert: AlertSetting): void {
    if (confirm('Supprimer cette alerte ?')) {
      if (alert.id) {
        this.http.delete(`${this.apiUrl}/alerts/${alert.id}`)
          .pipe(
            catchError(error => {
              console.error('Error deleting alert:', error);
              return of(null);
            })
          )
          .subscribe(() => {
            this.alertSettings = this.alertSettings.filter(a => a.id !== alert.id);
            this.showSuccessMessage('Alerte supprimée !');
          });
      }
    }
  }

  /**
   * Add expense to budget (simulate spending)
   */
  addExpense(budget: Budget, amount: number): void {
    const transaction: ExpenseTransaction = {
      id: Date.now().toString(),
      accountId: 'demo-account',
      amount: amount,
      category: budget.category,
      description: `Dépense ${this.getCategoryLabel(budget.category)}`,
      date: new Date().toISOString(),
      type: 'expense',
      currency: 'EUR'
    };

    this.transactions.push(transaction);
    budget.spent += amount;
    
    this.saveTransactions();
    this.calculateTotals();
    
    this.showSuccessMessage(`${this.formatCurrency(amount)} ajouté aux dépenses ${this.getCategoryLabel(budget.category)}`);
  }

  /**
   * Get alerts for budget overview
   */
  getBudgetAlerts(): string[] {
    const alerts: string[] = [];
    
    this.budgets.forEach(budget => {
      if (budget.isOverBudget) {
        alerts.push(`🚨 Budget ${this.getCategoryLabel(budget.category)} dépassé de ${this.formatCurrency(Math.abs(budget.remaining))}`);
      } else if (budget.alertLevel === 'warning') {
        alerts.push(`⚠️ Budget ${this.getCategoryLabel(budget.category)} à ${budget.percentage}% (reste ${this.formatCurrency(budget.remaining)})`);
      }
    });

    return alerts;
  }

  /**
   * Save budgets to localStorage
   */
  saveBudgets(): void {
    localStorage.setItem(`budgets_${this.clientId}`, JSON.stringify(this.budgets));
  }

  /**
   * Save transactions to localStorage
   */
  saveTransactions(): void {
    localStorage.setItem(`transactions_${this.clientId}`, JSON.stringify(this.transactions));
  }

  /**
   * Utility methods
   */
  getCategoryLabel(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.label || categoryId;
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.icon || 'fa-circle';
  }

  getCategoryColor(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.color || 'gray';
  }

  getProgressBarClass(budget: Budget): string {
    switch (budget.alertLevel) {
      case 'danger': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  /**
   * Messages
   */
  showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
    this.showSuccess = false;
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccess = true;
    this.showError = false;
  }

  showWarningMessage(message: string): void {
    this.successMessage = message;
    this.showSuccess = true;
    this.showError = false;
  }

  clearMessages(): void {
    this.showError = false;
    this.showSuccess = false;
  }

  closeError(): void {
    this.showError = false;
  }
}