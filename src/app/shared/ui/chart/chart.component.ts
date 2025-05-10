import { Component, Input, OnInit, OnChanges, ElementRef, ViewChild, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

// Note: This component assumes Chart.js is added to your project
// You would need to install Chart.js: npm install chart.js

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent implements OnInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea' = 'line';
  @Input() data: any = null;
  @Input() options: any = {};
  @Input() height: number = 300;
  @Input() responsive: boolean = true;
  @Input() maintainAspectRatio: boolean = true;
  @Input() colors: string[] = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
    '#14B8A6'  // teal-500
  ];
  
  private chart: any;
  private chartInitialized: boolean = false;
  
  constructor() {}
  
  ngOnInit() {
    this.loadChartJsIfNeeded().then(() => {
      if (this.data) {
        this.initChart();
      }
    });
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if ((changes['data'] || changes['type'] || changes['options']) && this.chartInitialized) {
      this.updateChart();
    }
  }
  
  private async loadChartJsIfNeeded(): Promise<void> {
    if (!(window as any).Chart) {
      const Chart = await import('chart.js/auto');
      (window as any).Chart = Chart.default;
    }
    return Promise.resolve();
  }
  
  private initChart() {
    if (!this.chartCanvas || !this.data) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const chartData = this.processData();
    
    const defaultOptions = {
      responsive: this.responsive,
      maintainAspectRatio: this.maintainAspectRatio,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: "'Inter', 'Helvetica', 'Arial', sans-serif"
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#1F2937',
          bodyColor: '#1F2937',
          bodyFont: {
            family: "'Inter', 'Helvetica', 'Arial', sans-serif"
          },
          padding: 12,
          boxPadding: 6,
          borderColor: '#E5E7EB',
          borderWidth: 1
        }
      }
    };
    
    const mergedOptions = { ...defaultOptions, ...this.options };
    
    this.chart = new (window as any).Chart(ctx, {
      type: this.type,
      data: chartData,
      options: mergedOptions
    });
    
    this.chartInitialized = true;
  }
  
  private updateChart() {
    if (!this.chart) {
      this.initChart();
      return;
    }
    
    const chartData = this.processData();
    
    this.chart.data = chartData;
    this.chart.options = { ...this.chart.options, ...this.options };
    this.chart.type = this.type;
    this.chart.update();
  }
  
  private processData() {
    // Process different data structures based on chart type
    if (['pie', 'doughnut', 'polarArea'].includes(this.type)) {
      return this.processPieChartData();
    } else {
      return this.processLineBarChartData();
    }
  }
  
  private processPieChartData() {
    if (!this.data || !this.data.labels || !this.data.datasets) {
      return { labels: [], datasets: [] };
    }
    
    const datasets = this.data.datasets.map((dataset: any, index: number) => {
      return {
        ...dataset,
        backgroundColor: dataset.backgroundColor || this.getColorArray(this.data.labels.length),
        borderColor: dataset.borderColor || '#FFFFFF',
        borderWidth: dataset.borderWidth || 2
      };
    });
    
    return {
      labels: this.data.labels,
      datasets
    };
  }
  
  private processLineBarChartData() {
    if (!this.data || !this.data.labels || !this.data.datasets) {
      return { labels: [], datasets: [] };
    }
    
    const datasets = this.data.datasets.map((dataset: any, index: number) => {
      const color = this.colors[index % this.colors.length];
      
      if (this.type === 'line') {
        return {
          ...dataset,
          borderColor: dataset.borderColor || color,
          backgroundColor: dataset.backgroundColor || this.hexToRgba(color, 0.2),
          pointBackgroundColor: dataset.pointBackgroundColor || color,
          pointBorderColor: dataset.pointBorderColor || '#FFFFFF',
          pointHoverBackgroundColor: dataset.pointHoverBackgroundColor || '#FFFFFF',
          pointHoverBorderColor: dataset.pointHoverBorderColor || color,
          tension: dataset.tension !== undefined ? dataset.tension : 0.4
        };
      } else {
        return {
          ...dataset,
          backgroundColor: dataset.backgroundColor || this.hexToRgba(color, 0.7),
          borderColor: dataset.borderColor || color,
          borderWidth: dataset.borderWidth || 1,
          hoverBackgroundColor: dataset.hoverBackgroundColor || color,
          hoverBorderColor: dataset.hoverBorderColor || this.hexToRgba(color, 0.9),
        };
      }
    });
    
    return {
      labels: this.data.labels,
      datasets
    };
  }
  
  private getColorArray(count: number): string[] {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(this.colors[i % this.colors.length]);
    }
    return colors;
  }
  
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}