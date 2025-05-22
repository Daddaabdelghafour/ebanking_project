export interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  category?: BudgetCategory; // For UI convenience
  amount: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  alertThreshold: number; // Percentage (e.g., 80 means alert at 80% of budget used)
  spentAmount: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  percentageSpent: number;
  remainingBudget: number;
  categorySummaries: CategorySpendingSummary[];
}

export interface CategorySpendingSummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  percentageSpent: number;
  remainingAmount: number;
  percentageOfTotal: number; // For pie chart representation
}

export interface BudgetAlert {
  id: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  message: string;
  status: 'warning' | 'exceeded' | 'near-limit'; // Alert type
  percentage: number; // How far over/under budget
  date: Date;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  isCompleted: boolean;
  color?: string;
  icon: string;
  createdAt: Date;
  updatedAt?: Date;
  
}