import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategorySpendingSummary } from '../../../../../shared/models/budget.model';

// This is a placeholder for Chart.js integration
// In a real app, you would import Chart.js and use it properly
declare var Chart: any;

@Component({
  selector: 'app-expense-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-chart.component.html',
  styleUrls: ['./expense-chart.component.css']
})
export class ExpenseChartComponent implements OnInit, OnChanges {
  @Input() categorySummaries: CategorySpendingSummary[] = [];
  
  constructor() { }
  
  ngOnInit(): void {
    this.renderChart();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categorySummaries']) {
      this.renderChart();
    }
  }

   getStrokeDashOffset(index: number): number {
    if (!this.categorySummaries || this.categorySummaries.length === 0) {
      return 0;
    }
    
    // Calculer la somme des pourcentages des catégories précédentes
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += this.categorySummaries[i].percentageOfTotal;
    }
    
    // Le décalage doit être négatif pour l'animation SVG
    return -offset;
  }
  
  renderChart(): void {
    // This is a placeholder - in a real application, you would use Chart.js or another charting library
    // For example:
    
    /*
    if (this.categorySummaries.length === 0) return;
    
    const ctx = document.getElementById('expenseChart') as HTMLCanvasElement;
    
    if (ctx) {
      const data = {
        labels: this.categorySummaries.map(cat => cat.categoryName),
        datasets: [{
          data: this.categorySummaries.map(cat => cat.spentAmount),
          backgroundColor: this.categorySummaries.map(cat => cat.categoryColor),
          hoverOffset: 4
        }]
      };
      
      new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
            }
          }
        }
      });
    }
    */
  }
}