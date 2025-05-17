import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  Budget, 
  BudgetCategory, 
  BudgetSummary, 
  BudgetAlert, 
  SavingsGoal 
} from '../../shared/models/budget.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = '/api/budgets'; // Replace with your actual API URL

  constructor(private http: HttpClient) { }

  // Get all budget categories
  getCategories(): Observable<BudgetCategory[]> {
    // For demo, return mock data
    return of([
      { id: '1', name: 'Alimentation', description: 'Courses et restaurants', icon: 'fa-utensils', color: '#4CAF50', isDefault: true, createdAt: new Date() },
      { id: '2', name: 'Transport', description: 'Essence, transports en commun', icon: 'fa-car', color: '#2196F3', isDefault: true, createdAt: new Date() },
      { id: '3', name: 'Logement', description: 'Loyer, charges', icon: 'fa-home', color: '#FF9800', isDefault: true, createdAt: new Date() },
      { id: '4', name: 'Loisirs', description: 'Sorties, cinéma, sport', icon: 'fa-film', color: '#9C27B0', isDefault: true, createdAt: new Date() },
      { id: '5', name: 'Shopping', description: 'Vêtements, électronique', icon: 'fa-shopping-bag', color: '#E91E63', isDefault: true, createdAt: new Date() },
      { id: '6', name: 'Santé', description: 'Médicaments, consultations', icon: 'fa-medkit', color: '#F44336', isDefault: true, createdAt: new Date() },
    ]);
    // In production:
    // return this.http.get<BudgetCategory[]>(`${this.apiUrl}/categories`);
  }

  // Get user budgets
  getBudgets(): Observable<Budget[]> {
    // Mock data
    return of([
      { id: '1', userId: 'user1', categoryId: '1', amount: 500, period: 'monthly', alertThreshold: 80, spentAmount: 420, startDate: new Date(2023, 4, 1), endDate: new Date(2023, 4, 30), createdAt: new Date() },
      { id: '2', userId: 'user1', categoryId: '2', amount: 200, period: 'monthly', alertThreshold: 80, spentAmount: 180, startDate: new Date(2023, 4, 1), endDate: new Date(2023, 4, 30), createdAt: new Date() },
      { id: '3', userId: 'user1', categoryId: '3', amount: 800, period: 'monthly', alertThreshold: 90, spentAmount: 800, startDate: new Date(2023, 4, 1), endDate: new Date(2023, 4, 30), createdAt: new Date() },
      { id: '4', userId: 'user1', categoryId: '4', amount: 150, period: 'monthly', alertThreshold: 75, spentAmount: 190, startDate: new Date(2023, 4, 1), endDate: new Date(2023, 4, 30), createdAt: new Date() },
      { id: '5', userId: 'user1', categoryId: '5', amount: 300, period: 'monthly', alertThreshold: 80, spentAmount: 110, startDate: new Date(2023, 4, 1), endDate: new Date(2023, 4, 30), createdAt: new Date() },
      { id: '6', userId: 'user1', categoryId: '6', amount: 100, period: 'monthly', alertThreshold: 70, spentAmount: 30, startDate: new Date(2023, 4, 1), endDate: new Date(2023, 4, 30), createdAt: new Date() },
    ]);
    // In production:
    // return this.http.get<Budget[]>(`${this.apiUrl}`);
  }

  // Get budget summary with category details
  getBudgetSummary(): Observable<BudgetSummary> {
    return this.getBudgets().pipe(
      map(budgets => {
        let totalBudget = 0;
        let totalSpent = 0;
        const categorySummaries = [];

        // First pass to calculate totals
        budgets.forEach(budget => {
          totalBudget += budget.amount;
          totalSpent += budget.spentAmount;
        });

        // Second pass to create category summaries with percentages
        return {
          totalBudget,
          totalSpent,
          percentageSpent: Math.round((totalSpent / totalBudget) * 100),
          remainingBudget: totalBudget - totalSpent,
          categorySummaries: budgets.map(budget => {
            const percentageSpent = Math.round((budget.spentAmount / budget.amount) * 100);
            return {
              categoryId: budget.categoryId,
              categoryName: this.getCategoryName(budget.categoryId),
              categoryIcon: this.getCategoryIcon(budget.categoryId),
              categoryColor: this.getCategoryColor(budget.categoryId),
              budgetAmount: budget.amount,
              spentAmount: budget.spentAmount,
              percentageSpent,
              remainingAmount: budget.amount - budget.spentAmount,
              percentageOfTotal: Math.round((budget.spentAmount / totalSpent) * 100)
            };
          })
        };
      })
    );
  }

  // Helper methods for demo data - in production these would use actual category data
  private getCategoryName(categoryId: string): string {
    const categories: Record<string, string> = {
      '1': 'Alimentation',
      '2': 'Transport',
      '3': 'Logement',
      '4': 'Loisirs',
      '5': 'Shopping',
      '6': 'Santé'
    };
    return categories[categoryId] || 'Autre';
  }

  private getCategoryIcon(categoryId: string): string {
    const icons: { [key: string]: string } = {
      '1': 'fa-utensils',
      '2': 'fa-car',
      '3': 'fa-home',
      '4': 'fa-film',
      '5': 'fa-shopping-bag',
      '6': 'fa-medkit'
    };
    return icons[categoryId] || 'fa-question';
  }

  private getCategoryColor(categoryId: string): string {
    const colors: { [key: string]: string } = {
      '1': '#4CAF50',
      '2': '#2196F3',
      '3': '#FF9800',
      '4': '#9C27B0',
      '5': '#E91E63',
      '6': '#F44336'
    };
    return colors[categoryId] || '#607D8B';
  }

  // Get budget alerts
  getBudgetAlerts(): Observable<BudgetAlert[]> {
    return this.getBudgets().pipe(
      map(budgets => {
        const alerts: BudgetAlert[] = [];
        
        budgets.forEach(budget => {
          const percentSpent = Math.round((budget.spentAmount / budget.amount) * 100);
          
          // Alert if over budget
          if (percentSpent > 100) {
            alerts.push({
              id: `alert-${budget.id}-over`,
              category: this.getCategoryName(budget.categoryId),
              categoryIcon: this.getCategoryIcon(budget.categoryId),
              categoryColor: this.getCategoryColor(budget.categoryId),
              message: `Vous avez dépassé votre budget ${this.getCategoryName(budget.categoryId)} de ${percentSpent - 100}%`,
              status: 'exceeded',
              percentage: percentSpent,
              date: new Date()
            });
          } 
          // Alert if near threshold
          else if (percentSpent >= budget.alertThreshold && percentSpent < 100) {
            alerts.push({
              id: `alert-${budget.id}-near`,
              category: this.getCategoryName(budget.categoryId),
              categoryIcon: this.getCategoryIcon(budget.categoryId),
              categoryColor: this.getCategoryColor(budget.categoryId),
              message: `Vous approchez de votre limite de budget ${this.getCategoryName(budget.categoryId)} (${percentSpent}%)`,
              status: 'near-limit',
              percentage: percentSpent,
              date: new Date()
            });
          }
        });
        
        return alerts;
      })
    );
  }

  // Get savings goals
  getSavingsGoals(): Observable<SavingsGoal[]> {
    // Mock data
    return of([
      { 
        id: '1', 
        userId: 'user1', 
        title: 'Vacances', 
        targetAmount: 1500, 
        currentAmount: 950, 
        deadline: new Date(2023, 11, 31), 
        isCompleted: false, 
        color: '#2196F3',
        icon: 'fa-plane',
        createdAt: new Date()
      },
      { 
        id: '2', 
        userId: 'user1', 
        title: 'Nouvelle voiture', 
        targetAmount: 5000, 
        currentAmount: 1200, 
        deadline: new Date(2024, 5, 30), 
        isCompleted: false,
        color: '#FF9800',
        icon: 'fa-car',
        createdAt: new Date()
      }
    ]);
  }

  // Create a new budget
  createBudget(budget: Partial<Budget>): Observable<Budget> {
    // In production, this would be an HTTP POST
    return of({
      id: Math.random().toString(36).substring(7),
      userId: 'user1',
      categoryId: budget.categoryId,
      amount: budget.amount,
      period: budget.period || 'monthly',
      alertThreshold: budget.alertThreshold || 80,
      spentAmount: 0,
      startDate: budget.startDate || new Date(),
      endDate: budget.endDate || new Date(),
      createdAt: new Date(),
    } as Budget);
  }

  // Create a new savings goal
  createSavingsGoal(goal: Partial<SavingsGoal>): Observable<SavingsGoal> {
    // In production, this would be an HTTP POST
    return of({
      id: Math.random().toString(36).substring(7),
      userId: 'user1',
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || 0,
      deadline: goal.deadline,
      isCompleted: false,
      color: goal.color || '#2196F3',
      icon: goal.icon || 'fa-piggy-bank',
      createdAt: new Date(),
    } as SavingsGoal);
  }

  // Update a budget
  updateBudget(id: string, changes: Partial<Budget>): Observable<Budget> {
    // In production, this would be an HTTP PUT/PATCH
    return of({
      id,
      ...changes,
      updatedAt: new Date()
    } as unknown as Budget);
  }

  // Update a savings goal
  updateSavingsGoal(id: string, changes: Partial<SavingsGoal>): Observable<SavingsGoal> {
    // In production, this would be an HTTP PUT/PATCH
    return of({
      id,
      ...changes,
      updatedAt: new Date()
    } as unknown as SavingsGoal);
  }
}