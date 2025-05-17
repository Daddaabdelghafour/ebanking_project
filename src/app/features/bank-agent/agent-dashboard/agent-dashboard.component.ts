import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Task } from '../../../shared/models/task.model';
import { TaskService } from '../../../services/task/task.service';
import { Client } from '../../../shared/models/client.model';
import { Announcement } from '../../../shared/models/Announcement.model';
import { TransactionVerification, createVerificationTransaction } from '../../../shared/models/transactionVerification';

interface AgentInfo {
  name: string;
  branch: string;
  dailyGoal: number;
  dailyProgress: number;
}

interface DailyStats {
  clientsServed: number;
  transactionsProcessed: number;
  newAccounts: number;
  pendingTasks: number;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.css']
})
export class AgentDashboardComponent implements OnInit {
  // Agent information
  agentInfo: AgentInfo = {
    name: 'Sarah Martin',
    branch: 'Agence Casablanca Centre',
    dailyGoal: 85,
    dailyProgress: 62
  };

  clientMap: { [key: string]: string } = {
    'CLT123': 'Hicham Alaoui',
    'CLT456': 'Amina El Mansouri',
    'CLT789': 'Karim Benzarti',
    'CLT101': 'Fatima Zahra Karimi',
    'CLT112': 'Youssef Tahiri'
  };

  getClientName(clientId: string): string {
    return this.clientMap[clientId] || clientId;
  }

  // Daily statistics
  dailyStats: DailyStats = {
    clientsServed: 14,
    transactionsProcessed: 23,
    newAccounts: 3,
    pendingTasks: 7
  };

  // Tasks to complete
  pendingTasks: Task[] = [
    {
      id: 'TSK001',
      title: 'Vérification KYC',
      description: 'Vérifier les documents d\'identité du client',
      client_id: 'CLT123',
      priority: 'high',
      status: 'pending',
      created_at: new Date(2023, 4, 14),
      due_date: new Date(2023, 4, 15),
      assigned_to: 'AGT001',
      category: 'verification'
    },
    {
      id: 'TSK002',
      title: 'Activation de compte',
      description: 'Activer le compte bancaire après vérification des documents',
      client_id: 'CLT456',
      priority: 'medium',
      status: 'pending',
      created_at: new Date(2023, 4, 14),
      due_date: new Date(2023, 4, 15),
      assigned_to: 'AGT001',
      category: 'approval'
    },
    {
      id: 'TSK003',
      title: 'Remplacement carte bancaire',
      description: 'Traiter la demande de remplacement de carte bancaire',
      client_id: 'CLT789',
      priority: 'low',
      status: 'pending',
      created_at: new Date(2023, 4, 14),
      due_date: new Date(2023, 4, 16),
      assigned_to: 'AGT001',
      category: 'customer_service'
    },
    {
      id: 'TSK004',
      title: 'Validation transaction',
      description: 'Valider la transaction internationale de montant élevé',
      client_id: 'CLT101',
      priority: 'high',
      status: 'pending',
      created_at: new Date(2023, 4, 14),
      due_date: new Date(2023, 4, 15),
      assigned_to: 'AGT001',
      category: 'approval'
    },
    {
      id: 'TSK005',
      title: 'Changement d\'adresse',
      description: 'Mettre à jour l\'adresse du client dans le système',
      client_id: 'CLT112',
      priority: 'medium',
      status: 'pending',
      created_at: new Date(2023, 4, 14),
      due_date: new Date(2023, 4, 17),
      assigned_to: 'AGT001',
      category: 'customer_service'
    }
  ];

  // Recent clients
  recentClients: Client[] = [
    {
      id: 'CLT001',
      firstName: 'Mehdi',
      lastName: 'Belhaj',
      email: 'mehdi.belhaj@mail.com',
      phone: '+212612345678',
      clientId: 'CLT001',
      address: '123 Rue Mohammed V',
      city: 'Casablanca',
      status: 'active',
      accountType: 'Compte Courant',
      balance: 15000,
      currency: 'MAD',
      imageUrl: '',
      dateJoined: new Date(2023, 4, 14),
      identityNumber: 'AB123456',
      identityType: 'CIN',
      birthDate: new Date(1985, 5, 15),
      accounts: []
    },
    {
      id: 'CLT002',
      firstName: 'Souad',
      lastName: 'El Idrissi',
      email: 'souad.idrissi@mail.com',
      phone: '+212623456789',
      clientId: 'CLT002',
      address: '45 Av Hassan II',
      city: 'Rabat',
      status: 'pending',
      accountType: 'Compte Épargne',
      balance: 25000,
      currency: 'MAD',
      imageUrl: '',
      dateJoined: new Date(2023, 4, 14),
      identityNumber: 'CD789012',
      identityType: 'CIN',
      birthDate: new Date(1990, 8, 20),
      accounts: []
    },
    {
      id: 'CLT003',
      firstName: 'Omar',
      lastName: 'Chraibi',
      email: 'omar.chraibi@mail.com',
      phone: '+212634567890',
      clientId: 'CLT003',
      address: '78 Rue Ibn Battouta',
      city: 'Marrakech',
      status: 'active',
      accountType: 'Compte Professionnel',
      balance: 50000,
      currency: 'MAD',
      imageUrl: '',
      dateJoined: new Date(2023, 4, 13),
      identityNumber: 'EF345678',
      identityType: 'CIN',
      birthDate: new Date(1978, 3, 10),
      accounts: []
    }
  ];

  // Transactions requiring verification
  pendingTransactions: TransactionVerification[] = [
    createVerificationTransaction({
      id: 'TRX43219',
      clientName: 'Nadia El Fassi',
      type: 'withdrawal',
      typeLabel: 'Retrait',
      amount: 12000,
      currency: 'MAD',
      date: new Date(2023, 4, 14, 10, 23),
      status: 'pending'
    }),
    createVerificationTransaction({
      id: 'TRX43217',
      clientName: 'Redouane Khalid',
      type: 'transfer',
      typeLabel: 'Virement International',
      amount: 35000,
      currency: 'MAD',
      date: new Date(2023, 4, 14, 9, 15),
      status: 'flagged'
    }),
    createVerificationTransaction({
      id: 'TRX43215',
      clientName: 'Samir Bennani',
      type: 'deposit',
      typeLabel: 'Dépôt',
      amount: 50000,
      currency: 'MAD',
      date: new Date(2023, 4, 14, 8, 45),
      status: 'pending'
    })
  ];

  // Announcements
  announcements: Announcement[] = [
    {
      id: '1',
      title: 'Nouvelle offre: Épargne Avenir',
      content: 'Lancement de notre nouveau produit d\'épargne avec un taux préférentiel de 3,2%.',
      date: new Date(2023, 4, 10),
      author: 'Direction Commerciale',
      isImportant: true,
      category: 'promotion',
      createdAt: new Date(2023, 4, 10)
    },
    {
      id: '2',
      title: 'Maintenance système',
      content: 'Une maintenance système est prévue ce weekend, de samedi 22h à dimanche 6h.',
      date: new Date(2023, 4, 13),
      author: 'Direction Informatique',
      isImportant: true,
      category: 'maintenance',
      createdAt: new Date(2023, 4, 13)
    }
  ];

  // Current date for the greeting
  currentDate = new Date();
  
  // Time periods
  timePeriods = ['Aujourd\'hui', 'Cette Semaine', 'Ce Mois'];
  selectedPeriod = 'Aujourd\'hui';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    // Initialize data
    // this.loadTasks();
  }

  loadTasks(): void {
    // Dans un environnement de production
    this.taskService.getTasksByAgent('AGT001').subscribe(tasks => {
      this.pendingTasks = tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
      this.dailyStats.pendingTasks = this.pendingTasks.length;
    });
  }

  markTaskComplete(taskId: string): void {
    // Pour le développement
    this.pendingTasks = this.pendingTasks.filter(task => task.id !== taskId);
    this.dailyStats.pendingTasks = this.pendingTasks.length;
    console.log(`Task ${taskId} marked as complete`);
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
      case 'success': 
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
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
}