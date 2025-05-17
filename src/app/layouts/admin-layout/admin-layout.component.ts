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
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  sidebarCollapsed = false;
  
  // Define sidebar navigation items
  sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fa-solid fa-gauge-high',
      route: '/admin/dashboard'
    },
    {
      id: 'currencies',
      label: 'Currencies',
      icon: 'fa-solid fa-money-bill-transfer',
      route: '/admin/currencies'
    },
    {
      id: 'agent management',
      label: 'agent management',
      icon: 'fa-solid fa-gears',
      route: '/admin/client-management'
    },
    {
      id: 'client management',
      label: 'Client Management',
      icon: 'fa-solid fa-gears',
      route: '/admin/agent-management'},
    {
      id: 'settings',
      label: 'System Settings',
      icon: 'fa-solid fa-gears',
      route: '/admin/settings'
    },
  ];
  
  // Mock admin information
  userInfo = {
    name: 'Admin User',
    email: 'admin@banking.com',
    role: 'Administrator'
  };
  
  // Sample alerts
  notifications = [
    { message: 'Security alert: Failed login attempts', time: '5 minutes ago', type: 'danger' },
    { message: 'New user registration', time: '2 hours ago', type: 'info' },
    { message: 'System update completed', time: '1 day ago', type: 'success' }
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