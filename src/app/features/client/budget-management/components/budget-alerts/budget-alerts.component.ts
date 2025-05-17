import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetAlert } from '../../../../../shared/models/budget.model';

@Component({
  selector: 'app-budget-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget-alerts.component.html',
  styleUrls: ['./budget-alerts.component.css']
})
export class BudgetAlertsComponent {
  @Input() alerts: BudgetAlert[] = [];
  
  constructor() { }
  
  getAlertIconClass(status: string): string {
    switch(status) {
      case 'exceeded':
        return 'fa-circle-exclamation text-red-600';
      case 'near-limit':
        return 'fa-exclamation-triangle text-yellow-600';
      default:
        return 'fa-info-circle text-blue-600';
    }
  }
  
  getAlertBgClass(status: string): string {
    switch(status) {
      case 'exceeded':
        return 'bg-red-50';
      case 'near-limit':
        return 'bg-yellow-50';
      default:
        return 'bg-blue-50';
    }
  }
  
  getAlertTextClass(status: string): string {
    switch(status) {
      case 'exceeded':
        return 'text-red-800';
      case 'near-limit':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  }
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}