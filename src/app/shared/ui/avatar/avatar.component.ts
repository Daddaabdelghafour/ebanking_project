import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css'
})
export class AvatarComponent implements OnInit {
  @Input() src: string | null = null;
  @Input() alt: string = '';
  @Input() name: string = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() shape: 'circle' | 'square' = 'circle';
  @Input() status: 'online' | 'offline' | 'away' | 'busy' | null = null;
  @Input() border: boolean = false;
  @Input() badge: string | number | null = null;
  @Input() bgColor: string | null = null;

  initials: string = '';
  imageError: boolean = false;

  ngOnInit() {
    this.generateInitials();
  }

  generateInitials() {
    if (!this.name) return;

    const nameParts = this.name.trim().split(' ');
    if (nameParts.length === 0) return;

    if (nameParts.length === 1) {
      this.initials = nameParts[0].charAt(0).toUpperCase();
    } else {
      this.initials = (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }
  }

  onImageError() {
    this.imageError = true;
  }

  get avatarClasses(): string {
    const baseClasses = 'inline-flex items-center justify-center font-medium';
    
    const sizeClasses = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl'
    };
    
    const shapeClasses = {
      circle: 'rounded-full',
      square: 'rounded-md'
    };
    
    const borderClass = this.border ? 'border-2 border-white' : '';
    
    return `${baseClasses} ${sizeClasses[this.size]} ${shapeClasses[this.shape]} ${borderClass}`;
  }

  get avatarBgColor(): string {
    if (this.bgColor) return this.bgColor;
    
    // Generate a consistent color based on the name
    if (this.name) {
      const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500'
      ];
      
      const index = this.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
      return colors[index];
    }
    
    return 'bg-gray-400';
  }

  get statusClasses(): string {
    if (!this.status) return '';
    
    const baseClasses = 'absolute rounded-full ring-2 ring-white';
    const sizeClassMap = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4'
    };
    
    const colorClassMap = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500'
    };
    
    return `${baseClasses} ${sizeClassMap[this.size]} ${colorClassMap[this.status]}`;
  }

  get positionClasses(): string {
    return this.shape === 'circle' 
      ? 'bottom-0 right-0 transform translate-y-1/4 translate-x-1/4' 
      : 'bottom-0 right-0 transform translate-y-1/3 translate-x-1/3';
  }
}