import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css'
})
export class ProgressBarComponent implements OnChanges {
  @Input() value: number = 0;
  @Input() max: number = 100;
  @Input() min: number = 0;
  @Input() height: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'primary';
  @Input() showLabel: boolean = true;
  @Input() labelPosition: 'top' | 'inside' | 'right' = 'top';
  @Input() striped: boolean = false;
  @Input() animated: boolean = false;
  @Input() rounded: boolean = true;
  @Input() showValue: boolean = true;
  @Input() valueFormatter: (value: number, max: number) => string = (value, max) => `${Math.round(value)}%`;
  
  actualValue: number = 0;
  percentage: number = 0;
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['max'] || changes['min']) {
      this.calculatePercentage();
    }
  }
  
  calculatePercentage(): void {
    // Ensure value is within min and max range
    this.actualValue = Math.min(Math.max(this.value, this.min), this.max);
    
    // Calculate percentage
    const range = this.max - this.min;
    this.percentage = range > 0 ? ((this.actualValue - this.min) / range) * 100 : 0;
  }
  
  get formattedValue(): string {
    return this.valueFormatter(this.percentage, this.max);
  }
  
  get heightClass(): string {
    const heights = {
      xs: 'h-1',
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6'
    };
    return heights[this.height];
  }
  
  get barClasses(): string {
    const baseClasses = 'transition-all duration-300 ease-out';
    
    const variantClasses = {
      primary: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-500',
      danger: 'bg-red-600',
      info: 'bg-purple-600'
    };
    
    const stripedClass = this.striped ? 'progress-bar-striped' : '';
    const animatedClass = this.animated ? 'progress-bar-animated' : '';
    const roundedClass = this.rounded ? 'rounded-full' : '';
    
    return `${baseClasses} ${variantClasses[this.variant]} ${stripedClass} ${animatedClass} ${roundedClass}`;
  }
  
  get containerClasses(): string {
    const baseClasses = 'bg-gray-200 overflow-hidden';
    const roundedClass = this.rounded ? 'rounded-full' : '';
    
    return `${baseClasses} ${this.heightClass} ${roundedClass}`;
  }
  
  get labelClass(): string {
    if (this.labelPosition === 'top') {
      return 'mb-1 text-sm font-medium';
    } else if (this.labelPosition === 'right') {
      return 'ml-3 text-sm font-medium';
    } else {
      // Inside label styling
      return 'absolute inset-0 flex items-center justify-center text-white text-xs font-bold';
    }
  }
  
  get containerStyles(): any {
    return {
      'min-width': '5rem',
      'width': '100%'
    };
  }
  
  get barStyles(): any {
    return {
      'width': `${this.percentage}%`
    };
  }
}