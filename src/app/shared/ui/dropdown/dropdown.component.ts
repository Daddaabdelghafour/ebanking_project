import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
  id: string | number;
  label: string;
  value: any;
  icon?: string;
  disabled?: boolean;
  description?: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.css'
})
export class DropdownComponent implements OnInit {
  @ViewChild('dropdownButton') dropdownButton!: ElementRef;
  @ViewChild('dropdownMenu') dropdownMenu!: ElementRef;
  
  @Input() options: DropdownOption[] = [];
  @Input() placeholder: string = 'Select option';
  @Input() label: string = '';
  @Input() selected: any = null;
  @Input() disabled: boolean = false;
  @Input() error: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() width: string = 'w-full';
  @Input() position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' = 'bottom-left';
  @Input() showSelectedIcon: boolean = true;
  @Input() multiSelect: boolean = false;
  
  @Output() selectionChange = new EventEmitter<any>();
  
  isOpen: boolean = false;
  selectedOptions: DropdownOption[] = [];
  highlightedIndex: number = -1;
  
  constructor(private elementRef: ElementRef) {}
  
  ngOnInit() {
    // Initialize selected options
    if (this.multiSelect && Array.isArray(this.selected)) {
      this.selectedOptions = this.options.filter(option => 
        this.selected.includes(option.value)
      );
    } else if (!this.multiSelect && this.selected !== null) {
      const selectedOption = this.options.find(option => option.value === this.selected);
      if (selectedOption) {
        this.selectedOptions = [selectedOption];
      }
    }
  }
  
  toggleDropdown() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      setTimeout(() => {
        this.highlightSelectedOption();
      }, 0);
    }
  }
  
  closeDropdown() {
    this.isOpen = false;
  }
  
  selectOption(option: DropdownOption, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    
    if (option.disabled) return;
    
    if (this.multiSelect) {
      const index = this.selectedOptions.findIndex(selected => selected.id === option.id);
      
      if (index === -1) {
        this.selectedOptions = [...this.selectedOptions, option];
      } else {
        this.selectedOptions = this.selectedOptions.filter(selected => selected.id !== option.id);
      }
      
      this.selectionChange.emit(this.selectedOptions.map(option => option.value));
    } else {
      this.selectedOptions = [option];
      this.selectionChange.emit(option.value);
      this.closeDropdown();
    }
  }
  
  isSelected(option: DropdownOption): boolean {
    return this.selectedOptions.some(selected => selected.id === option.id);
  }
  
  highlightSelectedOption() {
    if (this.selectedOptions.length > 0) {
      const firstSelectedOption = this.selectedOptions[0];
      this.highlightedIndex = this.options.findIndex(option => option.id === firstSelectedOption.id);
    }
  }
  
  getButtonClasses(): string {
    const baseClasses = 'flex items-center justify-between w-full px-4 font-medium transition-colors rounded-md focus:outline-none';
    
    const sizeClasses = {
      sm: 'h-8 text-xs',
      md: 'h-10 text-sm',
      lg: 'h-12 text-base'
    };
    
    const stateClasses = this.disabled
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
      : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200';
    
    const errorClass = this.error ? 'border-red-500 focus:ring-red-200' : '';
    
    return `${baseClasses} ${sizeClasses[this.size]} ${stateClasses} ${errorClass}`;
  }
  
  getSelectedText(): string {
    if (this.selectedOptions.length === 0) {
      return this.placeholder;
    }
    
    if (this.multiSelect) {
      if (this.selectedOptions.length === 1) {
        return this.selectedOptions[0].label;
      } else {
        return `${this.selectedOptions.length} items selected`;
      }
    }
    
    return this.selectedOptions[0].label;
  }
  
  getDropdownPositionClasses(): string {
    const positionClasses = {
      'bottom-left': 'top-full left-0 mt-1',
      'bottom-right': 'top-full right-0 mt-1',
      'top-left': 'bottom-full left-0 mb-1',
      'top-right': 'bottom-full right-0 mb-1'
    };
    
    return positionClasses[this.position];
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdown when clicking outside
    const isClickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!isClickedInside && this.isOpen) {
      this.closeDropdown();
    }
  }
  
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvents(event: KeyboardEvent) {
    if (!this.isOpen) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.navigateOptions(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigateOptions(-1);
        break;
      case 'Enter':
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.options.length) {
          this.selectOption(this.options[this.highlightedIndex]);
        }
        break;
      case 'Escape':
        this.closeDropdown();
        break;
      default:
        break;
    }
  }
  
  navigateOptions(direction: number) {
    let newIndex = this.highlightedIndex + direction;
    
    // Loop around when reaching the end
    if (newIndex < 0) {
      newIndex = this.options.length - 1;
    } else if (newIndex >= this.options.length) {
      newIndex = 0;
    }
    
    // Skip disabled options
    while (this.options[newIndex]?.disabled) {
      newIndex += direction;
      if (newIndex < 0) {
        newIndex = this.options.length - 1;
      } else if (newIndex >= this.options.length) {
        newIndex = 0;
      }
    }
    
    this.highlightedIndex = newIndex;
    
    // Scroll to highlighted option
    if (this.dropdownMenu) {
      const menuElement = this.dropdownMenu.nativeElement;
      const highlightedElement = menuElement.children[newIndex];
      
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }
}