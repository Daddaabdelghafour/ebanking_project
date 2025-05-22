import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ClientService } from '../../services/client/client.service';
import { Client } from '../../shared/models/client.model';
import { ChatbotComponent } from '../../features/client/chatbot/chatbot.component';

interface SidebarItem {
  id: string;
  label?: string;
  icon?: string;
  route?: string;
  badge?: string;
  divider?: boolean;
}

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, ChatbotComponent],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.css']
})
export class ClientLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  currentClient: Client | null = null;
  isLoading = true;
  showNotifications = false;
  
  // Navigation simplifiée et organisée
  sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'fa-solid fa-house',
      route: ''
    },
    {
      id: 'accounts',
      label: 'Mes comptes',
      icon: 'fa-solid fa-wallet',
      route: 'accounts'
    },
    {
      id: 'transfers',
      label: 'Virements',
      icon: 'fa-solid fa-arrow-right-arrow-left',
      route: 'transfers'
    },
    {
      id: 'crypto',
      label: 'Crypto',
      icon: 'fa-brands fa-bitcoin',
      route: 'crypto'
    },
    { 
      id: 'divider-1',
      divider: true
    },
    {
      id: 'budget',
      label: 'Budget',
      icon: 'fa-solid fa-chart-pie',
      route: 'budget'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: 'fa-solid fa-file-lines',
      route: 'documents'
    },
    {
      id: 'announcements',
      label: 'Annonces',
      icon: 'fa-solid fa-bullhorn',
      route: 'announcements'
    },
    { 
      id: 'divider-2',
      divider: true
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: 'fa-solid fa-gear',
      route: 'settings'
    }
  ];
  
  // Informations utilisateur simplifiées
  userInfo = {
    name: 'Chargement...',
    email: 'chargement@example.com',
    accountNumber: '',
    balance: 0
  };
  
  notifications: Notification[] = [];
  
  constructor(private clientService: ClientService) {}
  
  ngOnInit(): void {
    this.loadClientData();
    this.loadNotifications();
  }
  
  loadClientData(): void {
    const clientId = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';
    
    this.isLoading = true;
    this.clientService.getClientById(clientId).subscribe({
      next: (client) => {
        if (client) {
          this.currentClient = client;
          this.userInfo = {
            name: `${client.firstName} ${client.lastName}`,
            email: client.email || 'client@example.com',
            accountNumber: client.clientId || 'N/A',
            balance: client.balance || 0
          };
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données client', err);
        this.userInfo = {
          name: 'Utilisateur',
          email: 'user@example.com',
          accountNumber: 'N/A',
          balance: 0
        };
        this.isLoading = false;
      }
    });
  }
  
  loadNotifications(): void {
    this.notifications = [
      {
        id: '1',
        message: 'Virement reçu de 1,500 MAD',
        time: 'Il y a 5 min',
        read: false,
        type: 'success'
      },
      {
        id: '2',
        message: 'Transfert effectué avec succès',
        time: 'Il y a 2h',
        read: false,
        type: 'info'
      },
      {
        id: '3',
        message: 'Nouveau relevé disponible',
        time: 'Il y a 1 jour',
        read: true,
        type: 'info'
      }
    ];
  }
  
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }
  
  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }
  
  logout(): void {
    console.log('Déconnexion');
    window.location.href = '/auth/login';
  }
  
  getUnreadNotificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
  
  getUserInitials(): string {
    if (!this.userInfo?.name || this.userInfo.name === 'Chargement...') return 'U';
    
    const names = this.userInfo.name.split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  }
  
  formatBalance(): string {
    try {
      return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD'
      }).format(this.userInfo.balance);
    } catch (e) {
      return `${this.userInfo.balance} MAD`;
    }
  }
  
  // Ajoutez cette méthode dans le composant :
getCurrentDate(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());
}

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return 'fa-circle-check text-green-500';
      case 'warning': return 'fa-triangle-exclamation text-yellow-500';
      case 'info': 
      default: return 'fa-circle-info text-blue-500';
    }
  }
}