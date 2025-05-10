import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css'
})
export class BadgeComponent {
  @Input() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'default' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() rounded: boolean = false;
  @Input() dot: boolean = false;
  @Input() outline: boolean = false;
  
  get classes(): string {
    const baseClasses = 'inline-flex items-center font-medium';
    
    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-0.5',
      lg: 'text-base px-3 py-1'
    };
    
    const variantClasses = this.outline ? this.getOutlineVariantClasses() : this.getSolidVariantClasses();
    
    const roundedClass = this.rounded ? 'rounded-full' : 'rounded-md';
    
    return `${baseClasses} ${sizeClasses[this.size]} ${variantClasses} ${roundedClass}`;
  }
  
  private getSolidVariantClasses(): string {
    const classes = {
      primary: 'bg-blue-100 text-blue-800',
      secondary: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      danger: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-purple-100 text-purple-800',
      default: 'bg-gray-100 text-gray-800'
    };
    
    return classes[this.variant];
  }
  
  private getOutlineVariantClasses(): string {
    const classes = {
      primary: 'border border-blue-500 text-blue-700 bg-transparent',
      secondary: 'border border-gray-500 text-gray-700 bg-transparent',
      success: 'border border-green-500 text-green-700 bg-transparent',
      danger: 'border border-red-500 text-red-700 bg-transparent',
      warning: 'border border-yellow-500 text-yellow-700 bg-transparent',
      info: 'border border-purple-500 text-purple-700 bg-transparent',
      default: 'border border-gray-500 text-gray-700 bg-transparent'
    };
    
    return classes[this.variant];
  }
  
  getDotColor(): string {
    const colors = {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
      success: 'bg-green-500',
      danger: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-purple-500',
      default: 'bg-gray-500'
    };
    
    return colors[this.variant];
  }
}