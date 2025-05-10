import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SidebarItem {
  id: string;
  label?: string;
  icon?: string;
  route?: string;
  badge?: string;
  badgeColor?: string;
  divider?: boolean;
  disabled?: boolean;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Input() items: SidebarItem[] = [];
  @Input() collapsed: boolean = false;
  @Input() mobile: boolean = false;
  @Input() showToggle: boolean = true;
  @Input() logo: string = '';
  @Input() logoCollapsed: string = '';
  @Input() appName: string = 'Banking App';
  @Input() userInfo: { name: string; email: string; avatar?: string } | null = null;
  @Input() position: 'left' | 'right' = 'left';
  @Input() theme: 'light' | 'dark' = 'light';
  
  @Output() toggleSidebar = new EventEmitter<boolean>();
  @Output() itemClick = new EventEmitter<SidebarItem>();
  @Output() mobileClose = new EventEmitter<void>();
  
  expandedItems: { [key: string]: boolean } = {};
  
  constructor() {}
  
  toggle() {
    this.collapsed = !this.collapsed;
    this.toggleSidebar.emit(this.collapsed);
  }
  
  toggleItem(item: SidebarItem) {
    if (item.children && item.children.length > 0) {
      this.expandedItems[item.id] = !this.expandedItems[item.id];
    } else {
      this.itemClick.emit(item);
      
      if (this.mobile) {
        this.mobileClose.emit();
      }
    }
  }
  
  isExpanded(item: SidebarItem): boolean {
    return !!this.expandedItems[item.id];
  }
  
  isActive(route: string | undefined): boolean {
    if (!route) return false;
    // Add your active route logic here
    // For example:
    return window.location.pathname.startsWith(route);
  }
  
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.mobile) {
      // Check if click was outside sidebar
      const sidebar = document.querySelector('.sidebar-container');
      const isClickedOutside = sidebar && !sidebar.contains(event.target as Node);
      
      if (isClickedOutside) {
        this.mobileClose.emit();
      }
    }
  }
  
  get sidebarClass(): string {
    let classes = 'sidebar-container transition-all duration-300';
    
    if (this.mobile) {
      classes += ' fixed inset-y-0 z-50';
    } else {
      classes += ' h-screen';
    }
    
    classes += this.position === 'left' ? ' left-0' : ' right-0';
    classes += this.theme === 'dark' ? ' bg-gray-900 text-white' : ' bg-white text-gray-800';
    
    return classes;
  }
  
  get sidebarWidth(): string {
    return this.collapsed ? 'w-16' : 'w-64';
  }
  
  get overlayClass(): string {
    return this.mobile ? 'fixed inset-0 bg-black bg-opacity-50 z-40' : 'hidden';
  }
}