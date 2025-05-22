import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ClientService } from '../../services/client/client.service';
import { Client } from '../../shared/models/client.model';
import { ChatbotComponent } from '../../features/client/chatbot/chatbot.component';

// Define sidebar item interface
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
}

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet,ChatbotComponent],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.css']
})
export class ClientLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  currentClient: Client | null = null;
  isLoading = true;
  
  // Define sidebar navigation items with the correct routes
  sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'fa-solid fa-gauge-high',
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
      icon: 'fa-solid fa-paper-plane',
      route: 'transfers'
    },
    {
      id: 'bills',
      label: 'Factures',
      icon: 'fa-solid fa-file-invoice',
      route: 'bills'
    },
    {
      id: 'recharges',
      label: 'Recharges',
      icon: 'fa-solid fa-mobile-screen',
      route: 'recharges'
    },
    {
      id: 'crypto',
      label: 'Portefeuille Crypto',
      icon: 'fa-solid fa-coins',
      route: 'crypto',
    },
    { 
      id: 'divider-1',
      divider: true
    },
    {
      id: 'referrals',
      label: 'Parrainage',
      icon: 'fa-solid fa-user-plus',
      route: 'referrals',
      badge: 'New'
    },
    {
  id: 'budget',
  label: 'Gestion Budgétaire',
  icon: 'fa-solid fa-chart-pie',
  route: '/budget'
},
{
    label: 'Documents',
    icon: 'fa-solid fa-file-invoice',  // Ou un autre icône approprié
    route: '/documents',
    id: 'documents-nav'  // Ajout d'un ID unique pour le lien Documents
  },
  {
  id: 'announcements',
  label: 'Annonces',
  icon: 'fa-solid fa-bullhorn',
  route: 'announcements',
},
{
  id: 'alert-settings',
  label: 'Alertes',
  icon: 'fa-solid fa-bell',
  route: 'alert-settings',
},
    {
      id: 'settings',
      label: 'Paramètres',
      icon: 'fa-solid fa-gear',
      route: 'settings'
    },
    
    { 
      id: 'divider-2',
      divider: true
    },
  ];
  
  // User information - will be populated from service
  userInfo = {
    name: 'Chargement...',
    email: 'chargement@example.com',
    role: 'Client'
  };
  
  // Notifications - will be updated with dynamic data
  notifications: Notification[] = [];
  
  constructor(private clientService: ClientService) {}
  
  ngOnInit(): void {
    this.loadClientData();
    this.loadNotifications();
  }
  
  loadClientData(): void {
    // Pour la démonstration, nous utilisons le premier client
    // Dans une application réelle, vous récupéreriez l'ID client à partir
    // du service d'authentification ou du stockage local
    const clientId = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';
    
    this.isLoading = true;
    this.clientService.getClientById(clientId).subscribe({
      next: (client) => {
        if (client) {
          this.currentClient = client;
          this.userInfo = {
            name: `${client.firstName} ${client.lastName}`,
            email: client.email || 'client@example.com',
            role: 'Client'
          };
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données client', err);
        this.isLoading = false;
      }
    });
  }
  
  loadNotifications(): void {
    // Dans une application réelle, ces notifications seraient chargées depuis une API
    this.notifications = [
      {
        id: '1',
        message: 'Virement reçu de 1500 MAD',
        time: 'Il y a 5 minutes',
        read: false
      },
      {
        id: '2',
        message: 'Transfert vers compte épargne effectué',
        time: 'Il y a 2 heures',
        read: false
      },
      {
        id: '3',
        message: 'Nouveau relevé bancaire disponible',
        time: 'Il y a 1 jour',
        read: true
      }
    ];
  }
  
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  handleNotificationClick(): void {
    console.log('Notifications ouvertes');
    // Implémenter l'affichage des notifications
  }
  
  logout(): void {
    console.log('Déconnexion');
    // Implémenter la logique de déconnexion
    // Puis rediriger vers la page de connexion
    window.location.href = '/auth/login';
  }
  
  getUnreadNotificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
  
// Cette méthode sera utilisée pour extraire les initiales du nom d'utilisateur
// Ajoutez cette propriété calculée
  getUserInitials(): string {
  return this.userInfo?.name ? 
    (this.userInfo.name.charAt(0) || 'U').toUpperCase() : 
    'U';
}
}