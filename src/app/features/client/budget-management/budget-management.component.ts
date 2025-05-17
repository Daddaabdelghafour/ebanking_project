import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BudgetService } from '../../../services/budget/budget.service';
import { 
  Budget, 
  BudgetCategory, 
  BudgetSummary, 
  BudgetAlert, 
  SavingsGoal,
  CategorySpendingSummary
} from '../../../shared/models/budget.model';
import { ExpenseChartComponent } from './components/expense-chart/expense-chart.component';
import { SavingsGoalTrackerComponent } from './components/savings-goal/savings-goal.component';
import { BudgetAlertsComponent } from './components/budget-alerts/budget-alerts.component';

@Component({
  selector: 'app-budget-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    ExpenseChartComponent,
    SavingsGoalTrackerComponent,
    BudgetAlertsComponent
  ],
  templateUrl: './budget-management.component.html',
  styleUrls: ['./budget-management.component.css']
})
export class BudgetManagementComponent implements OnInit {
  budgetSummary!: BudgetSummary; // Using definite assignment assertion
  categories: BudgetCategory[] = [];
  budgets: Budget[] = [];
  savingsGoals: SavingsGoal[] = [];
  budgetAlerts: BudgetAlert[] = [];
  isLoading = true;
  activeTab = 'overview'; // 'overview', 'budgets', 'goals'
  selectedMonthYear = new Date();
  Math = Math;
  // For budget form
  showBudgetForm = false;
  newBudget = {
    categoryId: '',
    amount: 0,
    period: 'monthly' as 'monthly',
    alertThreshold: 80
  };

  // For savings goal form
  showGoalForm = false;
  newGoal = {
    title: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: new Date()
  };

  constructor(private budgetService: BudgetService) { }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;
    
    // Get categories
    this.budgetService.getCategories().subscribe(
      categories => {
        this.categories = categories;
        
        // Get budgets
        this.budgetService.getBudgets().subscribe(
          budgets => {
            this.budgets = budgets;
            
            // Get budget summary
            this.budgetService.getBudgetSummary().subscribe(
              summary => {
                this.budgetSummary = summary;
                
                // Get alerts
                this.budgetService.getBudgetAlerts().subscribe(
                  alerts => {
                    this.budgetAlerts = alerts;
                    
                    // Get savings goals
                    this.budgetService.getSavingsGoals().subscribe(
                      goals => {
                        this.savingsGoals = goals;
                        this.isLoading = false;
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  toggleBudgetForm(): void {
    this.showBudgetForm = !this.showBudgetForm;
    if (!this.showBudgetForm) {
      // Reset form
      this.newBudget = {
        categoryId: '',
        amount: 0,
        period: 'monthly',
        alertThreshold: 80
      };
    }
  }

  toggleGoalForm(): void {
    this.showGoalForm = !this.showGoalForm;
    if (!this.showGoalForm) {
      // Reset form
      this.newGoal = {
        title: '',
        targetAmount: 0,
        currentAmount: 0,
        deadline: new Date()
      };
    }
  }

  createBudget(): void {
    if (this.newBudget.categoryId && this.newBudget.amount > 0) {
      this.budgetService.createBudget({
        categoryId: this.newBudget.categoryId,
        amount: this.newBudget.amount,
        period: this.newBudget.period,
        alertThreshold: this.newBudget.alertThreshold,
        startDate: new Date(), // First day of current month
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) // Last day of current month
      }).subscribe(
        budget => {
          this.budgets.push(budget);
          this.loadAllData(); // Refresh data
          this.toggleBudgetForm();
        }
      );
    }
  }

  createSavingsGoal(): void {
    if (this.newGoal.title && this.newGoal.targetAmount > 0) {
      this.budgetService.createSavingsGoal({
        title: this.newGoal.title,
        targetAmount: this.newGoal.targetAmount,
        currentAmount: this.newGoal.currentAmount,
        deadline: this.newGoal.deadline
      }).subscribe(
        goal => {
          this.savingsGoals.push(goal);
          this.toggleGoalForm();
        }
      );
    }
  }

  getCategoryById(id: string): BudgetCategory | undefined {
    return this.categories.find(cat => cat.id === id);
  }

  getMonthName(date: Date = new Date()): string {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  getPreviousMonth(): void {
    const date = new Date(this.selectedMonthYear);
    date.setMonth(date.getMonth() - 1);
    this.selectedMonthYear = date;
    // In a real app, reload data for selected month
  }

  getNextMonth(): void {
    const date = new Date(this.selectedMonthYear);
    date.setMonth(date.getMonth() + 1);
    this.selectedMonthYear = date;
    // In a real app, reload data for selected month
  }
}