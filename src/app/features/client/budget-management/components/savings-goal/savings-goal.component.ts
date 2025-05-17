import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavingsGoal } from '../../../../../shared/models/budget.model';

@Component({
  selector: 'app-savings-goal-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './savings-goal.component.html', // Correction du chemin du template
  styleUrls: ['./savings-goal.component.css'] // Correction du chemin du style
})
export class SavingsGoalTrackerComponent implements OnInit {
  @Input() goal!: SavingsGoal;
  
  percentComplete: number = 0;
  daysRemaining: number = 0;
  isExpired: boolean = false;
  
  constructor() { }
  
  ngOnInit(): void {
    this.calculateProgress();
  }
  
  calculateProgress(): void {
    if (this.goal) {
      this.percentComplete = Math.min(100, Math.round((this.goal.currentAmount / this.goal.targetAmount) * 100));
      
      if (this.goal.deadline) {
        const today = new Date();
        const deadline = new Date(this.goal.deadline);
        const timeDiff = deadline.getTime() - today.getTime();
        this.daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        this.isExpired = this.daysRemaining < 0;
      }
    }
  }
  
  getRemainingAmount(): number {
    return this.goal.targetAmount - this.goal.currentAmount;
  }
}