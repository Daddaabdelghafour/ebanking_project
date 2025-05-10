import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.css']
})
export class AgentDashboardComponent implements OnInit {
  // Agent information
  agentInfo = {
    name: 'Sarah Martin',
    branch: 'Agence Casablanca Centre',
    dailyGoal: 85,
    dailyProgress: 62
  };

  // Daily statistics
  dailyStats = {
    clientsServed: 14,
    transactionsProcessed: 23,
    newAccounts: 3,
    pendingTasks: 7
  };

  // Tasks to complete
  pendingTasks = [
    {
      id: 'TSK001',
      title: 'Vérification KYC',
      client: 'Hicham Alaoui',
      priority: 'high',
      dueDate: new Date(2023, 4, 15)
    },
    {
      id: 'TSK002',
      title: 'Activation de compte',
      client: 'Amina El Mansouri',
      priority: 'medium',
      dueDate: new Date(2023, 4, 15)
    },
    {
      id: 'TSK003',
      title: 'Remplacement carte bancaire',
      client: 'Karim Benzarti',
      priority: 'low',
      dueDate: new Date(2023, 4, 16)
    },
    {
      id: 'TSK004',
      title: 'Validation transaction',
      client: 'Fatima Zahra Karimi',
      priority: 'high',
      dueDate: new Date(2023, 4, 15)
    },
    {
      id: 'TSK005',
      title: 'Changement d\'adresse',
      client: 'Youssef Tahiri',
      priority: 'medium',
      dueDate: new Date(2023, 4, 17)
    }
  ];

  // Recent clients
  recentClients = [
    {
      id: 'CLT001',
      name: 'Mehdi Belhaj',
      accountType: 'Compte Courant',
      date: new Date(2023, 4, 14),
      status: 'active'
    },
    {
      id: 'CLT002',
      name: 'Souad El Idrissi',
      accountType: 'Compte Épargne',
      date: new Date(2023, 4, 14),
      status: 'pending'
    },
    {
      id: 'CLT003',
      name: 'Omar Chraibi',
      accountType: 'Compte Professionnel',
      date: new Date(2023, 4, 13),
      status: 'active'
    }
  ];

  // Transactions requiring verification
  pendingTransactions = [
    {
      id: 'TRX43219',
      client: 'Nadia El Fassi',
      type: 'Retrait',
      amount: 12000,
      date: new Date(2023, 4, 14, 10, 23),
      status: 'pending'
    },
    {
      id: 'TRX43217',
      client: 'Redouane Khalid',
      type: 'Virement International',
      amount: 35000,
      date: new Date(2023, 4, 14, 9, 15),
      status: 'flagged'
    },
    {
      id: 'TRX43215',
      client: 'Samir Bennani',
      type: 'Dépôt',
      amount: 50000,
      date: new Date(2023, 4, 14, 8, 45),
      status: 'pending'
    }
  ];

  // Announcements
  announcements = [
    {
      id: 1,
      title: 'Nouvelle offre: Épargne Avenir',
      date: new Date(2023, 4, 10),
      content: 'Lancement de notre nouveau produit d\'épargne avec un taux préférentiel de 3,2%.'
    },
    {
      id: 2,
      title: 'Maintenance système',
      date: new Date(2023, 4, 13),
      content: 'Une maintenance système est prévue ce weekend, de samedi 22h à dimanche 6h.'
    }
  ];

  // Current date for the greeting
  currentDate = new Date();
  
  // Time periods
  timePeriods = ['Aujourd\'hui', 'Cette Semaine', 'Ce Mois'];
  selectedPeriod = 'Aujourd\'hui';

  ngOnInit(): void {
    // Initialize data
  }

  // Helper methods
  getDayPeriod(): string {
    const hour = this.currentDate.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(date: Date): string {
    return `${this.formatDate(date)} à ${this.formatTime(date)}`;
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high': return 'fa-solid fa-circle-exclamation';
      case 'medium': return 'fa-solid fa-circle-info';
      case 'low': return 'fa-solid fa-circle-check';
      default: return 'fa-solid fa-circle';
    }
  }

  markTaskComplete(taskId: string) {
    console.log(`Task ${taskId} marked as complete`);
    this.pendingTasks = this.pendingTasks.filter(task => task.id !== taskId);
  }
}