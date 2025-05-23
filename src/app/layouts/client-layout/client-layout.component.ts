import { Component, OnInit, HostListener } from '@angular/core';
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
  showUserMenu = false;
  
  // Navigation simplifiée et organisée
  sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'fas fa-home',
      route: ''
    },
    {
      id: 'accounts',
      label: 'Mes comptes',
      icon: 'fas fa-wallet',
      route: 'accounts'
    },
    {
      id: 'transfers',
      label: 'Virements',
      icon: 'fas fa-exchange-alt',
      route: 'transfers'
    },
    {
      id: 'crypto',
      label: 'Crypto',
      icon: 'fab fa-bitcoin',
      route: 'crypto'
    },
    { 
      id: 'divider-1',
      divider: true
    },
    {
      id: 'budget',
      label: 'Budget',
      icon: 'fas fa-chart-pie',
      route: 'budget'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: 'fas fa-file-alt',
      route: 'documents'
    },
    {
      id: 'announcements',
      label: 'Annonces',
      icon: 'fas fa-bullhorn',
      route: 'announcements'
    },
    { 
      id: 'divider-2',
      divider: true
    },
    {
      id: 'alert-settings',
      label: 'Alertes',
      icon: 'fas fa-bell',
      route: 'alert-settings'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: 'fas fa-cog',
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

  /**
   * Fermer les menus quand on clique ailleurs
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notifications-container') && !target.closest('.notification-button')) {
      this.showNotifications = false;
    }
    if (!target.closest('.user-menu-container') && !target.closest('.user-menu-button')) {
      this.showUserMenu = false;
    }
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
          name: 'Mohammed Alami',
          email: 'mohammed.alami@email.com',
          accountNumber: 'ACC-2024-001',
          balance: 15750
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
        message: 'Solde faible détecté',
        time: 'Il y a 3h',
        read: false,
        type: 'warning'
      },
      {
        id: '4',
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
    this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }
  
  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
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
      case 'success': return 'fa-check-circle text-green-500';
      case 'warning': return 'fa-exclamation-triangle text-yellow-500';
      case 'info': 
      default: return 'fa-info-circle text-blue-500';
    }
  }

  /**
   * Formater la date relative
   */
  formatRelativeTime(timeString: string): string {
    return timeString; // Déjà formaté dans les données
  }
}