import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

// Type definitions for proper typing
interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  userGrowth: number;
  systemUptime: number;
  alertsCount: number;
  totalClients?: number;
  verifiedClients?: number;
  totalAccounts?: number;
  activeAccounts?: number;
}

interface AdminActivity {
  id?: string;
  user: string;
  action: string;
  date: Date;
  status: 'Completed' | 'Pending' | 'Alert' | 'Failed';
  icon: string;
}

interface ChartDataset {
  label: string;
  data: number[];
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  currentDate = new Date();
  currentAdminName = 'Admin User';
  
  // System statistics with proper typing
  systemStats: SystemStats = {
    totalUsers: 0,
    activeUsers: 0,
    userGrowth: 0,
    systemUptime: 99.97, // Hardcoded as this might not come from API
    alertsCount: 0,
    totalClients: 0,
    verifiedClients: 0,
    totalAccounts: 0,
    activeAccounts: 0
  };
  
  // Recent activities with proper typing
  recentActivities: AdminActivity[] = [];
  
  // Recent users
  recentUsers: any[] = [];
  
  // User growth chart data with proper typing
  userChartData: ChartData = {
    labels: [],
    datasets: [
      {
        label: 'New Users',
        data: [],
        color: '#4F46E5'
      }
    ]
  };
  
  // Loading states to handle async data loading
  loading = {
    stats: false,
    activities: false,
    charts: false,
    users: false
  };

  // Error states to handle failed data loading
  error = {
    stats: false,
    activities: false,
    charts: false,
    users: false
  };
  
  private apiUrl = 'http://localhost:8085/E-BANKING1/api';
  
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAllDashboardData();
  }

  loadAllDashboardData(): void {
    this.loadSystemStats();
    this.loadRecentActivities();
    this.loadChartData();
    this.loadRecentUsers();
  }

  loadSystemStats(): void {
    this.loading.stats = true;
    this.error.stats = false;
    
    forkJoin({
      users: this.http.get<any[]>(`${this.apiUrl}/users`).pipe(catchError(() => of([]))),
      clients: this.http.get<any[]>(`${this.apiUrl}/clients`).pipe(catchError(() => of([]))),
      accounts: this.http.get<any[]>(`${this.apiUrl}/accounts`).pipe(catchError(() => of([])))
    }).pipe(
      catchError(err => {
        console.error('Error loading system stats', err);
        this.error.stats = true;
        return of({
          users: [],
          clients: [],
          accounts: []
        });
      }),
      finalize(() => {
        this.loading.stats = false;
      })
    ).subscribe(data => {
      const activeUsers = data.users.filter(user => user.isActive).length;
      const verifiedClients = data.clients.filter(client => 
        client.isVerified || client.status === 'verified').length;
      const activeAccounts = data.accounts.filter(account => 
        account.status === 'active' || account.isActive).length;
      
      // Calculate user growth rate (last month vs previous month)
      const userGrowth = this.calculateUserGrowth(data.users);
      
      // Update system stats
      this.systemStats = {
        totalUsers: data.users.length,
        activeUsers: activeUsers,
        userGrowth: userGrowth,
        systemUptime: 99.97, // Usually from a dedicated monitoring service
        alertsCount: this.countSystemAlerts(data),
        totalClients: data.clients.length,
        verifiedClients: verifiedClients,
        totalAccounts: data.accounts.length,
        activeAccounts: activeAccounts
      };
    });
  }

  loadRecentUsers(): void {
    this.loading.users = true;
    this.error.users = false;
    
    this.http.get<any[]>(`${this.apiUrl}/users`).pipe(
      map(users => {
        // Sort by creation date (newest first) and take first 5
        return users.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        }).slice(0, 5);
      }),
      catchError(err => {
        console.error('Error loading recent users', err);
        this.error.users = true;
        return of([]);
      }),
      finalize(() => {
        this.loading.users = false;
      })
    ).subscribe(users => {
      this.recentUsers = users;
    });
  }

  loadRecentActivities(): void {
    this.loading.activities = true;
    this.error.activities = false;
    
    // Try to get security logs if endpoint exists
    this.http.get<any[]>(`${this.apiUrl}/security-logs`).pipe(
      catchError(() => {
        // If endpoint doesn't exist, try audit logs
        return this.http.get<any[]>(`${this.apiUrl}/audit-logs`).pipe(
          catchError(() => {
            // If that also fails, use mock data
            return of([]);
          })
        );
      }),
      finalize(() => {
        this.loading.activities = false;
      })
    ).subscribe(logs => {
      if (logs && logs.length) {
        this.recentActivities = logs.slice(0, 5).map(log => this.convertLogToActivity(log));
      } else {
        // Use mock data if no logs are found
        this.recentActivities = this.getMockActivities();
      }
    });
  }

  loadChartData(): void {
    this.loading.charts = true;
    this.error.charts = false;
    
    // Try to get analytics data if endpoint exists
    this.http.get<any>(`${this.apiUrl}/analytics/users-by-month`).pipe(
      catchError(() => {
        // If endpoint doesn't exist, generate mock chart data
        return of(null);
      }),
      finalize(() => {
        this.loading.charts = false;
      })
    ).subscribe(data => {
      if (data) {
        // Real data from API
        this.userChartData = {
          labels: data.labels,
          datasets: [{
            label: 'New Users',
            data: data.data,
            color: '#4F46E5'
          }]
        };
      } else {
        // Mock data when API endpoint doesn't exist
        this.userChartData = {
          labels: this.getDefaultMonths(),
          datasets: [{
            label: 'New Users',
            data: [28, 35, 32, 37, 43],
            color: '#4F46E5'
          }]
        };
      }
    });
  }
  
  // Helper functions
  private calculateUserGrowth(users: any[]): number {
    // A simple calculation based on creation dates
    // In a real app, you would compare current month to previous month
    
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(now.getMonth() - 2);
    
    const currentMonthUsers = users.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= oneMonthAgo && createdAt <= now;
    }).length;
    
    const previousMonthUsers = users.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= twoMonthsAgo && createdAt < oneMonthAgo;
    }).length;
    
    if (previousMonthUsers === 0) return currentMonthUsers > 0 ? 100 : 0;
    
    const growthRate = ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100;
    return parseFloat(growthRate.toFixed(1));
  }
  
  private countSystemAlerts(data: any): number {
    // Count various types of alerts (this is a simplified example)
    let alertCount = 0;
    
    // Count inactive users who were previously active
    const inactiveUsers = data.users.filter((user: any) => !user.isActive && user.lastLogin).length;
    
    // Count unverified clients
    const unverifiedClients = data.clients.filter((client: any) => 
      !client.isVerified && client.createdAt && 
      new Date(client.createdAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 // Older than 7 days
    ).length;
    
    // Count inactive accounts
    const inactiveAccounts = data.accounts.filter((account: any) => 
      account.status === 'inactive' || !account.isActive
    ).length;
    
    alertCount = inactiveUsers + unverifiedClients + inactiveAccounts;
    return alertCount;
  }
  
  private convertLogToActivity(log: any): AdminActivity {
    let icon = 'fas fa-circle-info';
    let status: 'Completed' | 'Pending' | 'Alert' | 'Failed' = 'Completed';
    
    // Map log actions to icons and status
    if (log.action?.toLowerCase().includes('login') || log.type?.toLowerCase().includes('login')) {
      icon = 'fas fa-key';
      status = log.success ? 'Completed' : 'Failed';
    } else if (log.action?.toLowerCase().includes('creat') || log.action?.toLowerCase().includes('register')) {
      icon = 'fas fa-user-plus';
    } else if (log.action?.toLowerCase().includes('fail') || log.action?.toLowerCase().includes('error')) {
      icon = 'fas fa-triangle-exclamation';
      status = 'Alert';
    } else if (log.action?.toLowerCase().includes('updat') || log.action?.toLowerCase().includes('edit')) {
      icon = 'fas fa-pen-to-square';
    }
    
    return {
      id: log.id,
      user: log.user || log.userId || log.username || 'Unknown User',
      action: log.action || log.description || 'System Action',
      date: new Date(log.timestamp || log.date || log.createdAt),
      status: status,
      icon: icon
    };
  }
  
  private getMockActivities(): AdminActivity[] {
    return [
      {
        id: 'ACT001',
        user: 'Nick Karam',
        action: 'Réinitialisation de mot de passe',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        status: 'Completed',
        icon: 'fas fa-key'
      },
      {
        id: 'ACT002',
        user: 'Sarah Johnson',
        action: 'Création de compte',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        status: 'Completed',
        icon: 'fas fa-user-plus'
      },
      {
        id: 'ACT003',
        user: 'Michael Brown',
        action: 'Tentative de connexion échouée',
        date: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
        status: 'Failed',
        icon: 'fas fa-triangle-exclamation'
      },
      {
        id: 'ACT004',
        user: 'Emma Wilson',
        action: 'Mise à jour du profil',
        date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        status: 'Completed',
        icon: 'fas fa-pen-to-square'
      }
    ];
  }
  
  private getDefaultMonths(): string[] {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    
    const result = [];
    for (let i = 4; i >= 0; i--) {
      let monthIndex = (currentMonth - i) % 12;
      if (monthIndex < 0) monthIndex += 12;
      result.push(months[monthIndex]);
    }
    
    return result;
  }
  
  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Alert':
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  getIconClass(icon: string): string {
    if (icon.includes('key')) return 'text-yellow-600';
    if (icon.includes('user-plus')) return 'text-green-600';
    if (icon.includes('triangle')) return 'text-red-600';
    if (icon.includes('pen')) return 'text-blue-600';
    if (icon.includes('server')) return 'text-purple-600';
    if (icon.includes('users')) return 'text-blue-600';
    return 'text-gray-600';
  }
  
  exportData(): void {
    // Prepare data for export
    const exportData = {
      systemStats: this.systemStats,
      recentActivities: this.recentActivities,
      recentUsers: this.recentUsers,
      userChart: this.userChartData,
      exportDate: new Date().toISOString(),
      generatedBy: this.currentAdminName
    };
    
    // In a real application with API, you would do:
    /*
    this.http.post(`${this.apiUrl}/reports/export`, exportData, { responseType: 'blob' })
      .subscribe({
        next: (response: Blob) => {
          const url = window.URL.createObjectURL(response);
          const a = document.createElement('a');
          a.href = url;
          a.download = `admin-report-${new Date().toISOString().slice(0, 10)}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: (err) => {
          console.error('Error exporting report', err);
          alert('Failed to export data. Please try again later.');
        }
      });
    */
    
    // For now, just show alert and log data
    console.log('Export data:', exportData);
    alert('Rapport exporté (simulation). Données disponibles dans la console.');
  }
}