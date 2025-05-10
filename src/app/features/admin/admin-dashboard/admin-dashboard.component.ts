import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  currentDate = new Date();
  currentAdminName = 'Admin User';
  
  // System statistics
  systemStats = {
    totalUsers: 254,
    activeUsers: 142,
    userGrowth: 5.3,
    totalTransactions: 1876,
    transactionVolume: 532456.78,
    volumeChange: 7.2,
    systemUptime: 99.97,
    alertsCount: 2
  };
  
  // Recent activities
  recentActivities = [
    {
      user: 'Nick Karam',
      action: 'Password Reset',
      date: new Date(2023, 4, 12),
      status: 'Completed',
      icon: 'fa-solid fa-key'
    },
    {
      user: 'Sarah Johnson',
      action: 'Account Creation',
      date: new Date(2023, 4, 11),
      status: 'Completed',
      icon: 'fa-solid fa-user-plus'
    },
    {
      user: 'Michael Brown',
      action: 'Failed Login Attempt',
      date: new Date(2023, 4, 10),
      status: 'Alert',
      icon: 'fa-solid fa-triangle-exclamation'
    },
    {
      user: 'Emma Wilson',
      action: 'Profile Update',
      date: new Date(2023, 4, 9),
      status: 'Completed',
      icon: 'fa-solid fa-pen-to-square'
    }
  ];
  
  // Pending approvals
  pendingApprovals = [
    {
      id: 'TR78945',
      type: 'Large Withdrawal',
      amount: 15000,
      requester: 'Nick Karam',
      date: new Date(2023, 4, 12),
      status: 'Pending Review'
    },
    {
      id: 'TR78946',
      type: 'New Account',
      amount: null,
      requester: 'Sarah Johnson',
      date: new Date(2023, 4, 11),
      status: 'Pending Review'
    },
    {
      id: 'TR78947',
      type: 'Wire Transfer',
      amount: 7500,
      requester: 'Michael Brown',
      date: new Date(2023, 4, 10),
      status: 'Pending Review'
    }
  ];
  
  // User growth chart data
  userChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'New Users',
        data: [28, 35, 32, 37, 43],
        color: '#4F46E5'
      }
    ]
  };
  
  // Transaction volume chart data
  transactionChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Volume (€)',
        data: [452300, 489700, 502300, 521400, 532400],
        color: '#10B981'
      }
    ]
  };
  
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
      case 'Pending Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Alert':
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
  
  exportData() {
    alert('Exporting data...');
    // Implement export functionality
  }
  
  approveRequest(id: string) {
    alert(`Approving request ${id}`);
    // Implement approval logic
  }
  
  rejectRequest(id: string) {
    alert(`Rejecting request ${id}`);
    // Implement rejection logic
  }
}