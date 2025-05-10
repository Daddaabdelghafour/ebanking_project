import { Routes } from '@angular/router';
import { ClientLayoutComponent } from './layouts/client-layout/client-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AgentLayoutComponent } from './layouts/agent-layout/agent-layout.component';

export const routes: Routes = [
  // Client routes with the client layout
  {
    path: '',
    component: ClientLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/client/client-page/client-page.component')
          .then(c => c.ClientPageComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Admin routes with admin layout
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component')
          .then(c => c.AdminDashboardComponent)
      },
      {
        path: 'currencies',
        loadComponent: () => import('./features/admin/currency/currency.component')
          .then(c => c.CurrencyComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Bank Agent routes with bank agent layout
  {
    path: 'bank-agent',
    component: AgentLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/bank-agent/agent-dashboard/agent-dashboard.component')
          .then(c => c.AgentDashboardComponent)
      },
      {
        path: 'client-enrollment',
        loadComponent: () => import('./features/bank-agent/client-enrollement/client-enrollement.component')
          .then(c => c.ClientEnrollmentComponent)
      },
      {
        path: 'transaction-verification',
        loadComponent: () => import('./features/bank-agent/transaction-verification/transaction-verification.component')
          .then(c => c.TransactionVerificationComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/bank-agent/bank-agent-settings/bank-agent-settings.component')
          .then(c => c.BankAgentSettingsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/bank-agent/bank-agent-profile/bank-agent-profile.component')
          .then(c => c.BankAgentProfileComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Fallback route
  { path: '**', redirectTo: '/dashboard' }
];