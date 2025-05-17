import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Type definitions for proper typing
interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  userGrowth: number;
  totalTransactions: number;
  transactionVolume: number;
  volumeChange: number;
  systemUptime: number;
  alertsCount: number;
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
    totalUsers: 254,
    activeUsers: 142,
    userGrowth: 5.3,
    totalTransactions: 1876,
    transactionVolume: 532456.78,
    volumeChange: 7.2,
    systemUptime: 99.97,
    alertsCount: 2
  };
  
  // Recent activities with proper typing
  recentActivities: AdminActivity[] = [
    {
      id: 'ACT001',
      user: 'Nick Karam',
      action: 'Password Reset',
      date: new Date(2023, 4, 12),
      status: 'Completed',
      icon: 'fa-solid fa-key'
    },
    {
      id: 'ACT002',
      user: 'Sarah Johnson',
      action: 'Account Creation',
      date: new Date(2023, 4, 11),
      status: 'Completed',
      icon: 'fa-solid fa-user-plus'
    },
    {
      id: 'ACT003',
      user: 'Michael Brown',
      action: 'Failed Login Attempt',
      date: new Date(2023, 4, 10),
      status: 'Alert',
      icon: 'fa-solid fa-triangle-exclamation'
    },
    {
      id: 'ACT004',
      user: 'Emma Wilson',
      action: 'Profile Update',
      date: new Date(2023, 4, 9),
      status: 'Completed',
      icon: 'fa-solid fa-pen-to-square'
    }
  ];
  
  // User growth chart data with proper typing
  userChartData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'New Users',
        data: [28, 35, 32, 37, 43],
        color: '#4F46E5'
      }
    ]
  };
  
  // Transaction volume chart data with proper typing
  transactionChartData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Volume (€)',
        data: [452300, 489700, 502300, 521400, 532400],
        color: '#10B981'
      }
    ]
  };

  // Loading states to handle async data loading
  loading = {
    stats: false,
    activities: false,
    charts: false
  };

  // Error states to handle failed data loading
  error = {
    stats: false,
    activities: false,
    charts: false
  };
  
  constructor() {}

  ngOnInit(): void {
    // In production, these would fetch data from services
    // this.loadSystemStats();
    // this.loadRecentActivities();
    // this.loadChartData();
  }

  // Methods that would be implemented to load data from services
  loadSystemStats(): void {
    // Example implementation that would be used with real services
    this.loading.stats = true;
    this.error.stats = false;
    
    // Example service call
    // this.adminService.getSystemStats().pipe(
    //   catchError(err => {
    //     console.error('Error loading system stats', err);
    //     this.error.stats = true;
    //     return of(null);
    //   })
    // ).subscribe(stats => {
    //   if (stats) {
    //     this.systemStats = stats;
    //   }
    //   this.loading.stats = false;
    // });
  }

  loadRecentActivities(): void {
    // Would be implemented with real service
  }

  loadChartData(): void {
    // Would be implemented with real service
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
    return 'text-gray-600';
  }
  
  exportData(): void {
    alert('Exporting data...');
    // Implement export functionality
    // In production:
    // this.adminService.exportDashboardData().subscribe(response => {
    //   // Handle download of exported data
    //   const blob = new Blob([response], { type: 'application/pdf' });
    //   const url = window.URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = `admin-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    //   a.click();
    //   window.URL.revokeObjectURL(url);
    // });
  }
}