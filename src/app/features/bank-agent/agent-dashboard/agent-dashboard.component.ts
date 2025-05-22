import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Task } from '../../../shared/models/task.model';
import { TaskService } from '../../../services/task/task.service';
import { ClientService } from '../../../services/client/client.service';
import { Client } from '../../../shared/models/client.model';
import { Announcement } from '../../../shared/models/Announcement.model';
import { TransactionVerification, createVerificationTransaction } from '../../../shared/models/transactionVerification';
import { catchError, finalize, tap, switchMap } from 'rxjs/operators';
import { of, Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
export class AgentDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // États de chargement
  isLoadingTasks = false;
  isLoadingClients = false;
  isLoadingTransactions = false;
  
  // Messages d'erreur
  errorMessage = '';

  // Agent information - À obtenir depuis un service d'authentification
  agentInfo: AgentInfo = {
    name: 'Sarah Martin',
    branch: 'Agence Casablanca Centre',
    dailyGoal: 85,
    dailyProgress: 62
  };

  // Map client ID -> nom complet (à remplir dynamiquement)
  clientMap: { [key: string]: string } = {};

  // Daily statistics (à obtenir depuis un service de statistiques)
  dailyStats: DailyStats = {
    clientsServed: 0,
    transactionsProcessed: 0,
    newAccounts: 0,
    pendingTasks: 0
  };

  // Tasks to complete
  pendingTasks: Task[] = [];
  
  // Recent clients
  recentClients: Client[] = [];
  
  // Transactions requiring verification
  pendingTransactions: TransactionVerification[] = [];

  // Announcements
  announcements: Announcement[] = [];

  // Current date for the greeting
  currentDate = new Date();
  
  // Time periods
  timePeriods = ['Aujourd\'hui', 'Cette Semaine', 'Ce Mois'];
  selectedPeriod = 'Aujourd\'hui';

  constructor(
    private taskService: TaskService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge toutes les données du tableau de bord
   */
  loadDashboardData(): void {
    // Utilisation de forkJoin pour charger les données en parallèle
    forkJoin({
      tasks: this.loadTasksData(),
      clients: this.loadClientsData(),
      transactions: this.loadTransactionsData(),
      announcements: this.loadAnnouncementsData()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        // Les données sont déjà mises à jour par les fonctions individuelles
        console.log('Dashboard data loaded successfully');
      },
      error: (error) => {
        console.error('Error loading dashboard data', error);
        this.errorMessage = 'Erreur lors du chargement des données du tableau de bord';
      }
    });
  }

  /**
   * Charge les tâches et retourne un observable
   */
  private loadTasksData() {
    this.isLoadingTasks = true;
    this.errorMessage = '';
    
    return this.taskService.getTasksByAgent('AGT001').pipe(
      tap(tasks => {
        this.pendingTasks = tasks.filter(task => 
          task.status !== 'completed' && task.status !== 'cancelled'
        );
        this.dailyStats.pendingTasks = this.pendingTasks.length;
        
        // Construire la map client ID -> nom pour les références rapides
        this.updateClientMap();
      }),
      catchError(error => {
        console.error('Error loading tasks', error);
        this.errorMessage = 'Erreur lors du chargement des tâches';
        return of([]);
      }),
      finalize(() => {
        this.isLoadingTasks = false;
      })
    );
  }
  
  /**
   * Met à jour la map des clients pour les références rapides
   */
  private updateClientMap() {
    // Ajoutez les clients depuis les tâches en cours
    this.pendingTasks.forEach(task => {
      if (task.client_id && !this.clientMap[task.client_id]) {
        // Pour chaque client_id inconnu, récupérer les détails du client
        this.clientService.getClientByClientId(task.client_id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(client => {
            if (client) {
              this.clientMap[task.client_id] = `${client.firstName} ${client.lastName}`;
            }
          });
      }
    });
  }
  
  /**
   * Charge les clients récents et retourne un observable
   */
  private loadClientsData() {
    this.isLoadingClients = true;
    
    return this.clientService.getRecentClients(5).pipe(
      tap(clients => {
        this.recentClients = clients;
        
        // Ajouter les clients récents à la carte de référence
        clients.forEach(client => {
          if (client.id) {
            this.clientMap[client.id] = `${client.firstName} ${client.lastName}`;
          }
          if (client.clientId) {
            this.clientMap[client.clientId] = `${client.firstName} ${client.lastName}`;
          }
        });
      }),
      catchError(error => {
        console.error('Error loading recent clients', error);
        return of([]);
      }),
      finalize(() => {
        this.isLoadingClients = false;
      })
    );
  }
  
  /**
   * Charge les transactions en attente et retourne un observable
   * Note: Remplacer par un vrai service de transactions quand disponible
   */
  private loadTransactionsData() {
    this.isLoadingTransactions = true;
    
    // À remplacer par un appel API réel via un service de transactions
    return of(this.getPendingTransactionsMock()).pipe(
      tap(transactions => {
        this.pendingTransactions = transactions;
      }),
      catchError(error => {
        console.error('Error loading transactions', error);
        return of([]);
      }),
      finalize(() => {
        this.isLoadingTransactions = false;
      })
    );
  }
  
  /**
   * Charge les annonces et retourne un observable
   * Note: Remplacer par un vrai service d'annonces quand disponible
   */
  private loadAnnouncementsData() {
    // À remplacer par un appel API réel via un service d'annonces
    return of(this.getAnnouncementsMock()).pipe(
      tap(announcements => {
        this.announcements = announcements;
      }),
      catchError(error => {
        console.error('Error loading announcements', error);
        return of([]);
      })
    );
  }

  /**
   * Marque une tâche comme terminée
   */
  markTaskComplete(taskId: string): void {
    if (!taskId) return;
    
    this.taskService.updateTaskStatus(taskId, 'completed').pipe(
      tap(() => {
        this.pendingTasks = this.pendingTasks.filter(task => task.id !== taskId);
        this.dailyStats.pendingTasks = this.pendingTasks.length;
        
        // Mise à jour des statistiques
        this.dailyStats.transactionsProcessed++;
        this.agentInfo.dailyProgress = Math.min(
          Math.round((this.agentInfo.dailyProgress + 5) * 10) / 10, 
          100
        ); 
      }),
      catchError(error => {
        console.error(`Error marking task ${taskId} as complete`, error);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }
  
  /**
   * Approbation d'une transaction en attente
   */
  approveTransaction(transactionId: string): void {
    const transactionIndex = this.pendingTransactions.findIndex(t => t.id === transactionId);
    if (transactionIndex === -1) return;
    
    // Mise à jour locale temporaire
    this.pendingTransactions[transactionIndex].status = 'pending';
    this.dailyStats.transactionsProcessed++;
    
    // Pour une implémentation réelle, appeler un service
    // this.transactionService.approveTransaction(transactionId).pipe(
    //   takeUntil(this.destroy$)
    // ).subscribe({
    //   next: () => {
    //     // Retirer la transaction après un court délai pour l'UX
    //     setTimeout(() => {
    //       this.pendingTransactions = this.pendingTransactions.filter(t => t.id !== transactionId);
    //     }, 2000);
    //   },
    //   error: (error) => {
    //     console.error(`Error approving transaction ${transactionId}`, error);
    //     this.pendingTransactions[transactionIndex].status = 'pending';
    //   }
    // });
    
    // Simulation pour le développement
    setTimeout(() => {
      this.pendingTransactions = this.pendingTransactions.filter(t => t.id !== transactionId);
    }, 2000);
  }
  
  /**
   * Rejet d'une transaction en attente
   */
  /**
 * Rejet d'une transaction en attente
 */
rejectTransaction(transactionId: string): void {
  const transactionIndex = this.pendingTransactions.findIndex(t => t.id === transactionId);
  if (transactionIndex === -1) return;
  
  // Mise à jour locale temporaire
  this.pendingTransactions[transactionIndex].status = 'pending';
  this.dailyStats.transactionsProcessed++;
  
  // Pour une implémentation réelle, appeler un service
  // this.transactionService.rejectTransaction(transactionId).pipe(
  //   takeUntil(this.destroy$)
  // ).subscribe({
  //   next: () => {
  //     // Retirer la transaction après un court délai pour l'UX
  //     setTimeout(() => {
  //       this.pendingTransactions = this.pendingTransactions.filter(t => t.id !== transactionId);
  //     }, 2000);
  //   },
  //   error: (error) => {
  //     console.error(`Error rejecting transaction ${transactionId}`, error);
  //     this.pendingTransactions[transactionIndex].status = 'pending';
  //   }
  // });
  
  // Simulation pour le développement
  setTimeout(() => {
    this.pendingTransactions = this.pendingTransactions.filter(t => t.id !== transactionId);
  }, 2000);
}

  /**
   * Récupère le nom d'un client à partir de son ID
   */
  getClientName(clientId: string): string {
    return this.clientMap[clientId] || clientId;
  }

  /**
   * Détermine la période de la journée pour le message d'accueil
   */
  getDayPeriod(): string {
    const hour = this.currentDate.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  /**
   * Formate une date en format français
   */
  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch (e) {
      console.error('Error formatting date', e);
      return '-';
    }
  }

  /**
   * Formate une heure en format français
   */
  formatTime(date: Date | string | undefined): string {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error formatting time', e);
      return '-';
    }
  }

  /**
   * Formate une date et heure en format français
   */
  formatDateTime(date: Date | string | undefined): string {
    if (!date) return '-';
    return `${this.formatDate(date)} à ${this.formatTime(date)}`;
  }

  /**
   * Retourne la classe CSS pour la priorité
   */
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatusClass(status: string | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      case 'success': 
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Retourne l'icône pour la priorité
   */
  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high': return 'fa-solid fa-circle-exclamation';
      case 'medium': return 'fa-solid fa-circle-info';
      case 'low': return 'fa-solid fa-circle-check';
      default: return 'fa-solid fa-circle';
    }
  }
  
  /**
   * Retourne la classe CSS pour un montant (positif/négatif)
   */
  getAmountClass(amount: number): string {
    return amount < 0 ? 'text-red-600' : 'text-green-600';
  }
  
  /**
   * Formate un montant en devise
   */
  /**
 * Formate un montant en devise
 */
formatCurrency(amount: number | undefined, currency: string = 'MAD'): string {
  if (amount === undefined || amount === null) return '-';
  try {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currency || 'MAD' // Ajouter une valeur par défaut si currency est undefined
    }).format(amount);
  } catch (e) {
    console.error('Error formatting currency', e);
    return amount.toString();
  }
}
  
  /**
   * Change la période de temps sélectionnée et met à jour les données
   */
  changeTimePeriod(period: string): void {
    if (this.selectedPeriod === period) return;
    
    this.selectedPeriod = period;
    this.loadDashboardData();
  }
  
  /**
   * Récupère le client complet à partir de son ID
   */
  getClientById(clientId: string): Client | undefined {
    return this.recentClients.find(client => client.id === clientId || client.clientId === clientId);
  }
  
  /**
   * Méthode temporaire pour générer des transactions en attente
   * À remplacer par un appel API réel
   */
  private getPendingTransactionsMock(): TransactionVerification[] {
    return [
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
  }
  
  /**
   * Méthode temporaire pour générer des annonces
   * À remplacer par un appel API réel
   */
  private getAnnouncementsMock(): Announcement[] {
    return [
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
  }
}