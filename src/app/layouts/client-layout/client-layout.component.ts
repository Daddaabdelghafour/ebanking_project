import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

// Define sidebar item interface locally
interface SidebarItem {
  id: string;
  label?: string;
  icon?: string;
  route?: string;
  badge?: string;
  divider?: boolean;
}

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.css']
})
export class ClientLayoutComponent {
  sidebarCollapsed = false;
  
  // Define sidebar navigation items
  sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fa-solid fa-gauge-high',
      route: '/dashboard'
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: 'fa-solid fa-wallet',
      route: '/accounts'
    },
    {
      id: 'cards',
      label: 'Cards',
      icon: 'fa-solid fa-credit-card',
      route: '/cards'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: 'fa-solid fa-exchange-alt',
      route: '/transactions',
      badge: '3'
    },
    { 
      id: 'divider-1',
      divider: true
    },
    {
      id: 'transfers',
      label: 'Transfers',
      icon: 'fa-solid fa-paper-plane',
      route: '/transfers'
    },
    {
      id: 'payments',
      label: 'Bill Payments',
      icon: 'fa-solid fa-file-invoice',
      route: '/payments'
    },
    { 
      id: 'divider-2',
      divider: true
    },
    {
      id: 'profile',
      label: 'Profile Settings',
      icon: 'fa-solid fa-user-gear',
      route: '/profile'
    },
    {
      id: 'security',
      label: 'Security Settings',
      icon: 'fa-solid fa-shield-halved',
      route: '/security'
    }
  ];
  
  // Mock user information
  userInfo = {
    name: 'Nick Karam',
    email: 'nick@example.com',
    role: 'Client'
  };
  
  // Sample notifications
  notifications = [
    { message: 'Payment received', time: '5 minutes ago' },
    { message: 'Transfer completed', time: '2 hours ago' },
    { message: 'New card activated', time: '1 day ago' }
  ];
  
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  // Handler for notification click
  handleNotificationClick() {
    console.log('Notification clicked');
    // Implement notification handling logic
  }
}