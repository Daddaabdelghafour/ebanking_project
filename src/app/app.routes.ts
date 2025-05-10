import { Routes } from '@angular/router';
import { ClientLayoutComponent } from './layouts/client-layout/client-layout.component';

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
      // You can add more routes as you implement them
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Fallback route
  { path: '**', redirectTo: '/dashboard' }
];