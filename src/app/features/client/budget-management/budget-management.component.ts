import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interfaces simplifiées
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
  alertThreshold: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  targetDate: Date;
  status: 'on-track' | 'behind' | 'completed';
}

interface Alert {
  id: string;
  type: 'budget' | 'savings' | 'spending';
  message: string;
  severity: 'info' | 'warning' | 'danger';
  date: Date;
}

@Component({
  selector: 'app-budget-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-management.component.html',
  styleUrls: ['./budget-management.component.css']
})
export class BudgetManagementComponent implements OnInit {
  activeTab = 'overview';
  isLoading = false;
  Math = Math;
  
  // Données simplifiées
  totalBudget = 15000;
  totalSpent = 9850;
  totalRemaining = 5150;
  
  // Catégories prédéfinies
  categories: Category[] = [
    { id: '1', name: 'Alimentation', icon: 'fa-utensils', color: '#10B981' },
    { id: '2', name: 'Transport', icon: 'fa-car', color: '#3B82F6' },
    { id: '3', name: 'Loisirs', icon: 'fa-gamepad', color: '#F59E0B' },
    { id: '4', name: 'Santé', icon: 'fa-heartbeat', color: '#EF4444' },
    { id: '5', name: 'Shopping', icon: 'fa-shopping-bag', color: '#8B5CF6' },
    { id: '6', name: 'Factures', icon: 'fa-file-invoice', color: '#6B7280' }
  ];
  
  // Budgets
  budgets: Budget[] = [
    {
      id: '1',
      categoryId: '1',
      categoryName: 'Alimentation',
      limit: 3000,
      spent: 2850,
      remaining: 150,
      percentage: 95,
      status: 'danger',
      alertThreshold: 80
    },
    {
      id: '2',
      categoryId: '2',
      categoryName: 'Transport',
      limit: 2000,
      spent: 1200,
      remaining: 800,
      percentage: 60,
      status: 'safe',
      alertThreshold: 80
    },
    {
      id: '3',
      categoryId: '3',
      categoryName: 'Loisirs',
      limit: 1500,
      spent: 1350,
      remaining: 150,
      percentage: 90,
      status: 'warning',
      alertThreshold: 80
    }
  ];
  
  // Objectifs d'épargne
  savingsGoals: SavingsGoal[] = [
    {
      id: '1',
      name: 'Vacances d\'été',
      targetAmount: 15000,
      currentAmount: 8500,
      percentage: 57,
      targetDate: new Date('2024-07-01'),
      status: 'on-track'
    },
    {
      id: '2',
      name: 'Nouveau laptop',
      targetAmount: 12000,
      currentAmount: 4000,
      percentage: 33,
      targetDate: new Date('2024-06-01'),
      status: 'behind'
    }
  ];
  
  // Alertes
  alerts: Alert[] = [
    {
      id: '1',
      type: 'budget',
      message: 'Attention ! Vous avez dépassé 95% de votre budget alimentation',
      severity: 'danger',
      date: new Date()
    },
    {
      id: '2',
      type: 'budget',
      message: 'Vous approchez de la limite pour les loisirs (90%)',
      severity: 'warning',
      date: new Date()
    }
  ];
  
  // Formulaires
  showBudgetForm = false;
  showGoalForm = false;
  
  newBudget = {
    categoryId: '',
    limit: 0,
    alertThreshold: 80
  };
  
  newGoal = {
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: ''
  };

  constructor() {}

  ngOnInit(): void {
    this.generateAlerts();
  }

  /**
   * Générer des alertes automatiques
   */
  generateAlerts(): void {
    this.alerts = [];
    
    this.budgets.forEach(budget => {
      if (budget.percentage >= 100) {
        this.alerts.push({
          id: `alert-${budget.id}`,
          type: 'budget',
          message: `🚨 Budget ${budget.categoryName} dépassé ! (${budget.percentage}%)`,
          severity: 'danger',
          date: new Date()
        });
      } else if (budget.percentage >= budget.alertThreshold) {
        this.alerts.push({
          id: `alert-${budget.id}`,
          type: 'budget',
          message: `⚠️ Attention ! Budget ${budget.categoryName} à ${budget.percentage}%`,
          severity: budget.percentage >= 95 ? 'danger' : 'warning',
          date: new Date()
        });
      }
    });
    
    // Alertes pour objectifs d'épargne
    this.savingsGoals.forEach(goal => {
      const daysToTarget = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const expectedProgress = Math.max(0, 100 - (daysToTarget / 365 * 100));
      
      if (goal.percentage < expectedProgress - 20) {
        this.alerts.push({
          id: `goal-alert-${goal.id}`,
          type: 'savings',
          message: `📊 Objectif "${goal.name}" en retard sur le planning`,
          severity: 'warning',
          date: new Date()
        });
      }
    });
  }

  /**
   * Changer d'onglet
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  /**
   * Basculer le formulaire de budget
   */
  toggleBudgetForm(): void {
    this.showBudgetForm = !this.showBudgetForm;
    if (!this.showBudgetForm) {
      this.resetBudgetForm();
    }
  }

  /**
   * Basculer le formulaire d'objectif
   */
  toggleGoalForm(): void {
    this.showGoalForm = !this.showGoalForm;
    if (!this.showGoalForm) {
      this.resetGoalForm();
    }
  }

  /**
   * Créer un nouveau budget
   */
  createBudget(): void {
    if (this.newBudget.categoryId && this.newBudget.limit > 0) {
      const category = this.getCategoryById(this.newBudget.categoryId);
      if (category) {
        const budget: Budget = {
          id: this.generateId(),
          categoryId: this.newBudget.categoryId,
          categoryName: category.name,
          limit: this.newBudget.limit,
          spent: 0,
          remaining: this.newBudget.limit,
          percentage: 0,
          status: 'safe',
          alertThreshold: this.newBudget.alertThreshold
        };
        
        this.budgets.push(budget);
        this.updateTotals();
        this.generateAlerts();
        this.toggleBudgetForm();
        this.showSuccessMessage('Budget créé avec succès !');
      }
    }
  }

  /**
   * Créer un nouvel objectif d'épargne
   */
  createSavingsGoal(): void {
    if (this.newGoal.name && this.newGoal.targetAmount > 0) {
      const goal: SavingsGoal = {
        id: this.generateId(),
        name: this.newGoal.name,
        targetAmount: this.newGoal.targetAmount,
        currentAmount: this.newGoal.currentAmount,
        percentage: Math.round((this.newGoal.currentAmount / this.newGoal.targetAmount) * 100),
        targetDate: new Date(this.newGoal.targetDate),
        status: 'on-track'
      };
      
      this.savingsGoals.push(goal);
      this.generateAlerts();
      this.toggleGoalForm();
      this.showSuccessMessage('Objectif d\'épargne créé avec succès !');
    }
  }

  /**
   * Ajouter des dépenses à un budget
   */
  addExpense(budgetId: string, amount: number): void {
    const budget = this.budgets.find(b => b.id === budgetId);
    if (budget && amount > 0) {
      budget.spent += amount;
      budget.remaining = budget.limit - budget.spent;
      budget.percentage = Math.round((budget.spent / budget.limit) * 100);
      
      // Mettre à jour le statut
      if (budget.percentage >= 100) {
        budget.status = 'danger';
      } else if (budget.percentage >= budget.alertThreshold) {
        budget.status = 'warning';
      } else {
        budget.status = 'safe';
      }
      
      this.updateTotals();
      this.generateAlerts();
    }
  }

  /**
   * Ajouter de l'argent à un objectif d'épargne
   */
  addToSavingsGoal(goalId: string, amount: number): void {
    const goal = this.savingsGoals.find(g => g.id === goalId);
    if (goal && amount > 0) {
      goal.currentAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
      goal.percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
      
      if (goal.percentage >= 100) {
        goal.status = 'completed';
        this.alerts.push({
          id: `completion-${goal.id}`,
          type: 'savings',
          message: `🎉 Félicitations ! Objectif "${goal.name}" atteint !`,
          severity: 'info',
          date: new Date()
        });
      }
      
      this.generateAlerts();
      this.showSuccessMessage(`${amount} MAD ajoutés à votre objectif !`);
    }
  }

  /**
   * Supprimer un budget
   */
  deleteBudget(budgetId: string): void {
    this.budgets = this.budgets.filter(b => b.id !== budgetId);
    this.updateTotals();
    this.generateAlerts();
    this.showSuccessMessage('Budget supprimé avec succès !');
  }

  /**
   * Supprimer un objectif
   */
  deleteGoal(goalId: string): void {
    this.savingsGoals = this.savingsGoals.filter(g => g.id !== goalId);
    this.generateAlerts();
    this.showSuccessMessage('Objectif supprimé avec succès !');
  }

  /**
   * Mettre à jour les totaux
   */
  updateTotals(): void {
    this.totalBudget = this.budgets.reduce((sum, budget) => sum + budget.limit, 0);
    this.totalSpent = this.budgets.reduce((sum, budget) => sum + budget.spent, 0);
    this.totalRemaining = this.totalBudget - this.totalSpent;
  }

  /**
   * Obtenir une catégorie par ID
   */
  getCategoryById(id: string): Category | undefined {
    return this.categories.find(cat => cat.id === id);
  }

  /**
   * Obtenir les budgets disponibles pour sélection
   */
  getAvailableCategories(): Category[] {
    const usedCategoryIds = this.budgets.map(b => b.categoryId);
    return this.categories.filter(cat => !usedCategoryIds.includes(cat.id));
  }

  /**
   * Formater la devise
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
  }

  /**
   * Obtenir la couleur du statut
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'safe': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      case 'completed': return 'text-green-600';
      case 'on-track': return 'text-blue-600';
      case 'behind': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Obtenir la couleur de la barre de progression
   */
  getProgressColor(status: string): string {
    switch (status) {
      case 'safe': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'danger': return '#EF4444';
      default: return '#6B7280';
    }
  }

  /**
   * Obtenir l'icône d'alerte
   */
  getAlertIcon(severity: string): string {
    switch (severity) {
      case 'danger': return 'fa-exclamation-triangle text-red-500';
      case 'warning': return 'fa-exclamation-circle text-yellow-500';
      case 'info': return 'fa-info-circle text-blue-500';
      default: return 'fa-bell text-gray-500';
    }
  }

  /**
   * Fermer une alerte
   */
  dismissAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
  }

  /**
   * Calculer les jours restants
   */
  getDaysRemaining(targetDate: Date): number {
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Réinitialiser le formulaire de budget
   */
  private resetBudgetForm(): void {
    this.newBudget = {
      categoryId: '',
      limit: 0,
      alertThreshold: 80
    };
  }

  /**
   * Réinitialiser le formulaire d'objectif
   */
  private resetGoalForm(): void {
    this.newGoal = {
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: ''
    };
  }

  /**
   * Générer un ID unique
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Afficher un message de succès
   */
  private showSuccessMessage(message: string): void {
    // Dans une vraie app, utiliser un service de notification
    console.log('Succès:', message);
  }
}