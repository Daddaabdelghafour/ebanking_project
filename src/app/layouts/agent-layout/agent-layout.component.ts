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
  selector: 'app-agent-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './agent-layout.component.html',
  styleUrls: ['./agent-layout.component.css']
})
export class AgentLayoutComponent {
  sidebarCollapsed = false;
  
  // Define sidebar navigation items
  sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'fa-solid fa-gauge-high',
      route: '/bank-agent/dashboard'
    },
    {
      id: 'enrollment',
      label: 'Enrôlement Clients',
      icon: 'fa-solid fa-user-plus',
      route: '/bank-agent/client-enrollment',
      badge: '2'
    },
    {
      id: 'transactions',
      label: 'Vérification Transactions',
      icon: 'fa-solid fa-money-check-dollar',
      route: '/bank-agent/transaction-verification',
      badge: '5'
    },
    { 
      id: 'divider-1',
      divider: true
    },
    {
      id: 'profile',
      label: 'Mon Profil',
      icon: 'fa-solid fa-user-gear',
      route: '/bank-agent/profile'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: 'fa-solid fa-gear',
      route: '/bank-agent/settings'
    }
  ];
  
  // Mock agent information
  userInfo = {
    name: 'Sarah Martin',
    email: 'sarah.m@bankagent.com',
    role: 'Agent Bancaire',
    branch: 'Agence Centrale'
  };
  
  // Pending notifications
  notifications = [
    { message: 'Nouveau client en attente d\'approbation', time: '5 minutes', type: 'client' },
    { message: 'Transaction suspecte à vérifier', time: '10 minutes', type: 'transaction' },
    { message: 'Mise à jour des procédures', time: '1 heure', type: 'system' }
  ];
  
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  // Handler for notification click
  handleNotificationClick(notification: any) {
    console.log('Notification clicked', notification);
    // Implement notification handling logic
  }
}