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
      {
        path: 'accounts',
        loadComponent: () => import('./features/client/accounts/accounts.component')
          .then(c => c.AccountsComponent)
      },
      {
        path: 'transfers',
        loadComponent: () => import('./features/client/transfers/transfers.component')
          .then(c => c.TransfersComponent)
      },
      {
        path: 'crypto',
        loadComponent: () => import('./features/client/crypto-wallet/crypto-wallet.component')
          .then(c => c.CryptoWalletComponent)
      },
      {
        path: 'referrals',
        loadComponent: () => import('./features/client/referrals/referrals.component')
          .then(c => c.ReferralsComponent)
      },
      {
        path: 'bills',
        loadComponent: () => import('./features/client/bills/bills.component')
          .then(c => c.BillsComponent)
      },
      {
        path: 'recharges',
        loadComponent: () => import('./features/client/recharges/recharges.component')
          .then(c => c.RechargesComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/client/settings/settings.component')
          .then(c => c.SettingsComponent)
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
      {
        path: 'client-management',
        loadComponent: () => import('./features/admin/client-management/client-management.component')
          .then(c => c.ClientManagementComponent)
      },
      {
        path: 'agent-management',
        loadComponent: () => import('./features/admin/agent-management/agent-management.component')
          .then(c => c.AgentManagementComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
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
  { path: '**', redirectTo: '/dashboard' }
];