import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
  @Input() type: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() icon: string | null = null;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() loading: boolean = false;
  
  @Output() btnClick = new EventEmitter<MouseEvent>();
  
  get classes(): string {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 py-2 px-4',
      lg: 'h-12 px-6 text-lg'
    };
    
    const typeClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:ring-gray-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-500',
      info: 'bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-800 focus-visible:ring-gray-500'
    };
    
    const fullWidthClass = this.fullWidth ? 'w-full' : '';
    
    return `${baseClasses} ${sizeClasses[this.size]} ${typeClasses[this.type]} ${fullWidthClass}`;
  }
  
  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.btnClick.emit(event);
    }
  }
}